import { describe, it, expect } from 'vitest';
import {
  sanitizeText,
  escapeHtml,
  sanitizeColor,
  sanitizeGraphNode,
  sanitizeGraphEdge,
  sanitizeArchitectureImport,
} from '../utils/securitySanitizer';

describe('Security Hardening & Data Sanitization Engine', () => {
  it('strips script tags and inline event handlers to prevent XSS', () => {
    const maliciousScript = "<script>alert('pwned')</script>User Service";
    expect(sanitizeText(maliciousScript)).toBe('User Service');

    const maliciousEvent = '<img src="x" onerror="stealCookies()">Payment Gateway';
    expect(sanitizeText(maliciousEvent)).toBe('Payment Gateway');

    const dangerousIframe = '<iframe src="evil.com"></iframe>Auth Server';
    expect(sanitizeText(dangerousIframe)).toBe('Auth Server');
  });

  it('disarms dangerous URI schemes like javascript: and data:text/html', () => {
    expect(sanitizeText("javascript:alert(1)")).toBe('');
    expect(sanitizeText("JAVASCRIPT:/*foo*/confirm(1)")).toBe('');
    expect(sanitizeText("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")).toBe('');
  });

  it('encodes HTML special characters properly', () => {
    const input = 'API & Gateway <v2> "Fast" \'SSL\'';
    const escaped = escapeHtml(input);
    expect(escaped).toBe('API &amp; Gateway &lt;v2&gt; &quot;Fast&quot; &#x27;SSL&#x27;');
  });

  it('validates hex color strings and rejects CSS injection', () => {
    expect(sanitizeColor('#38bdf8')).toBe('#38bdf8');
    expect(sanitizeColor('#fff')).toBe('#fff');
    expect(sanitizeColor('#10b981aa')).toBe('#10b981aa');
    // Malicious or invalid color formats fallback safely
    expect(sanitizeColor('red; background: url(evil.com)')).toBe('#818cf8');
    expect(sanitizeColor('javascript:alert(1)')).toBe('#818cf8');
  });

  it('sanitizes untrusted node objects and bounds numeric values', () => {
    const rawMaliciousNode = {
      id: 'node1<script>alert(1)</script>',
      title: '<script>alert(1)</script>Microservice A',
      subtitle: '<b onmouseover="alert(2)">Subtitle</b>',
      type: 'invalid_type_attacker',
      x: -5000,
      y: 999999,
      width: 10,
      height: 9000,
      latencyMs: -50,
      errorRate: 999,
      throughputRps: -100,
      color: 'expression(alert(1))',
      iconName: '<script>icon</script>Server',
    };

    const node = sanitizeGraphNode(rawMaliciousNode);
    expect(node).not.toBeNull();
    if (node) {
      expect(node.id).toBe('node1');
      expect(node.title).toBe('Microservice A');
      expect(node.subtitle).toBe('Subtitle');
      expect(node.type).toBe('service'); // Fell back to default safe type
      expect(node.x).toBe(0); // Clamped to min 0
      expect(node.y).toBe(10000); // Clamped to max 10000
      expect(node.width).toBe(100); // Clamped to min width 100
      expect(node.height).toBe(400); // Clamped to max height 400
      expect(node.latencyMs).toBe(1); // Min latency 1ms
      expect(node.errorRate).toBe(100); // Clamped to max 100%
      expect(node.throughputRps).toBe(0); // Clamped to min 0
      expect(node.color).toBe('#818cf8'); // Fallback safe hex
      expect(node.iconName).toBe('Server');
    }
  });

  it('sanitizes edges and strips dangling connections', () => {
    const validNodeIds = new Set(['gateway', 'auth_service']);

    const validRawEdge = {
      id: 'e1',
      fromNodeId: 'gateway',
      toNodeId: 'auth_service',
      protocol: 'gRPC',
      latencyMs: 15,
      label: '<script>safe</script>RPC Call',
    };

    const edge = sanitizeGraphEdge(validRawEdge, validNodeIds);
    expect(edge).not.toBeNull();
    expect(edge?.protocol).toBe('gRPC');
    expect(edge?.label).toBe('RPC Call');

    // Edge pointing to non-existent node is filtered out
    const danglingRawEdge = {
      id: 'e2',
      fromNodeId: 'gateway',
      toNodeId: 'non_existent_node',
    };
    expect(sanitizeGraphEdge(danglingRawEdge, validNodeIds)).toBeNull();
  });

  it('sanitizes complete imported architecture payloads end-to-end', () => {
    const importedJson = {
      nodes: [
        {
          id: 'api_gw',
          title: '<b>API Gateway</b>',
          type: 'gateway',
          x: 100,
          y: 200,
        },
        {
          id: 'user_svc',
          title: '<iframe src="evil.com"></iframe>User Service',
          type: 'service',
          x: 400,
          y: 200,
        },
      ],
      edges: [
        {
          id: 'edge1',
          fromNodeId: 'api_gw',
          toNodeId: 'user_svc',
          protocol: 'HTTP/REST',
          label: 'REST Call',
        },
        {
          id: 'ghost_edge',
          fromNodeId: 'api_gw',
          toNodeId: 'ghost_node',
        },
      ],
    };

    const sanitized = sanitizeArchitectureImport(importedJson);
    expect(sanitized.nodes.length).toBe(2);
    expect(sanitized.nodes[0].title).toBe('API Gateway');
    expect(sanitized.nodes[1].title).toBe('User Service');

    // Only 1 edge is valid because ghost_edge pointed to non-existent node
    expect(sanitized.edges.length).toBe(1);
    expect(sanitized.edges[0].id).toBe('edge1');
  });
});
