import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';

/**
 * Enterprise Web Security & Data Sanitization Engine
 * Protects GraphFlow against Cross-Site Scripting (XSS), script injection,
 * malicious SVG foreignObject payloads, and prototype pollution in graph imports.
 */

// Regular expressions to detect and strip script tags, dangerous HTML tags, and dangerous protocols
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAGS_REGEX = /<[^>]*>/g;
const INLINE_EVENT_REGEX = /\bon\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const JAVASCRIPT_PROTOCOL_REGEX = /^\s*javascript\s*:/i;
const DATA_HTML_PROTOCOL_REGEX = /^\s*data\s*:\s*text\/html/i;
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

/**
 * Sanitizes an untrusted string by stripping HTML tags, JavaScript protocols,
 * and inline DOM event handlers. Enforces maximum length to prevent memory saturation.
 */
export function sanitizeText(val: unknown, maxLength = 100): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();

  // Strip script and all HTML tags
  str = str.replace(SCRIPT_TAG_REGEX, '');
  str = str.replace(HTML_TAGS_REGEX, '');
  str = str.replace(INLINE_EVENT_REGEX, '');

  // Disarm dangerous URI protocols
  if (JAVASCRIPT_PROTOCOL_REGEX.test(str) || DATA_HTML_PROTOCOL_REGEX.test(str)) {
    return '';
  }

  // Remove control characters (except standard newline/space)
  str = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return str.slice(0, maxLength);
}

/**
 * Encodes special characters into safe HTML entities.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates and sanitizes a CSS color string to guarantee safe rendering in SVG and DOM.
 */
export function sanitizeColor(color: unknown, fallback = '#818cf8'): string {
  if (typeof color === 'string' && HEX_COLOR_REGEX.test(color.trim())) {
    return color.trim();
  }
  return fallback;
}

/**
 * Validates and sanitizes an untrusted node object imported from JSON or URL hashes.
 */
export function sanitizeGraphNode(rawNode: any): GraphNode | null {
  if (!rawNode || typeof rawNode !== 'object') return null;

  const rawId = rawNode.id || rawNode.i;
  if (!rawId || typeof rawId !== 'string') return null;

  const id = sanitizeText(rawId, 64).replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!id) return null;

  const title = sanitizeText(rawNode.title, 50) || 'Service';
  const subtitle = sanitizeText(rawNode.subtitle || rawNode.sub, 50);

  const rawType = String(rawNode.type || rawNode.t || 'service');
  const validNodeTypes: readonly NodeType[] = ['client', 'gateway', 'service', 'database', 'cache', 'queue', 'serverless', 'storage', 'external'];
  const safeType: NodeType = (validNodeTypes as readonly string[]).includes(rawType)
    ? (rawType as NodeType)
    : 'service';

  const x = Number.isFinite(rawNode.x) ? Math.max(0, Math.min(10000, Number(rawNode.x))) : 100;
  const y = Number.isFinite(rawNode.y) ? Math.max(0, Math.min(10000, Number(rawNode.y))) : 100;
  const width = Number.isFinite(rawNode.width) ? Math.max(100, Math.min(600, Number(rawNode.width))) : 190;
  const height = Number.isFinite(rawNode.height) ? Math.max(50, Math.min(400, Number(rawNode.height))) : 90;

  const rawStatus = String(rawNode.status || rawNode.s || 'healthy');
  const safeStatus = (['healthy', 'degraded', 'down'] as const).includes(rawStatus as any)
    ? (rawStatus as any)
    : 'healthy';

  const latencyMs = Number.isFinite(rawNode.latencyMs || rawNode.lat)
    ? Math.max(1, Math.min(10000, Number(rawNode.latencyMs || rawNode.lat)))
    : 20;

  const errorRate = Number.isFinite(rawNode.errorRate || rawNode.err)
    ? Math.max(0, Math.min(100, Number(rawNode.errorRate || rawNode.err)))
    : 0;

  const throughputRps = Number.isFinite(rawNode.throughputRps || rawNode.rps)
    ? Math.max(0, Math.min(100000, Number(rawNode.throughputRps || rawNode.rps)))
    : 500;

  const color = sanitizeColor(rawNode.color || rawNode.c);
  const iconName = sanitizeText(rawNode.iconName || rawNode.i, 30) || 'Cpu';

  return {
    id,
    type: safeType,
    title,
    subtitle,
    x,
    y,
    width,
    height,
    status: safeStatus,
    latencyMs,
    errorRate,
    throughputRps,
    color,
    iconName,
  };
}

/**
 * Validates and sanitizes an untrusted edge object.
 */
export function sanitizeGraphEdge(rawEdge: any, validNodeIds: Set<string>): GraphEdge | null {
  if (!rawEdge || typeof rawEdge !== 'object') return null;

  const fromNodeId = sanitizeText(rawEdge.fromNodeId || rawEdge.f, 64).replace(/[^a-zA-Z0-9_-]/g, '_');
  const toNodeId = sanitizeText(rawEdge.toNodeId || rawEdge.to, 64).replace(/[^a-zA-Z0-9_-]/g, '_');

  // Verify endpoints exist in valid nodes set to prevent dangling corrupted edges
  if (!fromNodeId || !toNodeId || !validNodeIds.has(fromNodeId) || !validNodeIds.has(toNodeId)) {
    return null;
  }

  const rawId = rawEdge.id ? String(rawEdge.id) : `edge-${fromNodeId}-${toNodeId}`;
  const id = sanitizeText(rawId, 64);

  const rawProtocol = String(rawEdge.protocol || rawEdge.p || 'HTTP/REST');
  const validProtocols: readonly ProtocolType[] = ['HTTP/REST', 'gRPC', 'WebSocket', 'Kafka', 'TCP', 'SQL Query'];
  const safeProtocol: ProtocolType = (validProtocols as readonly string[]).includes(rawProtocol)
    ? (rawProtocol as ProtocolType)
    : 'HTTP/REST';

  const latencyMs = Number.isFinite(rawEdge.latencyMs || rawEdge.lat)
    ? Math.max(1, Math.min(10000, Number(rawEdge.latencyMs || rawEdge.lat)))
    : 10;

  const errorRate = Number.isFinite(rawEdge.errorRate || rawEdge.err)
    ? Math.max(0, Math.min(100, Number(rawEdge.errorRate || rawEdge.err)))
    : 0;

  const label = rawEdge.label || rawEdge.l ? sanitizeText(rawEdge.label || rawEdge.l, 30) : undefined;

  return {
    id,
    fromNodeId,
    toNodeId,
    protocol: safeProtocol,
    latencyMs,
    errorRate,
    label,
  };
}

/**
 * Complete architecture import sanitization pipeline.
 * Ensures untrusted JSON or URL-encoded architecture files cannot inject scripts or malformed nodes.
 */
export function sanitizeArchitectureImport(payload: any): { nodes: GraphNode[]; edges: GraphEdge[] } {
  if (!payload || typeof payload !== 'object') {
    return { nodes: [], edges: [] };
  }

  const rawNodes = Array.isArray(payload.nodes) ? payload.nodes : Array.isArray(payload.n) ? payload.n : [];
  const rawEdges = Array.isArray(payload.edges) ? payload.edges : Array.isArray(payload.e) ? payload.e : [];

  const sanitizedNodes: GraphNode[] = [];
  const nodeIds = new Set<string>();

  for (const rawNode of rawNodes) {
    const node = sanitizeGraphNode(rawNode);
    if (node && !nodeIds.has(node.id)) {
      nodeIds.add(node.id);
      sanitizedNodes.push(node);
    }
  }

  const sanitizedEdges: GraphEdge[] = [];
  const edgeIds = new Set<string>();

  for (const rawEdge of rawEdges) {
    const edge = sanitizeGraphEdge(rawEdge, nodeIds);
    if (edge && !edgeIds.has(edge.id)) {
      edgeIds.add(edge.id);
      sanitizedEdges.push(edge);
    }
  }

  return {
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
  };
}
