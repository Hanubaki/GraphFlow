/**
 * SaaS Monetization, Tier Entitlements & Lemon Squeezy Billing Engine.
 * Adheres to monetization-billing standards: overlay checkout, tier gating, and portal management.
 */

import { PlanTier } from '../types/auth';

export type FeatureKey =
  | 'cloud_sync_unlimited'
  | 'ai_generation_unlimited'
  | 'multiplayer_collaboration'
  | 'terraform_export'
  | 'docker_export'
  | 'circuit_breakers'
  | 'live_telemetry_stream';

export interface TierEntitlement {
  maxCloudProjects: number;
  maxDailyAiPrompts: number;
  maxCollaborators: number;
  canExportTerraform: boolean;
  canExportDocker: boolean;
  canSimulateCircuitBreakers: boolean;
  canStreamLiveTelemetry: boolean;
}

export const TIER_LIMITS: Record<PlanTier, TierEntitlement> = {
  free: {
    maxCloudProjects: 3,
    maxDailyAiPrompts: 10,
    maxCollaborators: 2,
    canExportTerraform: false,
    canExportDocker: true,
    canSimulateCircuitBreakers: true,
    canStreamLiveTelemetry: false,
  },
  pro: {
    maxCloudProjects: 1000,
    maxDailyAiPrompts: 500,
    maxCollaborators: 10,
    canExportTerraform: true,
    canExportDocker: true,
    canSimulateCircuitBreakers: true,
    canStreamLiveTelemetry: true,
  },
  team: {
    maxCloudProjects: 10000,
    maxDailyAiPrompts: 5000,
    maxCollaborators: 100,
    canExportTerraform: true,
    canExportDocker: true,
    canSimulateCircuitBreakers: true,
    canStreamLiveTelemetry: true,
  },
};

export const LEMON_CONFIG = {
  proMonthlyUrl: 'https://graphflow.lemonsqueezy.com/checkout/buy/171c3132-5464-46eb-a519-b95c1e4bca8a',
  customerPortalUrl: 'https://app.lemonsqueezy.com/my-orders',
};

/**
 * Checks whether a given feature is allowed under the current plan tier.
 */
export function checkFeatureEntitlement(
  feature: FeatureKey,
  tier: PlanTier = 'free',
  currentCount?: number
): { allowed: boolean; reason?: string } {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  switch (feature) {
    case 'cloud_sync_unlimited':
      if (currentCount !== undefined && currentCount >= limits.maxCloudProjects) {
        return {
          allowed: false,
          reason: `Free tier is limited to ${limits.maxCloudProjects} cloud projects. Upgrade to Pro for unlimited cloud storage.`,
        };
      }
      return { allowed: true };

    case 'ai_generation_unlimited':
      if (currentCount !== undefined && currentCount >= limits.maxDailyAiPrompts) {
        return {
          allowed: false,
          reason: `Daily AI synthesis quota reached (${limits.maxDailyAiPrompts} per day). Upgrade to Pro for unlimited AI generation.`,
        };
      }
      return { allowed: true };

    case 'terraform_export':
      if (!limits.canExportTerraform) {
        return {
          allowed: false,
          reason: 'Terraform AWS Infrastructure export requires a Pro or Team plan.',
        };
      }
      return { allowed: true };

    case 'live_telemetry_stream':
      if (!limits.canStreamLiveTelemetry) {
        return {
          allowed: false,
          reason: 'Connecting a custom live production URL (ERP / REST API / Prometheus / WebSocket) requires a Pro or Team plan.',
        };
      }
      return { allowed: true };

    case 'docker_export':
      return { allowed: limits.canExportDocker };

    case 'circuit_breakers':
      return { allowed: limits.canSimulateCircuitBreakers };

    case 'multiplayer_collaboration':
      if (currentCount !== undefined && currentCount > limits.maxCollaborators) {
        return {
          allowed: false,
          reason: `Room capacity exceeded for ${tier} tier (max ${limits.maxCollaborators} peers).`,
        };
      }
      return { allowed: true };

    default:
      return { allowed: true };
  }
}

export const FIRST_TOUCH_STORAGE_KEY = 'graphflow_first_touch_v1';

export interface AcquisitionAttribution {
  source: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrerHost?: string;
  landingHash?: string;
  capturedAt: string;
}

const INTERNAL_HOSTS = ['graph-flow-virid.vercel.app', 'graphflow.dev', 'localhost', '127.0.0.1'];

/**
 * Pure helper to classify how a visitor discovered GraphFlow from URL query, referrer, and hash.
 */
export function resolveAcquisitionChannel(
  search = '',
  referrer = '',
  hash = ''
): AcquisitionAttribution {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const utmSource = (params.get('utm_source') || params.get('ref') || params.get('via') || params.get('source') || '')
    .trim()
    .toLowerCase();
  const utmMedium = (params.get('utm_medium') || '').trim().toLowerCase() || undefined;
  const utmCampaign = (params.get('utm_campaign') || '').trim().toLowerCase() || undefined;

  let referrerHost: string | undefined;
  if (referrer) {
    try {
      const parsed = new URL(referrer);
      const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
      if (host && !INTERNAL_HOSTS.some(internal => host === internal || host.endsWith(`.${internal}`))) {
        referrerHost = host;
      }
    } catch {
      // ignore malformed referrer URLs
    }
  }

  const rawSignal = utmSource || referrerHost || '';
  let source = 'direct';

  if (
    rawSignal === 't.co' ||
    rawSignal.includes('twitter') ||
    rawSignal === 'x.com' ||
    rawSignal === 'x' ||
    rawSignal === 'tw'
  ) {
    source = 'twitter_x';
  } else if (rawSignal.includes('github') || rawSignal === 'gh') {
    source = 'github';
  } else if (rawSignal.includes('reddit')) {
    source = 'reddit';
  } else if (rawSignal.includes('ycombinator') || rawSignal === 'hn' || rawSignal === 'hackernews') {
    source = 'hackernews';
  } else if (rawSignal.includes('linkedin') || rawSignal === 'lnkd.in') {
    source = 'linkedin';
  } else if (rawSignal.includes('youtube') || rawSignal === 'youtu.be') {
    source = 'youtube';
  } else if (rawSignal.includes('producthunt')) {
    source = 'producthunt';
  } else if (
    rawSignal.includes('google.') ||
    rawSignal.includes('bing.com') ||
    rawSignal.includes('duckduckgo.com')
  ) {
    source = 'organic_search';
  } else if (utmSource) {
    source = utmSource.replace(/[^a-z0-9_-]/g, '_').slice(0, 40);
  } else if (referrerHost) {
    source = referrerHost.replace(/[^a-z0-9._-]/g, '_').slice(0, 40);
  } else if (hash.includes('#share=') || hash.includes('#embed=')) {
    source = 'viral_share_link';
  }

  return {
    source,
    utmSource: utmSource || undefined,
    utmMedium,
    utmCampaign,
    referrerHost,
    landingHash: hash ? hash.slice(0, 32) : undefined,
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Captures and persists the visitor's first-touch acquisition channel in localStorage.
 */
export function captureFirstTouchAttribution(): AcquisitionAttribution {
  if (typeof window === 'undefined') {
    return resolveAcquisitionChannel();
  }

  const current = resolveAcquisitionChannel(
    window.location.search,
    typeof document !== 'undefined' ? document.referrer : '',
    window.location.hash
  );

  try {
    const existingRaw = window.localStorage.getItem(FIRST_TOUCH_STORAGE_KEY);
    if (existingRaw) {
      const existing = JSON.parse(existingRaw) as AcquisitionAttribution;
      if (existing && existing.source && (existing.source !== 'direct' || current.source === 'direct')) {
        return existing;
      }
    }
    window.localStorage.setItem(FIRST_TOUCH_STORAGE_KEY, JSON.stringify(current));
  } catch {
    // ignore storage quota / privacy mode errors
  }

  return current;
}

/**
 * Reads the persisted first-touch attribution (or captures it if not yet initialized).
 */
export function getFirstTouchAttribution(): AcquisitionAttribution {
  return captureFirstTouchAttribution();
}

/**
 * Generates official Lemon Squeezy checkout link with overlay embed, user attribution,
 * and first-touch acquisition channel metadata (`checkout[custom][acquisition_source]`).
 */
export function buildLemonCheckoutUrl(
  user?: { id: string; email?: string | null } | null,
  isAnnual = true,
  checkoutSurface = 'pricing_modal'
): string {
  const baseUrl = `${LEMON_CONFIG.proMonthlyUrl}?embed=1`;
  const params = new URLSearchParams();

  if (user?.id) {
    params.set('checkout[custom][user_id]', user.id);
  }
  if (user?.email) {
    params.set('checkout[email]', user.email);
  }
  params.set('checkout[custom][billing_cycle]', isAnnual ? 'annual' : 'monthly');

  const attribution = getFirstTouchAttribution();
  if (attribution.source) {
    params.set('checkout[custom][acquisition_source]', attribution.source);
  }
  if (checkoutSurface) {
    params.set('checkout[custom][checkout_surface]', checkoutSurface);
  }
  if (attribution.utmSource) {
    params.set('checkout[custom][utm_source]', attribution.utmSource);
  }
  if (attribution.utmCampaign) {
    params.set('checkout[custom][utm_campaign]', attribution.utmCampaign);
  }
  if (attribution.referrerHost) {
    params.set('checkout[custom][referrer]', attribution.referrerHost);
  }

  const query = params.toString();
  return query ? `${baseUrl}&${query}` : baseUrl;
}

/**
 * Customer billing portal link for subscription management and invoices.
 */
export function getCustomerBillingPortalUrl(): string {
  return LEMON_CONFIG.customerPortalUrl;
}
