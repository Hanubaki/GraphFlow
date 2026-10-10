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
  | 'circuit_breakers';

export interface TierEntitlement {
  maxCloudProjects: number;
  maxDailyAiPrompts: number;
  maxCollaborators: number;
  canExportTerraform: boolean;
  canExportDocker: boolean;
  canSimulateCircuitBreakers: boolean;
}

export const TIER_LIMITS: Record<PlanTier, TierEntitlement> = {
  free: {
    maxCloudProjects: 3,
    maxDailyAiPrompts: 10,
    maxCollaborators: 2,
    canExportTerraform: false,
    canExportDocker: true,
    canSimulateCircuitBreakers: true,
  },
  pro: {
    maxCloudProjects: 1000,
    maxDailyAiPrompts: 500,
    maxCollaborators: 10,
    canExportTerraform: true,
    canExportDocker: true,
    canSimulateCircuitBreakers: true,
  },
  team: {
    maxCloudProjects: 10000,
    maxDailyAiPrompts: 5000,
    maxCollaborators: 100,
    canExportTerraform: true,
    canExportDocker: true,
    canSimulateCircuitBreakers: true,
  },
};

export const LEMON_CONFIG = {
  proMonthlyUrl: 'https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242',
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

/**
 * Generates official Lemon Squeezy checkout link with overlay embed and user attribution.
 */
export function buildLemonCheckoutUrl(
  user?: { id: string; email?: string | null } | null,
  isAnnual = true
): string {
  const baseUrl = `${LEMON_CONFIG.proMonthlyUrl}?embed=1`;
  const params = new URLSearchParams();

  if (user?.id) {
    params.set('checkout[custom][user_id]', user.id);
  }
  if (user?.email) {
    params.set('checkout[email]', user.email);
  }
  if (isAnnual) {
    params.set('checkout[custom][billing_cycle]', 'annual');
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
