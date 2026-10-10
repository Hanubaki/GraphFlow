import { describe, it, expect } from 'vitest';
import {
  checkFeatureEntitlement,
  buildLemonCheckoutUrl,
  getCustomerBillingPortalUrl,
  TIER_LIMITS,
} from '../services/billing';
import {
  findAdjacentNodeInDirection,
  getNextNodeInCycle,
} from '../utils/a11ySpatial';
import { a11yAnnouncer } from '../utils/a11yAnnouncer';
import { GraphNode } from '../types/graph';

describe('SaaS Monetization & Tier Gating Engine', () => {
  it('defines structured tier limits for Free, Pro, and Team', () => {
    expect(TIER_LIMITS.free.maxCloudProjects).toBe(3);
    expect(TIER_LIMITS.pro.maxCloudProjects).toBe(1000);
    expect(TIER_LIMITS.team.maxCloudProjects).toBe(10000);
    expect(TIER_LIMITS.pro.canExportTerraform).toBe(true);
    expect(TIER_LIMITS.free.canExportTerraform).toBe(false);
  });

  it('enforces Free tier project limits and allows Pro unlimited projects', () => {
    // Free tier: max 3 projects
    expect(checkFeatureEntitlement('cloud_sync_unlimited', 'free', 2).allowed).toBe(true);
    expect(checkFeatureEntitlement('cloud_sync_unlimited', 'free', 3).allowed).toBe(false);
    expect(checkFeatureEntitlement('cloud_sync_unlimited', 'free', 3).reason).toContain('limited to 3');

    // Pro tier: allows 50 projects
    expect(checkFeatureEntitlement('cloud_sync_unlimited', 'pro', 50).allowed).toBe(true);
  });

  it('gates Terraform IaC export for Free tier but allows for Pro and Team', () => {
    const freeCheck = checkFeatureEntitlement('terraform_export', 'free');
    expect(freeCheck.allowed).toBe(false);
    expect(freeCheck.reason).toContain('requires a Pro or Team plan');

    const proCheck = checkFeatureEntitlement('terraform_export', 'pro');
    expect(proCheck.allowed).toBe(true);

    const teamCheck = checkFeatureEntitlement('terraform_export', 'team');
    expect(teamCheck.allowed).toBe(true);
  });

  it('allows Docker Compose and Circuit Breakers for all tiers', () => {
    expect(checkFeatureEntitlement('docker_export', 'free').allowed).toBe(true);
    expect(checkFeatureEntitlement('circuit_breakers', 'free').allowed).toBe(true);
  });

  it('builds official Lemon Squeezy checkout URL with custom attributes and annual cycle', () => {
    const user = { id: 'usr-441', email: 'architect@example.com' };
    const url = buildLemonCheckoutUrl(user, true);

    expect(url).toContain('https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242');
    expect(url).toContain('embed=1');
    expect(url).toContain('checkout%5Bcustom%5D%5Buser_id%5D=usr-441');
    expect(url).toContain('checkout%5Bemail%5D=architect%40example.com');
    expect(url).toContain('checkout%5Bcustom%5D%5Bbilling_cycle%5D=annual');
  });

  it('returns valid customer billing portal URL', () => {
    const portalUrl = getCustomerBillingPortalUrl();
    expect(portalUrl).toBe('https://app.lemonsqueezy.com/my-orders');
  });
});

describe('Web Accessibility (a11y) & Spatial Keyboard Navigation', () => {
  const nodes: GraphNode[] = [
    {
      id: 'gateway',
      type: 'gateway',
      title: 'API Gateway',
      subtitle: 'Nginx',
      x: 100,
      y: 200,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 5,
      errorRate: 0,
      throughputRps: 1000,
      color: '#38bdf8',
      iconName: 'Globe',
    },
    {
      id: 'auth_service',
      type: 'service',
      title: 'Auth Service',
      subtitle: 'NodeJS',
      x: 400,
      y: 200,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 20,
      errorRate: 0,
      throughputRps: 500,
      color: '#818cf8',
      iconName: 'Cpu',
    },
    {
      id: 'db_primary',
      type: 'database',
      title: 'PostgreSQL',
      subtitle: 'Primary',
      x: 700,
      y: 100,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 15,
      errorRate: 0,
      throughputRps: 400,
      color: '#34d399',
      iconName: 'Database',
    },
    {
      id: 'cache_redis',
      type: 'cache',
      title: 'Redis Cache',
      subtitle: 'Cluster',
      x: 400,
      y: 400,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 2,
      errorRate: 0,
      throughputRps: 2000,
      color: '#f59e0b',
      iconName: 'Zap',
    },
  ];

  it('correctly finds adjacent nodes in spatial vector directions', () => {
    const gateway = nodes[0];
    const authService = nodes[1];

    // From Gateway, right node is Auth Service
    const rightOfGateway = findAdjacentNodeInDirection(gateway, nodes, 'right');
    expect(rightOfGateway).not.toBeNull();
    expect(rightOfGateway?.id).toBe('auth_service');

    // From Gateway, there is no node to the left
    const leftOfGateway = findAdjacentNodeInDirection(gateway, nodes, 'left');
    expect(leftOfGateway).toBeNull();

    // From Auth Service (x:400, y:200), down node is Redis Cache (x:400, y:400)
    const downOfAuth = findAdjacentNodeInDirection(authService, nodes, 'down');
    expect(downOfAuth).not.toBeNull();
    expect(downOfAuth?.id).toBe('cache_redis');

    // From Auth Service (x:400, y:200), right node is Database (x:700, y:100)
    const rightOfAuth = findAdjacentNodeInDirection(authService, nodes, 'right');
    expect(rightOfAuth).not.toBeNull();
    expect(rightOfAuth?.id).toBe('db_primary');

    // From Redis Cache (x:400, y:400), up node is Auth Service (x:400, y:200)
    const redis = nodes[3];
    const upOfRedis = findAdjacentNodeInDirection(redis, nodes, 'up');
    expect(upOfRedis).not.toBeNull();
    expect(upOfRedis?.id).toBe('auth_service');
  });

  it('cycles through nodes sequentially with Tab order', () => {
    // Next from gateway -> auth_service
    const next1 = getNextNodeInCycle(nodes, 'gateway');
    expect(next1?.id).toBe('auth_service');

    // Next from last node (cache_redis) -> wraps to gateway
    const nextLast = getNextNodeInCycle(nodes, 'cache_redis');
    expect(nextLast?.id).toBe('gateway');

    // Reverse cycle from gateway -> wraps to cache_redis
    const prevFirst = getNextNodeInCycle(nodes, 'gateway', true);
    expect(prevFirst?.id).toBe('cache_redis');

    // Default when no selection -> returns first node
    const defaultFirst = getNextNodeInCycle(nodes, null);
    expect(defaultFirst?.id).toBe('gateway');
  });

  it('creates screen reader live region with proper ARIA attributes', () => {
    a11yAnnouncer.announce('Testing announcement', 0);
    const liveEl = document.getElementById('graphflow-a11y-live-region');
    expect(liveEl).not.toBeNull();
    expect(liveEl?.getAttribute('role')).toBe('status');
    expect(liveEl?.getAttribute('aria-live')).toBe('polite');
    expect(liveEl?.getAttribute('aria-atomic')).toBe('true');
  });
});
