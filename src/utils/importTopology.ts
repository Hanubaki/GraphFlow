import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';
import { sanitizeArchitectureImport } from './securitySanitizer';
import { autoLayoutTopology } from './simulationPhysics';

export interface ImportTopologyResult {
  format: 'json' | 'docker-compose' | 'terraform' | 'package-json' | 'openapi';
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const SAMPLE_PACKAGE_JSON_IMPORT = `{
  "name": "fintech-checkout-platform",
  "version": "2.4.0",
  "dependencies": {
    "next": "^14.2.0",
    "@nestjs/core": "^10.3.0",
    "@prisma/client": "^5.14.0",
    "pg": "^8.11.5",
    "ioredis": "^5.4.1",
    "kafkajs": "^2.2.4",
    "@aws-sdk/client-s3": "^3.580.0",
    "stripe": "^15.8.0"
  }
}`;

export const SAMPLE_DOCKER_COMPOSE_IMPORT = `version: '3.8'
services:
  web-client:
    image: nginx:alpine
    ports:
      - "80:80"
    depends_on:
      - api-gateway

  api-gateway:
    image: kong:3.6
    ports:
      - "8000:8000"
    depends_on:
      - checkout-service
      - auth-service

  auth-service:
    image: node:20-alpine
    environment:
      - REDIS_HOST=session-redis
    depends_on:
      - session-redis

  checkout-service:
    image: golang:1.22-alpine
    environment:
      - DB_HOST=orders-postgres
      - KAFKA_BROKER=events-kafka
    depends_on:
      - orders-postgres
      - events-kafka

  session-redis:
    image: redis:7-alpine

  orders-postgres:
    image: postgres:16-alpine

  events-kafka:
    image: bitnami/kafka:latest

  ledger-worker:
    image: python:3.12-slim
    depends_on:
      - events-kafka
      - invoice-s3

  invoice-s3:
    image: minio/minio:latest
`;

interface ClassifiedComponent {
  type: NodeType;
  color: string;
  iconName: string;
  latencyMs: number;
  throughputRps: number;
  defaultSubtitle: string;
}

function classifyByImageOrName(name: string, image = ''): ClassifiedComponent {
  const token = `${name} ${image}`.toLowerCase();

  if (/(postgres|mysql|mariadb|mongodb|mongo|cassandra|cockroach|dynamodb|rds|aurora|db|database|supabase)/.test(token)) {
    return {
      type: 'database',
      color: '#3b82f6',
      iconName: 'Database',
      latencyMs: 22,
      throughputRps: 450,
      defaultSubtitle: image || 'PostgreSQL Primary',
    };
  }
  if (/(redis|memcached|elasticache|valkey|dragonfly|cache)/.test(token)) {
    return {
      type: 'cache',
      color: '#f43f5e',
      iconName: 'Cpu',
      latencyMs: 2,
      throughputRps: 1800,
      defaultSubtitle: image || 'Redis Cluster',
    };
  }
  if (/(kafka|rabbitmq|ActiveMQ|nats|pulsar|sqs|msk|queue|broker|event|pubsub)/.test(token)) {
    return {
      type: 'queue',
      color: '#f59e0b',
      iconName: 'Shuffle',
      latencyMs: 8,
      throughputRps: 1100,
      defaultSubtitle: image || 'Message Broker',
    };
  }
  if (/(minio|s3|bucket|blob|storage|ceph)/.test(token)) {
    return {
      type: 'storage',
      color: '#14b8a6',
      iconName: 'HardDrive',
      latencyMs: 48,
      throughputRps: 320,
      defaultSubtitle: image || 'Object Storage (S3)',
    };
  }
  if (/(lambda|serverless|faas|edge-fn|cloud-function)/.test(token)) {
    return {
      type: 'serverless',
      color: '#eab308',
      iconName: 'Zap',
      latencyMs: 35,
      throughputRps: 600,
      defaultSubtitle: image || 'Serverless Function',
    };
  }
  if (/(kong|envoy|traefik|haproxy|gateway|ingress|alb|loadbalancer|lb|apigateway)/.test(token)) {
    return {
      type: 'gateway',
      color: '#818cf8',
      iconName: 'Network',
      latencyMs: 7,
      throughputRps: 1200,
      defaultSubtitle: image || 'API Gateway / LB',
    };
  }
  if (/(client|frontend|web|storefront|nextjs|react|browser|mobile|cdn|cloudfront)/.test(token)) {
    return {
      type: 'client',
      color: '#38bdf8',
      iconName: 'Globe',
      latencyMs: 14,
      throughputRps: 650,
      defaultSubtitle: image || 'Web / Edge Client',
    };
  }
  if (/(stripe|openai|twilio|sendgrid|webhook|external|thirdparty)/.test(token)) {
    return {
      type: 'external',
      color: '#10b981',
      iconName: 'ExternalLink',
      latencyMs: 120,
      throughputRps: 250,
      defaultSubtitle: image || 'External API',
    };
  }
  return {
    type: 'service',
    color: '#a855f7',
    iconName: 'Server',
    latencyMs: 28,
    throughputRps: 520,
    defaultSubtitle: image || 'Microservice Container',
  };
}

function inferProtocol(fromType: NodeType, toType: NodeType): { protocol: ProtocolType; latencyMs: number; label: string } {
  if (toType === 'database') {
    return { protocol: 'SQL Query', latencyMs: 14, label: 'SELECT / INSERT' };
  }
  if (toType === 'cache') {
    return { protocol: 'TCP', latencyMs: 2, label: 'GET / SET' };
  }
  if (toType === 'queue' || fromType === 'queue') {
    return { protocol: 'Kafka', latencyMs: 6, label: fromType === 'queue' ? 'consume' : 'publish' };
  }
  if (toType === 'storage') {
    return { protocol: 'HTTP/REST', latencyMs: 28, label: 'PUT / GET Object' };
  }
  if (fromType === 'client') {
    return { protocol: 'HTTP/REST', latencyMs: 20, label: 'HTTPS /api' };
  }
  return { protocol: 'gRPC', latencyMs: 9, label: 'RPC Call' };
}

function formatReadableTitle(rawId: string): string {
  return rawId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

/**
 * Parses a docker-compose.yml string into GraphFlow nodes and edges.
 */
function parseDockerComposeToTopology(yamlText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const lines = yamlText.replace(/\r\n/g, '\n').split('\n');
  let inServices = false;
  let servicesIndent = -1;
  let currentService: string | null = null;
  let servicePropIndent = -1;
  let currentListSection: 'depends_on' | 'environment' | 'links' | null = null;

  const serviceMap = new Map<
    string,
    {
      image: string;
      dependsOn: Set<string>;
      envText: string[];
    }
  >();

  for (const rawLine of lines) {
    const cleanLine = rawLine.replace(/#.*$/, '');
    if (!cleanLine.trim()) continue;

    const indent = cleanLine.search(/\S/);
    const trimmed = cleanLine.trim();

    if (/^services\s*:/.test(trimmed)) {
      inServices = true;
      servicesIndent = indent;
      currentService = null;
      continue;
    }

    if (!inServices) continue;

    // Exited services block (e.g., top-level networks: or volumes:)
    if (indent <= servicesIndent && /^[a-zA-Z0-9_-]+\s*:/.test(trimmed)) {
      inServices = false;
      currentService = null;
      continue;
    }

    // Service definition key (typically indent === servicesIndent + 2)
    const serviceMatch = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*:\s*$/);
    if (serviceMatch && (currentService === null || indent === (servicesIndent >= 0 ? servicesIndent + 2 : 2))) {
      const sName = serviceMatch[1];
      if (!['depends_on', 'environment', 'ports', 'volumes', 'networks', 'deploy', 'build', 'labels', 'healthcheck'].includes(sName)) {
        currentService = sName;
        servicePropIndent = -1;
        currentListSection = null;
        if (!serviceMap.has(sName)) {
          serviceMap.set(sName, { image: '', dependsOn: new Set(), envText: [] });
        }
        continue;
      }
    }

    if (!currentService) continue;
    const svc = serviceMap.get(currentService)!;

    if (servicePropIndent === -1) {
      servicePropIndent = indent;
    }

    if (indent === servicePropIndent) {
      currentListSection = null;
      const imgMatch = trimmed.match(/^image\s*:\s*['"]?([^'"]+)['"]?$/);
      if (imgMatch) {
        svc.image = imgMatch[1].trim();
        continue;
      }
      if (/^depends_on\s*:/.test(trimmed)) {
        currentListSection = 'depends_on';
        continue;
      }
      if (/^links\s*:/.test(trimmed)) {
        currentListSection = 'links';
        continue;
      }
      if (/^environment\s*:/.test(trimmed)) {
        currentListSection = 'environment';
        continue;
      }
    } else if (indent > servicePropIndent && currentListSection) {
      if (currentListSection === 'depends_on' || currentListSection === 'links') {
        const itemMatch = trimmed.match(/^-\s*['"]?([a-zA-Z0-9_.-]+)['"]?/) || trimmed.match(/^([a-zA-Z0-9_.-]+)\s*:/);
        if (itemMatch && itemMatch[1] !== 'condition') {
          svc.dependsOn.add(itemMatch[1].split(':')[0]);
        }
      } else if (currentListSection === 'environment') {
        svc.envText.push(trimmed);
      }
    }
  }

  const allServiceNames = Array.from(serviceMap.keys());
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  allServiceNames.forEach((sName, idx) => {
    const info = serviceMap.get(sName)!;
    const classified = classifyByImageOrName(sName, info.image);

    nodes.push({
      id: sName,
      type: classified.type,
      title: formatReadableTitle(sName),
      subtitle: info.image || classified.defaultSubtitle,
      x: 100 + (idx % 4) * 280,
      y: 100 + Math.floor(idx / 4) * 140,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: classified.latencyMs,
      errorRate: 0.1,
      throughputRps: classified.throughputRps,
      color: classified.color,
      iconName: classified.iconName,
    });
  });

  // Also detect implicit dependencies in environment strings
  allServiceNames.forEach(sName => {
    const info = serviceMap.get(sName)!;
    const joinedEnv = info.envText.join(' ');
    allServiceNames.forEach(targetName => {
      if (targetName !== sName && joinedEnv.includes(targetName)) {
        info.dependsOn.add(targetName);
      }
    });
  });

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  let edgeCounter = 1;

  allServiceNames.forEach(sName => {
    const info = serviceMap.get(sName)!;
    const fromNode = nodeById.get(sName);
    if (!fromNode) return;

    info.dependsOn.forEach(depName => {
      const toNode = nodeById.get(depName);
      if (!toNode || fromNode.id === toNode.id) return;

      // Special case: if a worker depends_on a queue (e.g. ledger-worker depends_on events-kafka),
      // data flows FROM the queue TO the worker in an event-driven pipeline.
      const isWorkerConsumingQueue =
        toNode.type === 'queue' && /(worker|consumer|processor|projector)/i.test(fromNode.id);

      const actualFrom = isWorkerConsumingQueue ? toNode : fromNode;
      const actualTo = isWorkerConsumingQueue ? fromNode : toNode;
      const proto = inferProtocol(actualFrom.type, actualTo.type);

      edges.push({
        id: `dc-e${edgeCounter++}`,
        fromNodeId: actualFrom.id,
        toNodeId: actualTo.id,
        protocol: proto.protocol,
        latencyMs: proto.latencyMs,
        errorRate: 0,
        label: proto.label,
      });
    });
  });

  return {
    nodes: autoLayoutTopology(nodes),
    edges,
  };
}

/**
 * Parses Terraform (.tf) resource blocks into a GraphFlow topology.
 */
function parseTerraformToTopology(tfText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([\s\S]*?)\n\}/g;
  const resources: Array<{ tfType: string; name: string; body: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = resourceRegex.exec(tfText)) !== null) {
    const [, tfType, name, body] = match;
    // Skip pure networking/IAM plumbing resources
    if (/(aws_vpc|aws_subnet|aws_security_group|aws_iam|aws_lb_target_group|aws_lb_listener)/.test(tfType)) {
      continue;
    }
    resources.push({ tfType, name, body });
  }

  const nodes: GraphNode[] = resources.map((r, idx) => {
    const classified = classifyByImageOrName(r.name, r.tfType);
    return {
      id: r.name,
      type: classified.type,
      title: formatReadableTitle(r.name),
      subtitle: r.tfType,
      x: 100 + (idx % 4) * 280,
      y: 100 + Math.floor(idx / 4) * 140,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: classified.latencyMs,
      errorRate: 0.1,
      throughputRps: classified.throughputRps,
      color: classified.color,
      iconName: classified.iconName,
    };
  });

  const edges: GraphEdge[] = [];
  const nodeById = new Map(nodes.map(n => [n.id, n]));
  let edgeIdx = 1;

  // 1. Explicit references in HCL body
  resources.forEach(r => {
    resources.forEach(target => {
      if (r.name !== target.name && r.body.includes(target.name)) {
        const fromNode = nodeById.get(r.name)!;
        const toNode = nodeById.get(target.name)!;
        const proto = inferProtocol(fromNode.type, toNode.type);
        edges.push({
          id: `tf-e${edgeIdx++}`,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          protocol: proto.protocol,
          latencyMs: proto.latencyMs,
          errorRate: 0,
          label: proto.label,
        });
      }
    });
  });

  // 2. If no explicit references found, wire standard architectural tiers (Ingress -> Compute -> Data)
  if (edges.length === 0 && nodes.length > 1) {
    const ingress = nodes.filter(n => n.type === 'client' || n.type === 'gateway');
    const compute = nodes.filter(n => n.type === 'service' || n.type === 'serverless');
    const data = nodes.filter(n => ['database', 'cache', 'queue', 'storage', 'external'].includes(n.type));

    ingress.forEach(ing => {
      compute.forEach(comp => {
        const proto = inferProtocol(ing.type, comp.type);
        edges.push({
          id: `tf-e${edgeIdx++}`,
          fromNodeId: ing.id,
          toNodeId: comp.id,
          protocol: proto.protocol,
          latencyMs: proto.latencyMs,
          errorRate: 0,
          label: proto.label,
        });
      });
    });

    const activeCompute = compute.length > 0 ? compute : ingress;
    activeCompute.forEach(comp => {
      data.forEach(d => {
        const proto = inferProtocol(comp.type, d.type);
        edges.push({
          id: `tf-e${edgeIdx++}`,
          fromNodeId: comp.id,
          toNodeId: d.id,
          protocol: proto.protocol,
          latencyMs: proto.latencyMs,
          errorRate: 0,
          label: proto.label,
        });
      });
    });
  }

  return {
    nodes: autoLayoutTopology(nodes),
    edges,
  };
}

/**
 * Reverse-engineers a Node.js / TypeScript package.json into a complete 4-tier GraphFlow topology.
 */
function parsePackageJsonToTopology(pkg: Record<string, any>): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const deps = {
    ...(typeof pkg.dependencies === 'object' ? pkg.dependencies : {}),
    ...(typeof pkg.devDependencies === 'object' ? pkg.devDependencies : {}),
  };
  const depKeys = Object.keys(deps).map(k => k.toLowerCase());
  const projectName = typeof pkg.name === 'string' && pkg.name.trim() ? formatReadableTitle(pkg.name) : 'Core API Service';

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // 1. Client / Frontend tier
  const hasNextOrReact = depKeys.some(k => /(^next$|^react$|^vue$|svelte|nuxt|vite)/.test(k));
  const clientId = 'pkg-client';
  nodes.push({
    id: clientId,
    type: 'client',
    title: hasNextOrReact ? 'Web Storefront (SSR)' : 'Client Application',
    subtitle: depKeys.includes('next') ? 'Next.js Edge App' : 'HTTPS Client',
    x: 80,
    y: 220,
    width: 190,
    height: 90,
    status: 'healthy',
    latencyMs: 14,
    errorRate: 0.1,
    throughputRps: 900,
    color: '#38bdf8',
    iconName: 'Globe',
  });

  // 2. API Gateway tier
  const gatewayId = 'pkg-gateway';
  nodes.push({
    id: gatewayId,
    type: 'gateway',
    title: 'API Gateway',
    subtitle: 'Ingress & Rate Limiter',
    x: 340,
    y: 220,
    width: 190,
    height: 90,
    status: 'healthy',
    latencyMs: 6,
    errorRate: 0.1,
    throughputRps: 1400,
    color: '#818cf8',
    iconName: 'Network',
    circuitBreaker: 'closed',
  });

  // 3. Core Compute Service tier
  const serviceId = 'pkg-core-service';
  const runtimeLabel = depKeys.some(k => k.includes('nestjs'))
    ? 'NestJS Microservice'
    : depKeys.includes('fastify')
      ? 'Fastify Runtime'
      : depKeys.includes('express')
        ? 'Express API Server'
        : 'Node.js 20 Service';

  nodes.push({
    id: serviceId,
    type: 'service',
    title: projectName.slice(0, 22),
    subtitle: runtimeLabel,
    x: 600,
    y: 220,
    width: 190,
    height: 90,
    status: 'healthy',
    latencyMs: 24,
    errorRate: 0.2,
    throughputRps: 750,
    color: '#a855f7',
    iconName: 'Server',
    circuitBreaker: 'closed',
  });

  edges.push(
    {
      id: 'pkg-e-client-gw',
      fromNodeId: clientId,
      toNodeId: gatewayId,
      protocol: 'HTTP/REST',
      latencyMs: 12,
      errorRate: 0,
      label: 'HTTPS /api',
    },
    {
      id: 'pkg-e-gw-svc',
      fromNodeId: gatewayId,
      toNodeId: serviceId,
      protocol: 'gRPC',
      latencyMs: 5,
      errorRate: 0,
      label: 'Internal RPC',
    }
  );

  let depIdx = 1;
  const addDownstream = (
    id: string,
    type: NodeType,
    title: string,
    subtitle: string,
    color: string,
    iconName: string,
    latencyMs: number,
    throughputRps: number
  ) => {
    nodes.push({
      id,
      type,
      title,
      subtitle,
      x: 880,
      y: 80 + depIdx * 120,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs,
      errorRate: 0.1,
      throughputRps,
      color,
      iconName,
      circuitBreaker: 'closed',
    });
    const proto = inferProtocol('service', type);
    edges.push({
      id: `pkg-e-${depIdx++}`,
      fromNodeId: serviceId,
      toNodeId: id,
      protocol: proto.protocol,
      latencyMs: proto.latencyMs,
      errorRate: 0,
      label: proto.label,
    });
  };

  // Detect Databases
  if (depKeys.some(k => /(^pg$|postgres|prisma|drizzle|typeorm|sequelize|supabase|mysql|mongodb|mongoose)/.test(k))) {
    const dbSub = depKeys.some(k => k.includes('supabase'))
      ? 'Supabase PostgreSQL'
      : depKeys.some(k => k.includes('prisma'))
        ? 'PostgreSQL (Prisma ORM)'
        : depKeys.some(k => /(mongo|mongoose)/.test(k))
          ? 'MongoDB AtlasReplica'
          : 'PostgreSQL Primary';
    addDownstream('pkg-db', 'database', 'Primary Database', dbSub, '#3b82f6', 'Database', 18, 520);
  }

  // Detect Redis / Cache
  if (depKeys.some(k => /(ioredis|^redis$|upstash|memcached|keyv)/.test(k))) {
    addDownstream('pkg-redis', 'cache', 'Redis Cache Cluster', 'ioredis Low-Latency', '#f43f5e', 'Cpu', 2, 1900);
  }

  // Detect Message Queues / Event Streams
  if (depKeys.some(k => /(kafkajs|amqplib|bullmq|^bull$|sqs|rabbitmq|nats)/.test(k))) {
    const qSub = depKeys.includes('kafkajs') ? 'Apache Kafka (kafkajs)' : 'BullMQ / Event Stream';
    addDownstream('pkg-queue', 'queue', 'Event Stream Broker', qSub, '#f59e0b', 'Shuffle', 7, 1300);
  }

  // Detect S3 / Object Storage
  if (depKeys.some(k => /(client-s3|aws-sdk|minio|uploadthing|cloudinary)/.test(k))) {
    addDownstream('pkg-s3', 'storage', 'Object StorageBucket', 'AWS S3 SDK v3', '#14b8a6', 'HardDrive', 38, 400);
  }

  // Detect External APIs (Stripe, OpenAI, Twilio, Resend)
  if (depKeys.some(k => /(stripe|openai|anthropic|twilio|resend|sendgrid|lemonsqueezy)/.test(k))) {
    const extSub = depKeys.includes('stripe')
      ? 'Stripe Billing & Webhooks'
      : depKeys.some(k => /(openai|anthropic)/.test(k))
        ? 'LLM Inference API'
        : 'Third-Party Webhook API';
    addDownstream('pkg-ext', 'external', 'External Provider API', extSub, '#10b981', 'ExternalLink', 95, 320);
  }

  // Ensure at least one backing database if minimal package.json was pasted
  if (nodes.length <= 3) {
    addDownstream('pkg-db-default', 'database', 'Primary Database', 'PostgreSQL 16', '#3b82f6', 'Database', 20, 500);
  }

  return {
    nodes: autoLayoutTopology(nodes),
    edges,
  };
}

/**
 * Reverse-engineers an OpenAPI 3.x / Swagger 2.0 YAML or JSON spec into a microservice topology.
 */
function parseOpenApiToTopology(rawText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const pathMatches = Array.from(rawText.matchAll(/^\s{2,4}(\/[a-zA-Z0-9/_-]+)\s*:/gm)).map(m => m[1]);
  const routeGroups = Array.from(
    new Set(
      pathMatches
        .map(p => p.split('/').filter(Boolean)[0] || 'core')
        .filter(seg => !['api', 'v1', 'v2', 'v3'].includes(seg.toLowerCase()))
    )
  ).slice(0, 4);

  const activeGroups = routeGroups.length > 0 ? routeGroups : ['orders', 'users', 'billing'];
  const nodes: GraphNode[] = [
    {
      id: 'oa-client',
      type: 'client',
      title: 'API Consumer Client',
      subtitle: 'OpenAPI 3.0 SDK',
      x: 80,
      y: 220,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 12,
      errorRate: 0.1,
      throughputRps: 900,
      color: '#38bdf8',
      iconName: 'Globe',
    },
    {
      id: 'oa-gateway',
      type: 'gateway',
      title: 'OpenAPI Gateway',
      subtitle: `${pathMatches.length || 6} REST Endpoints`,
      x: 340,
      y: 220,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 6,
      errorRate: 0.1,
      throughputRps: 1400,
      color: '#818cf8',
      iconName: 'Network',
      circuitBreaker: 'closed',
    },
    {
      id: 'oa-db',
      type: 'database',
      title: 'Primary Relational DB',
      subtitle: 'PostgreSQL HA',
      x: 900,
      y: 160,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 19,
      errorRate: 0.1,
      throughputRps: 600,
      color: '#3b82f6',
      iconName: 'Database',
      circuitBreaker: 'closed',
    },
    {
      id: 'oa-cache',
      type: 'cache',
      title: 'Edge Response Cache',
      subtitle: 'Redis Cluster',
      x: 900,
      y: 300,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 2,
      errorRate: 0.1,
      throughputRps: 1800,
      color: '#f43f5e',
      iconName: 'Cpu',
      circuitBreaker: 'closed',
    },
  ];

  const edges: GraphEdge[] = [
    {
      id: 'oa-e-ingress',
      fromNodeId: 'oa-client',
      toNodeId: 'oa-gateway',
      protocol: 'HTTP/REST',
      latencyMs: 14,
      errorRate: 0,
      label: 'HTTPS JSON',
    },
  ];

  activeGroups.forEach((group, idx) => {
    const svcId = `oa-svc-${group}`;
    nodes.push({
      id: svcId,
      type: 'service',
      title: `${formatReadableTitle(group)} Service`,
      subtitle: `/${group}/* handler`,
      x: 620,
      y: 100 + idx * 130,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 22,
      errorRate: 0.1,
      throughputRps: 650,
      color: '#a855f7',
      iconName: 'Server',
      circuitBreaker: 'closed',
    });
    edges.push(
      {
        id: `oa-e-gw-${idx}`,
        fromNodeId: 'oa-gateway',
        toNodeId: svcId,
        protocol: 'HTTP/REST',
        latencyMs: 6,
        errorRate: 0,
        label: `/${group}`,
      },
      {
        id: `oa-e-db-${idx}`,
        fromNodeId: svcId,
        toNodeId: 'oa-db',
        protocol: 'SQL Query',
        latencyMs: 12,
        errorRate: 0,
        label: 'SELECT / WRITE',
      }
    );
    if (idx === 0) {
      edges.push({
        id: `oa-e-cache-${idx}`,
        fromNodeId: svcId,
        toNodeId: 'oa-cache',
        protocol: 'TCP',
        latencyMs: 2,
        errorRate: 0,
        label: 'GET / SET',
      });
    }
  });

  return {
    nodes: autoLayoutTopology(nodes),
    edges,
  };
}

/**
 * Universal infrastructure importer supporting GraphFlow JSON, package.json, OpenAPI/Swagger, Docker Compose YAML, and Terraform HCL.
 */
export function parseInfrastructureToTopology(rawContent: string, filename = ''): ImportTopologyResult {
  const trimmed = rawContent.trim();
  const lowerFile = filename.toLowerCase();

  // 1. Try JSON if starts with { or filename ends with .json
  if (trimmed.startsWith('{') || lowerFile.endsWith('.json')) {
    const parsed = JSON.parse(trimmed);

    // Check if it's a Node.js package.json file
    if (
      lowerFile.endsWith('package.json') ||
      (parsed && typeof parsed === 'object' && !Array.isArray(parsed.nodes) && (parsed.dependencies || parsed.devDependencies))
    ) {
      const { nodes, edges } = parsePackageJsonToTopology(parsed);
      return { format: 'package-json', nodes, edges };
    }

    // Check if it's an OpenAPI / Swagger JSON spec
    if (parsed && typeof parsed === 'object' && (parsed.openapi || parsed.swagger) && parsed.paths) {
      const { nodes, edges } = parseOpenApiToTopology(trimmed);
      return { format: 'openapi', nodes, edges };
    }

    const { nodes, edges } = sanitizeArchitectureImport(parsed);
    if (nodes.length === 0) {
      throw new Error('No valid GraphFlow components or package.json dependencies found in JSON.');
    }
    return { format: 'json', nodes, edges };
  }

  // 2. Try Terraform HCL if contains resource "..." "..." or ends with .tf
  if (/resource\s+"[^"]+"\s+"[^"]+"/.test(trimmed) || lowerFile.endsWith('.tf')) {
    const { nodes, edges } = parseTerraformToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No supported Terraform resources (RDS, ElastiCache, SQS, S3, ALB, ECS, Lambda) found.');
    }
    return { format: 'terraform', nodes, edges };
  }

  // 3. Try OpenAPI / Swagger YAML
  if (/^(openapi|swagger)\s*:/m.test(trimmed) && /paths\s*:/m.test(trimmed)) {
    const { nodes, edges } = parseOpenApiToTopology(trimmed);
    return { format: 'openapi', nodes, edges };
  }

  // 4. Try Docker Compose YAML
  if (/services\s*:/.test(trimmed) || lowerFile.endsWith('.yml') || lowerFile.endsWith('.yaml')) {
    const { nodes, edges } = parseDockerComposeToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No valid services found under the "services:" key in docker-compose.yml.');
    }
    return { format: 'docker-compose', nodes, edges };
  }

  throw new Error(
    'Unrecognized file format. Paste or upload a valid docker-compose.yml, main.tf, package.json, openapi.yaml, or GraphFlow .json file.'
  );
}

