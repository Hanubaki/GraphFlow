import { NodeType } from '../types/graph';

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
    category: 'Clients'
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
    category: 'Clients'
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
    category: 'Compute & Routing'
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
    category: 'Compute & Routing'
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
    category: 'Compute & Routing'
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
    category: 'Data & Storage'
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
    category: 'Data & Storage'
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
    category: 'Data & Storage'
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
    category: 'Async & Messaging'
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
    category: 'External'
  },
];
