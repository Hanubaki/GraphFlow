import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { createProblemDetails } from '../../api/problemDetails';
import {
  checkRateLimit,
  clearRateLimitStore,
  checkAndStoreIdempotency,
  clearIdempotencyStore,
} from '../../api/webhook';

describe('API Design & Security Contracts Suite', () => {
  beforeEach(() => {
    clearRateLimitStore();
    clearIdempotencyStore();
  });

  describe('1. RFC 7807 Problem Details Specifications', () => {
    it('creates compliant RFC 7807 JSON error objects with required attributes', () => {
      const error = createProblemDetails(
        429,
        'Rate Limit Exceeded',
        'Too many requests sent in a short interval.',
        'rate-limit-exceeded',
        '/api/webhook'
      );

      expect(error.type).toBe('https://api.graphflow.dev/errors/rate-limit-exceeded');
      expect(error.title).toBe('Rate Limit Exceeded');
      expect(error.status).toBe(429);
      expect(error.detail).toBe('Too many requests sent in a short interval.');
      expect(error.instance).toBe('/api/webhook');
      expect(typeof error.timestamp).toBe('string');
    });

    it('supports extensible custom error metadata', () => {
      const error = createProblemDetails(
        400,
        'Invalid Payload',
        'Node title cannot be empty.',
        'validation-error',
        '/api/projects',
        { invalidField: 'title' }
      );

      expect(error.status).toBe(400);
      expect(error.invalidField).toBe('title');
    });
  });

  describe('2. Idempotency & Deduplication Engine', () => {
    it('records new event keys and flags subsequent duplicate events', () => {
      const eventKey = 'evt_lemon_123456789';

      // First processing must not be duplicate
      const isDuplicateFirst = checkAndStoreIdempotency(eventKey);
      expect(isDuplicateFirst).toBe(false);

      // Second processing must immediately flag duplicate
      const isDuplicateSecond = checkAndStoreIdempotency(eventKey);
      expect(isDuplicateSecond).toBe(true);
    });

    it('clears idempotency memory store upon flush', () => {
      const eventKey = 'evt_test_999';
      expect(checkAndStoreIdempotency(eventKey)).toBe(false);
      expect(checkAndStoreIdempotency(eventKey)).toBe(true);

      clearIdempotencyStore();
      expect(checkAndStoreIdempotency(eventKey)).toBe(false);
    });
  });

  describe('3. Rate Limiting Status & Header Calibration', () => {
    it('calculates remaining requests and countdown reset window', () => {
      const client = '198.51.100.1';
      const status1 = checkRateLimit(client, 10, 60000);

      expect(status1.isThrottled).toBe(false);
      expect(status1.limit).toBe(10);
      expect(status1.remaining).toBe(9);
      expect(status1.resetSeconds).toBeGreaterThan(0);
      expect(status1.resetSeconds).toBeLessThanOrEqual(60);
    });

    it('accurately toggles isThrottled when limit is reached', () => {
      const client = '198.51.100.2';
      const limit = 3;

      for (let i = 0; i < limit; i++) {
        expect(checkRateLimit(client, limit, 10000).isThrottled).toBe(false);
      }

      const throttledStatus = checkRateLimit(client, limit, 10000);
      expect(throttledStatus.isThrottled).toBe(true);
      expect(throttledStatus.remaining).toBe(0);
    });
  });

  describe('4. Nginx & Vercel Security Alignment', () => {
    it('verifies nginx.conf enforces Content-Security-Policy and Permissions-Policy', () => {
      const nginxPath = path.resolve(__dirname, '../../nginx.conf');
      const nginxContent = fs.readFileSync(nginxPath, 'utf-8');

      expect(nginxContent).toContain('Content-Security-Policy');
      expect(nginxContent).toContain("default-src 'self'");
      expect(nginxContent).toContain('https://assets.lemonsqueezy.com');
      expect(nginxContent).toContain('https://*.supabase.co');
      expect(nginxContent).toContain('Permissions-Policy');
      expect(nginxContent).toContain('camera=()');
      expect(nginxContent).toContain('X-Frame-Options "SAMEORIGIN"');
      expect(nginxContent).toContain('X-Content-Type-Options "nosniff"');
    });
  });
});
