import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { sanitizeLabel, escapeXml, generateMarkdownDoc } from '../utils/export';
import { isRateLimited, clearRateLimitStore, MAX_PAYLOAD_BYTES } from '../../api/webhook';
import { GraphNode, GraphEdge } from '../types/graph';

describe('Enterprise Security & Hardening Suite', () => {
  beforeEach(() => {
    clearRateLimitStore();
  });

  describe('1. Vercel HTTP Security Headers & CSP Verification', () => {
    const vercelJsonPath = path.resolve(__dirname, '../../vercel.json');
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));

    it('contains global security headers configuration for all routes', () => {
      const globalHeaderEntry = vercelConfig.headers.find((entry: any) => entry.source === '/(.*)');
      expect(globalHeaderEntry).toBeDefined();

      const headers = globalHeaderEntry.headers;
      const headerMap = new Map(headers.map((h: any) => [h.key, h.value]));

      // Verify X-Content-Type-Options
      expect(headerMap.get('X-Content-Type-Options')).toBe('nosniff');

      // Verify X-Frame-Options
      expect(headerMap.get('X-Frame-Options')).toBe('SAMEORIGIN');

      // Verify Referrer-Policy
      expect(headerMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');

      // Verify Permissions-Policy
      expect(headerMap.get('Permissions-Policy')).toContain('camera=()');
      expect(headerMap.get('Permissions-Policy')).toContain('microphone=()');

      // Verify Content-Security-Policy
      const csp = headerMap.get('Content-Security-Policy') as string;
      expect(csp).toBeDefined();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('https://assets.lemonsqueezy.com');
      expect(csp).toContain('https://*.supabase.co');
      expect(csp).toContain('wss://*.supabase.co');
      expect(csp).toContain("frame-ancestors 'self'");
    });

    it('preserves immutable caching for static assets in /assets/(.*)', () => {
      const assetHeaderEntry = vercelConfig.headers.find((entry: any) => entry.source === '/assets/(.*)');
      expect(assetHeaderEntry).toBeDefined();
      const cacheControl = assetHeaderEntry.headers.find((h: any) => h.key === 'Cache-Control');
      expect(cacheControl.value).toContain('public, max-age=31536000, immutable');
    });
  });

  describe('2. Data Sanitization & Injection Prevention', () => {
    it('sanitizes malicious script tags and event handlers from node titles', () => {
      const malicious = '<script>alert("xss")</script>Service';
      const safe = sanitizeLabel(malicious);
      expect(safe).not.toContain('<script>');
      expect(safe).not.toContain('</script>');
      expect(safe).not.toContain('"');
      expect(safe).toBe("scriptalert('xss')/scriptService");
    });

    it('replaces backticks and double quotes to protect Mermaid diagram syntax', () => {
      const payload = 'Node "Alpha" `rm -rf /`';
      const safe = sanitizeLabel(payload);
      expect(safe).not.toContain('"');
      expect(safe).not.toContain('`');
      expect(safe).toBe("Node 'Alpha' 'rm -rf /'");
    });

    it('escapes XML/HTML special characters in escapeXml helper', () => {
      const xmlPayload = '<test id="1" val=\'a\' & "b">';
      const escaped = escapeXml(xmlPayload);
      expect(escaped).toBe('&lt;test id=&quot;1&quot; val=&apos;a&apos; &amp; &quot;b&quot;&gt;');
    });

    it('generates secure Markdown & Mermaid without syntax corruption from malicious nodes', () => {
      const maliciousNodes: GraphNode[] = [
        {
          id: 'n1',
          type: 'service',
          title: 'Malicious <script>alert(1)</script>',
          subtitle: 'Double "Quotes" & `Backticks`',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          status: 'healthy',
          latencyMs: 10,
          errorRate: 0,
          throughputRps: 50,
          color: '#38bdf8',
          iconName: 'Server',
        },
      ];
      const maliciousEdges: GraphEdge[] = [
        {
          id: 'e1',
          fromNodeId: 'n1',
          toNodeId: 'n1',
          protocol: 'HTTP/REST',
          latencyMs: 5,
          errorRate: 0,
          label: 'Injected " --> break',
        },
      ];

      const doc = generateMarkdownDoc(maliciousNodes, maliciousEdges, 'Security Test');
      expect(doc).not.toContain('<script>');
      expect(doc).toContain("Malicious scriptalert(1)/script");
      expect(doc).toContain("Double 'Quotes' & 'Backticks'");
      // Mermaid diagram line must not have unescaped inner double quotes
      expect(doc).toContain('n1["Malicious scriptalert(1)/script (Double \'Quotes\' & \'Backticks\')"]');
    });
  });

  describe('3. Webhook Rate Limiting & Abuse Prevention', () => {
    it('enforces maximum payload limit constant at 1MB', () => {
      expect(MAX_PAYLOAD_BYTES).toBe(1024 * 1024);
    });

    it('permits requests under the threshold and throttles when limit exceeded', () => {
      const testIp = '192.168.1.100';
      const threshold = 5;
      const windowMs = 5000;

      // First 5 requests should pass
      for (let i = 0; i < threshold; i++) {
        const throttled = isRateLimited(testIp, threshold, windowMs);
        expect(throttled).toBe(false);
      }

      // 6th request must be throttled
      const throttled6 = isRateLimited(testIp, threshold, windowMs);
      expect(throttled6).toBe(true);

      // Separate IP should still be allowed
      const separateIp = '10.0.0.1';
      expect(isRateLimited(separateIp, threshold, windowMs)).toBe(false);
    });

    it('resets rate limits cleanly upon store flush', () => {
      const testIp = '172.16.0.5';
      expect(isRateLimited(testIp, 2, 10000)).toBe(false);
      expect(isRateLimited(testIp, 2, 10000)).toBe(false);
      expect(isRateLimited(testIp, 2, 10000)).toBe(true);

      clearRateLimitStore();
      expect(isRateLimited(testIp, 2, 10000)).toBe(false);
    });
  });
});
