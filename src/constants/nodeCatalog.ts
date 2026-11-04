import { NodeType, GraphNode } from '../types/graph';

/**
 * Checks whether an existing canvas node (such as one preloaded from a template)
 * belongs to the 10 advanced Cloud / AI / Security components that require a free email sign-in to customize.
 */
export function isNodeLockedForGuest(node: Pick<GraphNode, 'type' | 'iconName' | 'title'>): boolean {
  if (node.type === 'serverless' || node.type === 'storage' || node.type === 'external') {
    return true;
  }
  if (
    node.iconName === 'Smartphone' ||
    node.iconName === 'ShieldCheck' ||
    node.iconName === 'Layers' ||
    node.iconName === 'AlertTriangle'
  ) {
    return true;
  }
  return false;
}

export interface CatalogItem {
  type: NodeType;
  title: string;
  subtitle: string;
  defaultLatencyMs: number;
  defaultErrorRate: number;
  defaultThroughput: number;
  color: string;
  iconName: string;
  category: 'Clients' | 'Compute & Routing' | 'Data & Storage' | 'Async & Messaging' | 'External';
  requiresAuth?: boolean;
}

export const NODE_CATALOG: CatalogItem[] = [
  {
    type: 'client',
    title: 'Web Application',
    subtitle: 'React / Next.js SPA',
    defaultLatencyMs: 25,
    defaultErrorRate: 0,
    defaultThroughput: 120,
    color: '#38bdf8', // Sky
    iconName: 'Globe',
    category: 'Clients',
    requiresAuth: false,
  },
  {
    type: 'client',
    title: 'Mobile App',
    subtitle: 'iOS / Android (Flutter)',
    defaultLatencyMs: 35,
    defaultErrorRate: 0.5,
    defaultThroughput: 85,
    color: '#0ea5e9', // Cyan
    iconName: 'Smartphone',
    category: 'Clients',
    requiresAuth: true,
  },
  {
    type: 'gateway',
    title: 'API Gateway',
    subtitle: 'Envoy / Kong Proxy',
    defaultLatencyMs: 8,
    defaultErrorRate: 0.1,
    defaultThroughput: 2500,
    color: '#818cf8', // Indigo
    iconName: 'Network',
    category: 'Compute & Routing',
    requiresAuth: false,
  },
  {
    type: 'gateway',
    title: 'Cloudflare WAF / CDN',
    subtitle: 'Edge DDoS & TLS Shield',
    defaultLatencyMs: 4,
    defaultErrorRate: 0.02,
    defaultThroughput: 12000,
    color: '#22d3ee', // Cyan
    iconName: 'ShieldCheck',
    category: 'Compute & Routing',
    requiresAuth: true,
  },
  {
    type: 'gateway',
    title: 'GraphQL Federation',
    subtitle: 'Apollo / BFF Router',
    defaultLatencyMs: 14,
    defaultErrorRate: 0.15,
    defaultThroughput: 1800,
    color: '#6366f1', // Indigo
    iconName: 'Layers',
    category: 'Compute & Routing',
    requiresAuth: true,
  },
  {
    type: 'service',
    title: 'Core Microservice',
    subtitle: 'Node.js / Go Service',
    defaultLatencyMs: 45,
    defaultErrorRate: 0.5,
    defaultThroughput: 650,
    color: '#a855f7', // Purple
    iconName: 'Server',
    category: 'Compute & Routing',
    requiresAuth: false,
  },
  {
    type: 'service',
    title: 'LLM / Vector RAG Engine',
    subtitle: 'OpenAI / Claude / Pinecone',
    defaultLatencyMs: 140,
    defaultErrorRate: 1.2,
    defaultThroughput: 180,
    color: '#c084fc', // Violet
    iconName: 'Cpu',
    category: 'Compute & Routing',
    requiresAuth: true,
  },
  {
    type: 'serverless',
    title: 'Serverless Function',
    subtitle: 'AWS Lambda / Workers',
    defaultLatencyMs: 65,
    defaultErrorRate: 1.0,
    defaultThroughput: 400,
    color: '#ec4899', // Pink
    iconName: 'Zap',
    category: 'Compute & Routing',
    requiresAuth: true,
  },
  {
    type: 'cache',
    title: 'In-Memory Cache',
    subtitle: 'Redis / Memcached',
    defaultLatencyMs: 3,
    defaultErrorRate: 0.05,
    defaultThroughput: 8000,
    color: '#f43f5e', // Rose
    iconName: 'Cpu',
    category: 'Data & Storage',
    requiresAuth: false,
  },
  {
    type: 'database',
    title: 'Relational Database',
    subtitle: 'PostgreSQL Cluster',
    defaultLatencyMs: 35,
    defaultErrorRate: 0.2,
    defaultThroughput: 900,
    color: '#3b82f6', // Blue
    iconName: 'Database',
    category: 'Data & Storage',
    requiresAuth: false,
  },
  {
    type: 'database',
    title: 'Search & Analytics OLAP',
    subtitle: 'Elasticsearch / ClickHouse',
    defaultLatencyMs: 28,
    defaultErrorRate: 0.15,
    defaultThroughput: 2200,
    color: '#60a5fa', // Light Blue
    iconName: 'Database',
    category: 'Data & Storage',
    requiresAuth: true,
  },
  {
    type: 'storage',
    title: 'Object Storage',
    subtitle: 'S3 / Cloud Storage',
    defaultLatencyMs: 50,
    defaultErrorRate: 0.1,
    defaultThroughput: 350,
    color: '#14b8a6', // Teal
    iconName: 'HardDrive',
    category: 'Data & Storage',
    requiresAuth: true,
  },
  {
    type: 'queue',
    title: 'Event Streaming',
    subtitle: 'Apache Kafka / RabbitMQ',
    defaultLatencyMs: 12,
    defaultErrorRate: 0.1,
    defaultThroughput: 15000,
    color: '#f59e0b', // Amber
    iconName: 'Shuffle',
    category: 'Async & Messaging',
    requiresAuth: false,
  },
  {
    type: 'queue',
    title: 'Dead-Letter Queue (DLQ)',
    subtitle: 'SQS Retry / Poison Queue',
    defaultLatencyMs: 18,
    defaultErrorRate: 0.05,
    defaultThroughput: 4500,
    color: '#fbbf24', // Yellow-Amber
    iconName: 'Shuffle',
    category: 'Async & Messaging',
    requiresAuth: true,
  },
  {
    type: 'external',
    title: 'Third-Party API',
    subtitle: 'Stripe / OpenAI / Auth0',
    defaultLatencyMs: 180,
    defaultErrorRate: 2.5,
    defaultThroughput: 100,
    color: '#10b981', // Emerald
    iconName: 'ExternalLink',
    category: 'External',
    requiresAuth: true,
  },
  {
    type: 'external',
    title: 'OAuth2 / OIDC Identity',
    subtitle: 'Keycloak / Auth0 SSO',
    defaultLatencyMs: 22,
    defaultErrorRate: 0.1,
    defaultThroughput: 1400,
    color: '#34d399', // Mint
    iconName: 'ShieldCheck',
    category: 'External',
    requiresAuth: true,
  },
];
