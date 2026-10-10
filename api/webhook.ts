import type { IncomingMessage } from 'http';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createProblemDetails } from './problemDetails';

export const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1 MB
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 60; // Max 60 requests per minute per IP
export const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour deduplication window

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface IdempotencyRecord {
  receivedAt: number;
  status: 'processed';
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const idempotencyStore = new Map<string, IdempotencyRecord>();

export interface RateLimitStatus {
  isThrottled: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export function checkRateLimit(
  identifier: string,
  limit: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitStatus {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return {
      isThrottled: false,
      limit,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (record.count >= limit) {
    return {
      isThrottled: true,
      limit,
      remaining: 0,
      resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
    };
  }

  record.count += 1;
  return {
    isThrottled: false,
    limit,
    remaining: Math.max(0, limit - record.count),
    resetSeconds: Math.max(1, Math.ceil((record.resetTime - now) / 1000)),
  };
}

export function isRateLimited(
  identifier: string,
  limit: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): boolean {
  return checkRateLimit(identifier, limit, windowMs).isThrottled;
}

export function clearRateLimitStore(): void {
  rateLimitStore.clear();
}

export function checkAndStoreIdempotency(key: string): boolean {
  const now = Date.now();
  const existing = idempotencyStore.get(key);
  if (existing && now - existing.receivedAt < IDEMPOTENCY_TTL_MS) {
    return true; // Already processed
  }
  idempotencyStore.set(key, { receivedAt: now, status: 'processed' });
  return false;
}

export function clearIdempotencyStore(): void {
  idempotencyStore.clear();
}

// Read raw body helper for Vercel Serverless with max size limit
export async function getRawBody(req: IncomingMessage, maxBytes = MAX_PAYLOAD_BYTES): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let receivedBytes = 0;

    req.on('data', chunk => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        return;
      }
      body += chunk;
    });

    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json(
      createProblemDetails(405, 'Method Not Allowed', `HTTP method ${req.method} is not supported. Use POST.`, 'method-not-allowed')
    );
  }

  // Rate limiting by client IP
  const clientIp = String(
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  ).split(',')[0].trim();

  const rateStatus = checkRateLimit(clientIp);
  res.setHeader?.('X-RateLimit-Limit', String(rateStatus.limit));
  res.setHeader?.('X-RateLimit-Remaining', String(rateStatus.remaining));
  res.setHeader?.('X-RateLimit-Reset', String(rateStatus.resetSeconds));

  if (rateStatus.isThrottled) {
    res.setHeader?.('Retry-After', String(rateStatus.resetSeconds));
    return res.status(429).json(
      createProblemDetails(429, 'Rate Limit Exceeded', 'Too many requests. Please slow down and retry later.', 'rate-limit-exceeded')
    );
  }

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables for Lemon Squeezy webhook.');
    return res.status(500).json(
      createProblemDetails(500, 'Server Misconfiguration', 'Missing critical server environment credentials.', 'server-misconfiguration')
    );
  }

  try {
    let rawBody: string;
    try {
      rawBody = typeof req.body === 'string' ? req.body : await getRawBody(req);
    } catch (readErr: any) {
      if (readErr?.message === 'PAYLOAD_TOO_LARGE') {
        return res.status(413).json(
          createProblemDetails(413, 'Payload Too Large', 'Payload exceeds maximum limit of 1MB.', 'payload-too-large')
        );
      }
      throw readErr;
    }

    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return res.status(413).json(
        createProblemDetails(413, 'Payload Too Large', 'Payload exceeds maximum limit of 1MB.', 'payload-too-large')
      );
    }

    const signature = req.headers['x-signature'];

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json(
        createProblemDetails(400, 'Bad Request', 'Missing required X-Signature header.', 'missing-signature')
      );
    }

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return res.status(401).json(
        createProblemDetails(401, 'Unauthorized', 'Invalid webhook signature.', 'invalid-signature')
      );
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};
    const userId = customData.user_id;

    // Strict Idempotency Check
    const eventId = String(
      req.headers['idempotency-key'] ||
      req.headers['x-event-id'] ||
      payload.meta?.event_id ||
      payload.data?.id ||
      ''
    );

    if (eventId && checkAndStoreIdempotency(eventId)) {
      return res.status(200).json({ received: true, idempotent: true });
    }

    const attributes = payload.data?.attributes || {};
    const customerId = String(attributes.customer_id || '');
    const subscriptionId = String(payload.data?.id || '');
    const status = attributes.status;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Determine target user
    let targetUserId = userId;

    if (!targetUserId && attributes.user_email) {
      // Fallback: match by email in profiles
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', attributes.user_email)
        .single();
      if (profile) {
        targetUserId = profile.id;
      }
    }

    if (!targetUserId) {
      console.warn('Webhook received but unable to locate corresponding user_id:', payload.meta);
      return res.status(200).json({ warning: 'User not found in payload', received: true });
    }

    // Process subscription events
    if (
      eventName === 'subscription_created' ||
      eventName === 'subscription_updated' ||
      eventName === 'order_created'
    ) {
      const isPaid = status === 'active' || status === 'paid' || eventName === 'order_created';

      await supabaseAdmin
        .from('profiles')
        .update({
          plan_tier: isPaid ? 'pro' : 'free',
          lemon_customer_id: customerId || undefined,
          lemon_subscription_id: subscriptionId || undefined,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      console.log(`Updated user ${targetUserId} plan_tier to ${isPaid ? 'pro' : 'free'}`);
    } else if (
      eventName === 'subscription_cancelled' ||
      eventName === 'subscription_expired'
    ) {
      await supabaseAdmin
        .from('profiles')
        .update({
          plan_tier: 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetUserId);

      console.log(`Downgraded user ${targetUserId} to free tier upon cancellation.`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing exception:', error);
    return res.status(500).json(
      createProblemDetails(500, 'Internal Server Error', error?.message || 'Internal server error', 'internal-error')
    );
  }
}
