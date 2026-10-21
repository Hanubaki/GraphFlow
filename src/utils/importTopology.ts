import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';
import { sanitizeArchitectureImport } from './securitySanitizer';
import { autoLayoutTopology } from './simulationPhysics';
import { synthesizeArchitectureOffline } from '../services/aiGenerator';

export interface ImportTopologyResult {
  format: 'json' | 'docker-compose' | 'terraform' | 'package-json' | 'openapi' | 'erp-csv' | 'erp-process';
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const SAMPLE_ERP_CSV_IMPORT = `Departman;Hedef_Departman;Süreç_Açıklaması;İşlem_Süresi_ms;Kapasite_RPS
Satın Alma & Tedarikçi (PO);Depo Giriş (Inbound);Purchase Order & İrsaliye;14;500
El Terminali & Barkod;Depo Giriş (Inbound);Barkod / RFID Okutma (WMS);10;650
Depo Giriş (Inbound);Ar-Ge Departmanı (R&D);BOM / Ürün Ağacı & Numune;15;1100
Depo Giriş (Inbound);Kalite Kontrol (IQC / QA);Girdi Kalite & Karantina Testi;18;1100
Depo Giriş (Inbound);Üretim Departmanı (MES);İş Emri Hammadde Besleme;16;1100
Depo Giriş (Inbound);Bakım Departmanı (MRO);Yedek Parça & Makine Bakım;14;1100
Ar-Ge Departmanı (R&D);ERP Merkezi Stok DB;Reçete & Yeni Stok Kodu;22;550
Kalite Kontrol (IQC / QA);ERP Merkezi Stok DB;Serbest Stok Onayı;26;650
Kalite Kontrol (IQC / QA);Toplama Listesi (Pick List);Onaylı Parti Sevk Emri;18;650
Üretim Departmanı (MES);Toplama Listesi (Pick List);Mamul Giriş & Sevkiyat Talebi;34;750
Bakım Departmanı (MRO);ERP Merkezi Stok DB;MRO Yedek Parça Düşümü;20;450
ERP Merkezi Stok DB;Depo Çıkış (Outbound);FIFO / LIFO Stok Düşümü;16;1000
Toplama Listesi (Pick List);Depo Çıkış (Outbound);Pick List Hazırlama;9;1400
Depo Çıkış (Outbound);Sevkiyat & e-İrsaliye (ERP);Hatasız Teslimat & ERP Kaydı;20;850`;

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

  if (/(postgres|mysql|mariadb|mongodb|mongo|cassandra|cockroach|dynamodb|rds|aurora|db|database|supabase|stok db|merkezi stok|fifo|lifo|veritaban)/.test(token)) {
    return {
      type: 'database',
      color: '#3b82f6',
      iconName: 'Database',
      latencyMs: 22,
      throughputRps: 650,
      defaultSubtitle: image || 'PostgreSQL / ERP Stok DB',
    };
  }
  if (/(redis|memcached|elasticache|valkey|dragonfly|cache|izlenebilirlik|visibility)/.test(token)) {
    return {
      type: 'cache',
      color: '#f43f5e',
      iconName: 'Cpu',
      latencyMs: 2,
      throughputRps: 1800,
      defaultSubtitle: image || 'Redis Cluster',
    };
  }
  if (/(kafka|rabbitmq|activemq|nats|pulsar|sqs|msk|queue|broker|event|pubsub|pick list|toplama listesi|kuyruk|konveyör|konveyor)/.test(token)) {
    return {
      type: 'queue',
      color: '#f59e0b',
      iconName: 'Shuffle',
      latencyMs: 8,
      throughputRps: 1200,
      defaultSubtitle: image || 'Message / Pick Queue',
    };
  }
  if (/(minio|s3|bucket|blob|storage|ceph|depo çıkış|depo cikis|outbound|goods issue|ambar)/.test(token)) {
    return {
      type: 'storage',
      color: '#14b8a6',
      iconName: 'HardDrive',
      latencyMs: 32,
      throughputRps: 600,
      defaultSubtitle: image || 'Object / Outbound Storage',
    };
  }
  if (/(lambda|serverless|faas|edge-fn|cloud-function|bakım|bakim|mro|maintenance)/.test(token)) {
    return {
      type: 'serverless',
      color: '#eab308',
      iconName: 'Zap',
      latencyMs: 28,
      throughputRps: 600,
      defaultSubtitle: image || 'Serverless / MRO Unit',
    };
  }
  if (/(kong|envoy|traefik|haproxy|gateway|ingress|alb|loadbalancer|lb|apigateway|depo giriş|depo giris|inbound|mal kabul|goods receipt)/.test(token)) {
    return {
      type: 'gateway',
      color: '#818cf8',
      iconName: 'Network',
      latencyMs: 9,
      throughputRps: 1200,
      defaultSubtitle: image || 'API Gateway / Inbound',
    };
  }
  if (/(client|frontend|web|storefront|nextjs|react|browser|mobile|cdn|cloudfront|satın alma|satin alma|tedarikçi|tedarikci|el terminali|barkod|rfid)/.test(token)) {
    return {
      type: 'client',
      color: '#38bdf8',
      iconName: token.includes('terminal') || token.includes('barkod') || token.includes('mobile') ? 'Smartphone' : 'Globe',
      latencyMs: 14,
      throughputRps: 650,
      defaultSubtitle: image || 'Web / Edge Client',
    };
  }
  if (/(stripe|openai|twilio|sendgrid|webhook|external|thirdparty|e-irsaliye|irsaliye|sevkiyat|teslimat)/.test(token)) {
    return {
      type: 'external',
      color: '#10b981',
      iconName: 'ExternalLink',
      latencyMs: 65,
      throughputRps: 450,
      defaultSubtitle: image || 'External API / Sevkiyat',
    };
  }
  if (/(kalite|quality|iqc|oqc|karantina)/.test(token)) {
    return {
      type: 'service',
      color: '#10b981',
      iconName: 'ShieldCheck',
      latencyMs: 26,
      throughputRps: 620,
      defaultSubtitle: image || 'Kalite Kontrol (QA)',
    };
  }
  return {
    type: 'service',
    color: '#a855f7',
    iconName: 'Server',
    latencyMs: 28,
    throughputRps: 560,
    defaultSubtitle: image || 'Microservice / Departman',
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
    return { protocol: 'HTTP/REST', latencyMs: 20, label: 'PUT / GET Object' };
  }
  if (fromType === 'client') {
    return { protocol: 'HTTP/REST', latencyMs: 16, label: 'HTTPS /api' };
  }
  return { protocol: 'gRPC', latencyMs: 9, label: 'RPC Call' };
}

function formatReadableTitle(rawId: string): string {
  return rawId
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function parseErpCsvToTopology(csvText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return { nodes: [], edges: [] };
  }

  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  const rows = lines.map(line =>
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  const headerCandidate = rows[0].join(' ').toLowerCase();
  const hasHeader = /(departman|kaynak|adim|adım|source|from|hedef|target|to|süreç|surec|kapasite|rps|latency)/i.test(
    headerCandidate
  );
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const ensureNode = (rawName: string, subtitleHint = '', customLat?: number, customRps?: number): GraphNode => {
    const cleanTitle = rawName.trim().slice(0, 32);
    const key = cleanTitle.toLowerCase();
    const existing = nodeMap.get(key);
    if (existing) {
      if (subtitleHint && existing.subtitle === classifyByImageOrName(cleanTitle).defaultSubtitle) {
        existing.subtitle = subtitleHint.slice(0, 36);
      }
      if (customLat && Number.isFinite(customLat)) existing.latencyMs = Math.max(1, customLat);
      if (customRps && Number.isFinite(customRps)) existing.throughputRps = Math.max(10, customRps);
      return existing;
    }

    const classified = classifyByImageOrName(cleanTitle, subtitleHint);
    const idx = nodeMap.size;
    const node: GraphNode = {
      id: `erp-node-${idx + 1}`,
      type: classified.type,
      title: cleanTitle,
      subtitle: (subtitleHint || classified.defaultSubtitle).slice(0, 36),
      x: 100 + (idx % 4) * 280,
      y: 100 + Math.floor(idx / 4) * 140,
      width: 190,
      height: 90,
      status: 'healthy',
      circuitBreaker: 'closed',
      latencyMs: customLat && Number.isFinite(customLat) ? Math.max(1, customLat) : classified.latencyMs,
      errorRate: 0.1,
      throughputRps: customRps && Number.isFinite(customRps) ? Math.max(10, customRps) : classified.throughputRps,
      color: classified.color,
      iconName: classified.iconName,
    };
    nodeMap.set(key, node);
    return node;
  };

  let edgeIdx = 1;
  for (const cols of dataRows) {
    const fromName = cols[0] || '';
    const toName = cols[1] || '';
    const desc = cols[2] || '';
    const latNum = cols[3] ? Number(cols[3].replace(/[^0-9.]/g, '')) : undefined;
    const rpsNum = cols[4] ? Number(cols[4].replace(/[^0-9.]/g, '')) : undefined;

    if (!fromName) continue;
    const fromNode = ensureNode(fromName, desc, latNum, rpsNum);

    if (toName) {
      const toNode = ensureNode(toName, '', undefined, undefined);
      if (fromNode.id !== toNode.id) {
        const proto = inferProtocol(fromNode.type, toNode.type);
        edges.push({
          id: `erp-csv-e${edgeIdx++}`,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          protocol: proto.protocol,
          latencyMs: latNum && Number.isFinite(latNum) ? Math.max(1, Math.round(latNum * 0.6)) : proto.latencyMs,
          errorRate: 0,
          label: (desc || proto.label).slice(0, 22),
        });
      }
    }
  }

  const nodes = Array.from(nodeMap.values());

  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const proto = inferProtocol(nodes[i].type, nodes[i + 1].type);
      edges.push({
        id: `erp-csv-chain-${i + 1}`,
        fromNodeId: nodes[i].id,
        toNodeId: nodes[i + 1].id,
        protocol: proto.protocol,
        latencyMs: proto.latencyMs,
        errorRate: 0,
        label: proto.label,
      });
    }
  }

  return {
    nodes: autoLayoutTopology(nodes),
    edges,
  };
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

function parsePackageJsonToTopology(pkg: Record<string, any>): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const deps = {
    ...(typeof pkg.dependencies === 'object' ? pkg.dependencies : {}),
    ...(typeof pkg.devDependencies === 'object' ? pkg.devDependencies : {}),
  };
  const depKeys = Object.keys(deps).map(k => k.toLowerCase());
  const projectName = typeof pkg.name === 'string' && pkg.name.trim() ? formatReadableTitle(pkg.name) : 'Core API Service';

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

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

  if (depKeys.some(k => /(ioredis|^redis$|upstash|memcached|keyv)/.test(k))) {
    addDownstream('pkg-redis', 'cache', 'Redis Cache Cluster', 'ioredis Low-Latency', '#f43f5e', 'Cpu', 2, 1900);
  }

  if (depKeys.some(k => /(kafkajs|amqplib|bullmq|^bull$|sqs|rabbitmq|nats)/.test(k))) {
    const qSub = depKeys.includes('kafkajs') ? 'Apache Kafka (kafkajs)' : 'BullMQ / Event Stream';
    addDownstream('pkg-queue', 'queue', 'Event Stream Broker', qSub, '#f59e0b', 'Shuffle', 7, 1300);
  }

  if (depKeys.some(k => /(client-s3|aws-sdk|minio|uploadthing|cloudinary)/.test(k))) {
    addDownstream('pkg-s3', 'storage', 'Object StorageBucket', 'AWS S3 SDK v3', '#14b8a6', 'HardDrive', 38, 400);
  }

  if (depKeys.some(k => /(stripe|openai|anthropic|twilio|resend|sendgrid|lemonsqueezy)/.test(k))) {
    const extSub = depKeys.includes('stripe')
      ? 'Stripe Billing & Webhooks'
      : depKeys.some(k => /(openai|anthropic)/.test(k))
        ? 'LLM Inference API'
        : 'Third-Party Webhook API';
    addDownstream('pkg-ext', 'external', 'External Provider API', extSub, '#10b981', 'ExternalLink', 95, 320);
  }

  if (nodes.length <= 3) {
    addDownstream('pkg-db-default', 'database', 'Primary Database', 'PostgreSQL 16', '#3b82f6', 'Database', 20, 500);
  }

  return {
    nodes: autoLayoutTopology(nodes),
    edges,
  };
}

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

export function parseInfrastructureToTopology(rawContent: string, filename = ''): ImportTopologyResult {
  const trimmed = rawContent.trim();
  const lowerFile = filename.toLowerCase();

  if (trimmed.startsWith('{') || lowerFile.endsWith('.json')) {
    const parsed = JSON.parse(trimmed);

    if (
      lowerFile.endsWith('package.json') ||
      (parsed && typeof parsed === 'object' && !Array.isArray(parsed.nodes) && (parsed.dependencies || parsed.devDependencies))
    ) {
      const { nodes, edges } = parsePackageJsonToTopology(parsed);
      return { format: 'package-json', nodes, edges };
    }

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

  if (/resource\s+"[^"]+"\s+"[^"]+"/.test(trimmed) || lowerFile.endsWith('.tf')) {
    const { nodes, edges } = parseTerraformToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No supported Terraform resources (RDS, ElastiCache, SQS, S3, ALB, ECS, Lambda) found.');
    }
    return { format: 'terraform', nodes, edges };
  }

  if (/^(openapi|swagger)\s*:/m.test(trimmed) && /paths\s*:/m.test(trimmed)) {
    const { nodes, edges } = parseOpenApiToTopology(trimmed);
    return { format: 'openapi', nodes, edges };
  }

  if (/services\s*:/.test(trimmed) || lowerFile.endsWith('.yml') || lowerFile.endsWith('.yaml')) {
    const { nodes, edges } = parseDockerComposeToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No valid services found under the "services:" key in docker-compose.yml.');
    }
    return { format: 'docker-compose', nodes, edges };
  }

  const firstLine = trimmed.split(/\r?\n/)[0] || '';
  if (
    lowerFile.endsWith('.csv') ||
    lowerFile.endsWith('.tsv') ||
    firstLine.includes(';') ||
    firstLine.includes('\t') ||
    (trimmed.includes('\n') && (firstLine.match(/,/g) || []).length >= 2)
  ) {
    const { nodes, edges } = parseErpCsvToTopology(trimmed);
    if (nodes.length > 0) {
      return { format: 'erp-csv', nodes, edges };
    }
  }

  if (
    /(erp|kurumsal kaynak|inbound|outbound|depo giriş|depo giris|depo çıkış|depo cikis|mal kabul|satın alma|kalite kontrol|ar-ge|arge|üretim|uretim|bakım|bakim|pick list|fifo|lifo|sevkiyat)/i.test(
      trimmed
    )
  ) {
    const generated = synthesizeArchitectureOffline(trimmed);
    if (generated.nodes.length > 0) {
      return { format: 'erp-process', nodes: generated.nodes, edges: generated.edges };
    }
  }

  throw new Error(
    'Unrecognized file format. Paste or upload a valid ERP CSV/Excel table, ERP process description, docker-compose.yml, main.tf, package.json, openapi.yaml, or GraphFlow .json file.'
  );
}
