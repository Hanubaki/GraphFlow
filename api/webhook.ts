import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Read raw body helper for Vercel Serverless
async function getRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const webhookSecret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables for Lemon Squeezy webhook.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const rawBody = typeof req.body === 'string' ? req.body : await getRawBody(req);
    const signature = req.headers['x-signature'];

    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing X-Signature header.' });
    }

    // Verify HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta?.event_name;
    const customData = payload.meta?.custom_data || {};
    const userId = customData.user_id;

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
      return res.status(200).json({ warning: 'User not found in payload' });
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
    return res.status(500).json({ error: error?.message || 'Internal server error' });
  }
}
