import type { GraphNode, GraphEdge } from '../../types/graph';

/**
 * The checkout system shown on the landing page.
 *
 * x/y are canvas coordinates inside the 800x380 demo canvas. The same graph is fed
 * to the real exporters and share-link encoder, so every code sample on the page is
 * genuine GraphFlow output.
 */

export const DEMO_CANVAS = { width: 800, height: 380 } as const;
export const DEMO_NODE = { width: 164, height: 86 } as const;

const node = (n: Omit<GraphNode, 'width' | 'height' | 'status' | 'errorRate'>): GraphNode => ({
  ...n,
  width: DEMO_NODE.width,
  height: DEMO_NODE.height,
  status: 'healthy',
  errorRate: 0,
});

export const DEMO_NODES: GraphNode[] = [
  node({ id: 'storefront', type: 'client', title: 'Storefront', subtitle: 'Next.js', x: 16, y: 34, latencyMs: 15, throughputRps: 720, color: '#38bdf8', iconName: 'Globe' }),
  node({ id: 'api-gateway', type: 'gateway', title: 'Kong Gateway', subtitle: 'Auth, rate limits', x: 214, y: 34, latencyMs: 6, throughputRps: 720, color: '#818cf8', iconName: 'Network' }),
  node({ id: 'session-cache', type: 'cache', title: 'Session Cache', subtitle: 'Redis 7', x: 214, y: 236, latencyMs: 2, throughputRps: 1200, color: '#f43f5e', iconName: 'Zap' }),
  node({ id: 'orders-created', type: 'queue', title: 'orders.created', subtitle: 'Kafka, 6 partitions', x: 416, y: 150, latencyMs: 4, throughputRps: 720, color: '#f59e0b', iconName: 'Layers' }),
  node({ id: 'order-worker', type: 'service', title: 'order-worker', subtitle: 'Consumer group', x: 620, y: 150, latencyMs: 35, throughputRps: 720, color: '#a855f7', iconName: 'Cpu' }),
  node({ id: 'orders-db', type: 'database', title: 'orders-db', subtitle: 'PostgreSQL 16', x: 620, y: 282, latencyMs: 12, throughputRps: 720, color: '#3b82f6', iconName: 'Database' }),
];

export const DEMO_EDGES: GraphEdge[] = [
  { id: 'e1', fromNodeId: 'storefront', toNodeId: 'api-gateway', protocol: 'HTTP/REST', latencyMs: 8, errorRate: 0, label: 'POST /checkout' },
  { id: 'e2', fromNodeId: 'api-gateway', toNodeId: 'session-cache', protocol: 'TCP', latencyMs: 1, errorRate: 0, label: 'session' },
  { id: 'e3', fromNodeId: 'api-gateway', toNodeId: 'orders-created', protocol: 'Kafka', latencyMs: 4, errorRate: 0, label: 'produce' },
  { id: 'e4', fromNodeId: 'orders-created', toNodeId: 'order-worker', protocol: 'Kafka', latencyMs: 5, errorRate: 0, label: 'consume' },
  { id: 'e5', fromNodeId: 'order-worker', toNodeId: 'orders-db', protocol: 'SQL Query', latencyMs: 9, errorRate: 0, label: 'INSERT' },
];

const byId = (id: string) => DEMO_NODES.find(n => n.id === id)!;

/** Cubic bezier between two nodes, matching the studio's horizontal/vertical port logic. */
export const demoEdgePath = (edge: GraphEdge): string => {
  const a = byId(edge.fromNodeId);
  const b = byId(edge.toNodeId);
  const verticalStack = Math.abs(a.x - b.x) < 40;

  if (verticalStack) {
    const [top, bottom] = a.y < b.y ? [a, b] : [b, a];
    const x = top.x + top.width / 2;
    const y1 = top.y + top.height;
    const y2 = bottom.y;
    const dy = (y2 - y1) / 2;
    return `M${x},${y1} C${x},${y1 + dy} ${x},${y2 - dy} ${x},${y2}`;
  }

  const x1 = a.x + a.width;
  const y1 = a.y + a.height / 2;
  const x2 = b.x;
  const y2 = b.y + b.height / 2;
  const dx = Math.max(24, (x2 - x1) / 2);
  return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
};
