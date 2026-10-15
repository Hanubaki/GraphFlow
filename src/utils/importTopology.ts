import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';
import { sanitizeArchitectureImport } from './securitySanitizer';
import { autoLayoutTopology } from './simulationPhysics';

export interface ImportTopologyResult {
  format: 'json' | 'docker-compose' | 'terraform';
  nodes: GraphNode[];
  edges: GraphEdge[];
}

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

    if (indent <= servicesIndent && /^[a-zA-Z0-9_-]+\s*:/.test(trimmed)) {
      inServices = false;
      currentService = null;
      continue;
    }

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

function parseTerraformToTopology(tfText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s*\{([\s\S]*?)\n\}/g;
  const resources: Array<{ tfType: string; name: string; body: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = resourceRegex.exec(tfText)) !== null) {
    const [, tfType, name, body] = match;
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

export function parseInfrastructureToTopology(rawContent: string, filename = ''): ImportTopologyResult {
  const trimmed = rawContent.trim();
  const lowerFile = filename.toLowerCase();

  if (trimmed.startsWith('{') || lowerFile.endsWith('.json')) {
    const parsed = JSON.parse(trimmed);
    const { nodes, edges } = sanitizeArchitectureImport(parsed);
    if (nodes.length === 0) {
      throw new Error('No valid GraphFlow components found in JSON.');
    }
    return { format: 'json', nodes, edges };
  }

  if (/resource\s+"[^"]+"\s+"[^"]+"/.test(trimmed) || lowerFile.endsWith('.tf')) {
    const { nodes, edges } = parseTerraformToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No supported Terraform resources (RDS, ElastiCache, SQS, S3, ALB, ECS, Lambda) found.');
    }
    return { format: 'terraform', nodes, edges };
  }

  if (/services\s*:/.test(trimmed) || lowerFile.endsWith('.yml') || lowerFile.endsWith('.yaml')) {
    const { nodes, edges } = parseDockerComposeToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No valid services found under the "services:" key in docker-compose.yml.');
    }
    return { format: 'docker-compose', nodes, edges };
  }

  throw new Error('Unrecognized file format. Paste or upload a valid docker-compose.yml, main.tf, or GraphFlow .json file.');
}
