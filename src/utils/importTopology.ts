import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';
import { sanitizeArchitectureImport } from './securitySanitizer';
import { autoLayoutTopology } from './simulationPhysics';
import { synthesizeArchitectureOffline } from '../services/aiGenerator';

export interface ImportTopologyResult {
  format:
    | 'json'
    | 'docker-compose'
    | 'terraform'
    | 'package-json'
    | 'openapi'
    | 'erp-csv'
    | 'erp-process'
    | 'drawio'
    | 'excalidraw'
    | 'mermaid';
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const SAMPLE_DRAWIO_IMPORT = `<mxfile host="app.diagrams.net">
  <diagram name="Cloud Architecture">
    <mxGraphModel>
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="n1" value="Web &amp; Mobile Client" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1" />
        <mxCell id="n2" value="Envoy API Gateway" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1" />
        <mxCell id="n3" value="Order &amp; Checkout Service" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1" />
        <mxCell id="n4" value="Redis Lock &amp; Cache" style="shape=cylinder3;whiteSpace=wrap;html=1;" vertex="1" parent="1" />
        <mxCell id="n5" value="PostgreSQL Ledger DB" style="shape=mxgraph.aws4.rds;whiteSpace=wrap;html=1;" vertex="1" parent="1" />
        <mxCell id="n6" value="Kafka Event Stream" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1" />
        <mxCell id="e1" value="HTTPS /api" edge="1" parent="1" source="n1" target="n2" />
        <mxCell id="e2" value="gRPC" edge="1" parent="1" source="n2" target="n3" />
        <mxCell id="e3" value="SETNX / GET" edge="1" parent="1" source="n3" target="n4" />
        <mxCell id="e4" value="SERIALIZABLE TX" edge="1" parent="1" source="n3" target="n5" />
        <mxCell id="e5" value="order.created" edge="1" parent="1" source="n3" target="n6" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

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

  // ERP & Cloud Databases / Stock Ledgers
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
  // Cache / Real-time Visibility
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
  // Queues / Pick Lists / Conveyors
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
  // Storage / Outbound Warehouse
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
  // Serverless / MRO Maintenance Triggers
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
  // Gateways / Inbound Receiving
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
  // Clients / Purchase Orders / Barcode Scanners
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
  // External APIs / e-Waybill / Dispatch
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
  // Quality Control special icon/color
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

/**
 * Parses an ERP / Excel / CSV / TSV table (semicolon, comma, or tab separated)
 * into a multi-department GraphFlow topology.
 */
function parseErpCsvToTopology(csvText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Detect delimiter (; for Turkish Excel, \t for TSV paste, or , for standard CSV)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

  const rows = lines.map(line =>
    line.split(delimiter).map(cell => cell.trim().replace(/^["']|["']$/g, ''))
  );

  // Skip header row if first row matches common header keywords
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

  // If single-column list was provided with no edges, chain them sequentially
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

/**
 * Parses Terraform (.tf) resource blocks into a GraphFlow topology.
 */
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

function cleanDiagramLabel(raw: string): string {
  const decoded = raw
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&');

  const headingMatch = decoded.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i);
  const targetHtml = headingMatch ? headingMatch[1] : decoded;

  return targetHtml
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(div|p|li|tr)>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getXmlAttr(attrs: string, name: string): string {
  const m = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2] ?? '') : '';
}

/**
 * Pure RFC 1951 raw DEFLATE decompressor for compressed draw.io <diagram> blocks (zero external dependencies).
 */
function inflateRawBytes(src: Uint8Array): Uint8Array {
  let pos = 0;
  let bitBuf = 0;
  let bitCnt = 0;
  const out: number[] = [];

  const bits = (n: number): number => {
    while (bitCnt < n) {
      bitBuf |= (src[pos++] || 0) << bitCnt;
      bitCnt += 8;
    }
    const val = bitBuf & ((1 << n) - 1);
    bitBuf >>>= n;
    bitCnt -= n;
    return val;
  };

  const buildTree = (lengths: Int32Array): Map<number, number> => {
    const counts = new Int32Array(16);
    const nextCode = new Int32Array(16);
    for (let i = 0; i < lengths.length; i++) {
      if (lengths[i]) counts[lengths[i]]++;
    }
    let code = 0;
    for (let b = 1; b <= 15; b++) {
      code = (code + counts[b - 1]) << 1;
      nextCode[b] = code;
    }
    const map = new Map<number, number>();
    for (let sym = 0; sym < lengths.length; sym++) {
      const len = lengths[sym];
      if (len) map.set((len << 16) | nextCode[len]++, sym);
    }
    return map;
  };

  const decode = (tree: Map<number, number>): number => {
    let code = 0;
    for (let len = 1; len <= 15; len++) {
      code = (code << 1) | bits(1);
      const sym = tree.get((len << 16) | code);
      if (sym !== undefined) return sym;
    }
    throw new Error('Invalid DEFLATE Huffman code');
  };

  const fixedLit = new Int32Array(288);
  for (let i = 0; i <= 143; i++) fixedLit[i] = 8;
  for (let i = 144; i <= 255; i++) fixedLit[i] = 9;
  for (let i = 256; i <= 279; i++) fixedLit[i] = 7;
  for (let i = 280; i <= 287; i++) fixedLit[i] = 8;
  const fixedDist = new Int32Array(32).fill(5);
  const fixedLitTree = buildTree(fixedLit);
  const fixedDistTree = buildTree(fixedDist);

  const lenBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
  const lenExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
  const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
  const distExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
  const clOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

  let bfinal = 0;
  while (!bfinal) {
    bfinal = bits(1);
    const btype = bits(2);
    if (btype === 0) {
      bitBuf = 0;
      bitCnt = 0;
      const len = src[pos] | (src[pos + 1] << 8);
      pos += 4;
      for (let i = 0; i < len; i++) out.push(src[pos++]);
    } else if (btype === 1 || btype === 2) {
      let litTree = fixedLitTree;
      let distTree = fixedDistTree;
      if (btype === 2) {
        const hlit = bits(5) + 257;
        const hdist = bits(5) + 1;
        const hclen = bits(4) + 4;
        const clLens = new Int32Array(19);
        for (let i = 0; i < hclen; i++) clLens[clOrder[i]] = bits(3);
        const clTree = buildTree(clLens);
        const lens = new Int32Array(hlit + hdist);
        for (let i = 0; i < hlit + hdist; ) {
          const sym = decode(clTree);
          if (sym < 16) {
            lens[i++] = sym;
          } else if (sym === 16) {
            const prev = lens[i - 1];
            let rep = bits(2) + 3;
            while (rep--) lens[i++] = prev;
          } else if (sym === 17) {
            let rep = bits(3) + 3;
            while (rep--) lens[i++] = 0;
          } else {
            let rep = bits(7) + 11;
            while (rep--) lens[i++] = 0;
          }
        }
        litTree = buildTree(lens.subarray(0, hlit));
        distTree = buildTree(lens.subarray(hlit));
      }
      while (true) {
        const sym = decode(litTree);
        if (sym === 256) break;
        if (sym < 256) {
          out.push(sym);
        } else {
          const lIdx = sym - 257;
          const length = lenBase[lIdx] + bits(lenExtra[lIdx]);
          const dSym = decode(distTree);
          const dist = distBase[dSym] + bits(distExtra[dSym]);
          const start = out.length - dist;
          for (let i = 0; i < length; i++) out.push(out[start + i]);
        }
      }
    } else {
      throw new Error('Invalid DEFLATE block type');
    }
  }
  return new Uint8Array(out);
}

function expandCompressedDrawioDiagrams(xmlText: string): string {
  return xmlText.replace(/<diagram\b[^>]*>([\s\S]*?)<\/diagram>/gi, (fullMatch, inner: string) => {
    const trimmedInner = inner.trim();
    if (!trimmedInner || /<mxGraphModel\b|<mxCell\b/i.test(trimmedInner)) {
      return fullMatch;
    }
    try {
      const b64 = trimmedInner.replace(/\s+/g, '');
      const binaryStr = typeof atob === 'function' ? atob(b64) : Buffer.from(b64, 'base64').toString('binary');
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
      const inflated = new TextDecoder().decode(inflateRawBytes(bytes));
      return `<diagram>${decodeURIComponent(inflated)}</diagram>`;
    } catch {
      return fullMatch;
    }
  });
}

/**
 * Parses draw.io / diagrams.net (.drawio, .xml, .drawio.svg) mxGraphModel XML (both uncompressed and Base64+DEFLATE compressed) into a live GraphFlow topology.
 */
function parseDrawioToTopology(xmlText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  // Handle .drawio.svg files where the mxfile XML is HTML-encoded inside a content="..." attribute
  let normalized = xmlText;
  if (!/<mxCell\b/i.test(normalized) && /content\s*=\s*"[^"]*&lt;mxfile/i.test(normalized)) {
    const contentMatch = normalized.match(/content\s*=\s*"([^"]*)"/i);
    if (contentMatch) {
      normalized = contentMatch[1]
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&amp;/gi, '&');
    }
  }

  // Decompress Base64 + raw DEFLATE <diagram> blocks used by draw.io Desktop / Electron
  normalized = expandCompressedDrawioDiagrams(normalized);

  // Merge <object> or <UserObject> wrappers into their child <mxCell> so id and label/value stay together
  normalized = normalized.replace(
    /<(?:object|UserObject)\b([^>]*)>\s*<mxCell\b([^>]*)>/gi,
    '<mxCell $1 $2>'
  );

  const cellRegex = /<mxCell\b([^>]*?)(?:\/>|>([\s\S]*?)<\/mxCell>)/gi;
  const rawVertices: Array<{ id: string; title: string; style: string }> = [];
  const rawEdges: Array<{ id: string; source: string; target: string; label: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = cellRegex.exec(normalized)) !== null) {
    const attrs = match[1] || '';
    const id = getXmlAttr(attrs, 'id');
    if (!id || id === '0' || id === '1') continue;

    const isEdge = getXmlAttr(attrs, 'edge') === '1' || (Boolean(getXmlAttr(attrs, 'source')) && Boolean(getXmlAttr(attrs, 'target')));
    const isVertex = getXmlAttr(attrs, 'vertex') === '1';
    const rawVal = getXmlAttr(attrs, 'value') || getXmlAttr(attrs, 'label');
    const style = getXmlAttr(attrs, 'style');

    if (isEdge) {
      const source = getXmlAttr(attrs, 'source');
      const target = getXmlAttr(attrs, 'target');
      if (source && target && source !== target) {
        rawEdges.push({
          id,
          source,
          target,
          label: cleanDiagramLabel(rawVal),
        });
      }
      continue;
    }

    if (isVertex) {
      // Skip edge labels or huge slide title banners (font-size >= 36px)
      if (/edgeLabel/i.test(style) || /font-size:\s*[3-9]\dpx/i.test(rawVal)) continue;
      let cleanTitle = cleanDiagramLabel(rawVal);
      if (!cleanTitle) {
        const shapeMatch = style.match(/mxgraph\.(?:aws\d*|gcp\d*|azure|kubernetes)\.([a-zA-Z0-9_-]+)/i);
        if (shapeMatch) {
          cleanTitle = formatReadableTitle(shapeMatch[1]);
        }
      }
      // Skip empty boxes or tiny 2-3 char port markers (IN, OUT, YES, NO)
      if (!cleanTitle || /^(in|out|yes|no|ok|\d+)$/i.test(cleanTitle)) continue;
      rawVertices.push({ id, title: cleanTitle.slice(0, 32), style });
    }
  }

  const nodes: GraphNode[] = rawVertices.map((v, idx) => {
    const classified = classifyByImageOrName(v.title, v.style);
    return {
      id: `drawio-${v.id}`,
      type: classified.type,
      title: v.title,
      subtitle: classified.defaultSubtitle,
      x: 100 + (idx % 4) * 280,
      y: 100 + Math.floor(idx / 4) * 140,
      width: 190,
      height: 90,
      status: 'healthy',
      circuitBreaker: 'closed',
      latencyMs: classified.latencyMs,
      errorRate: 0.1,
      throughputRps: classified.throughputRps,
      color: classified.color,
      iconName: classified.iconName,
    };
  });

  const nodeByRawId = new Map(rawVertices.map((v, idx) => [v.id, nodes[idx]]));
  const edges: GraphEdge[] = [];
  let edgeIdx = 1;

  for (const e of rawEdges) {
    const fromNode = nodeByRawId.get(e.source);
    const toNode = nodeByRawId.get(e.target);
    if (!fromNode || !toNode || fromNode.id === toNode.id) continue;
    const proto = inferProtocol(fromNode.type, toNode.type);
    edges.push({
      id: `drawio-e-${edgeIdx++}`,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      protocol: proto.protocol,
      latencyMs: proto.latencyMs,
      errorRate: 0,
      label: (e.label || proto.label).slice(0, 22),
    });
  }

  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const proto = inferProtocol(nodes[i].type, nodes[i + 1].type);
      edges.push({
        id: `drawio-chain-${i + 1}`,
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

/**
 * Parses an Excalidraw (.excalidraw / JSON) diagram into a live GraphFlow topology.
 */
function parseExcalidrawToTopology(parsed: Record<string, any>): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const elements: any[] = Array.isArray(parsed.elements) ? parsed.elements.filter(el => el && !el.isDeleted) : [];
  const shapes = elements.filter(el => ['rectangle', 'diamond', 'ellipse'].includes(el.type));
  const texts = elements.filter(el => el.type === 'text' && typeof el.text === 'string' && el.text.trim());
  const arrows = elements.filter(el => el.type === 'arrow');

  const idToNodeId = new Map<string, string>();
  const nodes: GraphNode[] = [];
  const usedTextIds = new Set<string>();

  shapes.forEach((shape, idx) => {
    // Find bound text via containerId or spatial containment
    let boundText = texts.find(t => t.containerId === shape.id);
    if (!boundText && typeof shape.x === 'number' && typeof shape.y === 'number') {
      const sx = shape.x;
      const sy = shape.y;
      const sw = shape.width || 160;
      const sh = shape.height || 80;
      boundText = texts.find(
        t =>
          !t.containerId &&
          !usedTextIds.has(t.id) &&
          typeof t.x === 'number' &&
          typeof t.y === 'number' &&
          t.x >= sx - 24 &&
          t.x <= sx + sw + 24 &&
          t.y >= sy - 24 &&
          t.y <= sy + sh + 24
      );
    }

    if (!boundText) return;
    usedTextIds.add(boundText.id);
    const cleanTitle = cleanDiagramLabel(boundText.text).slice(0, 32);
    if (!cleanTitle) return;

    const classified = classifyByImageOrName(cleanTitle);
    const nodeId = `excal-${ nodes.length + 1 }`;
    nodes.push({
      id: nodeId,
      type: classified.type,
      title: cleanTitle,
      subtitle: classified.defaultSubtitle,
      x: 100 + (idx % 4) * 280,
      y: 100 + Math.floor(idx / 4) * 140,
      width: 190,
      height: 90,
      status: 'healthy',
      circuitBreaker: 'closed',
      latencyMs: classified.latencyMs,
      errorRate: 0.1,
      throughputRps: classified.throughputRps,
      color: classified.color,
      iconName: classified.iconName,
    });
    idToNodeId.set(shape.id, nodeId);
    idToNodeId.set(boundText.id, nodeId);
  });

  // Fallback: if the user drew standalone text labels without rectangle containers
  if (nodes.length === 0) {
    texts.forEach((t, idx) => {
      const cleanTitle = cleanDiagramLabel(t.text).slice(0, 32);
      if (!cleanTitle) return;
      const classified = classifyByImageOrName(cleanTitle);
      const nodeId = `excal-${nodes.length + 1}`;
      nodes.push({
        id: nodeId,
        type: classified.type,
        title: cleanTitle,
        subtitle: classified.defaultSubtitle,
        x: 100 + (idx % 4) * 280,
        y: 100 + Math.floor(idx / 4) * 140,
        width: 190,
        height: 90,
        status: 'healthy',
        circuitBreaker: 'closed',
        latencyMs: classified.latencyMs,
        errorRate: 0.1,
        throughputRps: classified.throughputRps,
        color: classified.color,
        iconName: classified.iconName,
      });
      idToNodeId.set(t.id, nodeId);
    });
  }

  const nodeById = new Map(nodes.map(n => [n.id, n]));
  const edges: GraphEdge[] = [];
  let edgeIdx = 1;

  for (const arrow of arrows) {
    const fromId = arrow.startBinding?.elementId ? idToNodeId.get(arrow.startBinding.elementId) : undefined;
    const toId = arrow.endBinding?.elementId ? idToNodeId.get(arrow.endBinding.elementId) : undefined;
    if (!fromId || !toId || fromId === toId) continue;

    const fromNode = nodeById.get(fromId);
    const toNode = nodeById.get(toId);
    if (!fromNode || !toNode) continue;

    const boundArrowText = texts.find(t => t.containerId === arrow.id);
    const proto = inferProtocol(fromNode.type, toNode.type);
    edges.push({
      id: `excal-e-${edgeIdx++}`,
      fromNodeId: fromNode.id,
      toNodeId: toNode.id,
      protocol: proto.protocol,
      latencyMs: proto.latencyMs,
      errorRate: 0,
      label: (boundArrowText ? cleanDiagramLabel(boundArrowText.text) : proto.label).slice(0, 22),
    });
  }

  if (edges.length === 0 && nodes.length > 1) {
    for (let i = 0; i < nodes.length - 1; i++) {
      const proto = inferProtocol(nodes[i].type, nodes[i + 1].type);
      edges.push({
        id: `excal-chain-${i + 1}`,
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

/**
 * Parses a Mermaid.js flowchart / graph definition into a live GraphFlow topology.
 */
function parseMermaidToTopology(rawText: string): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const cleaned = rawText
    .replace(/^```mermaid\s*/im, '')
    .replace(/```\s*$/m, '')
    .trim();

  const lines = cleaned
    .split(/\r?\n/)
    .map(l => l.replace(/%%.*$/, '').trim())
    .filter(
      l =>
        l.length > 0 &&
        !/^(flowchart|graph|subgraph|end|style|classDef|class|click|linkStyle|direction)\b/i.test(l)
    );

  const nodeMap = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  const parseEndpoint = (token: string): GraphNode | null => {
    const trimmed = token.trim();
    if (!trimmed) return null;

    // Matches ID[Label], ID([Label]), ID[(Label)], ID((Label)), ID{Label}, or bare ID
    const m = trimmed.match(/^([a-zA-Z0-9_.-]+)\s*(?:[\[\(\{]+(["']?)(.*?)\2[\]\)\}]+)?$/);
    const rawId = m ? m[1] : trimmed;
    const rawLabel = m && m[3] ? cleanDiagramLabel(m[3]) : formatReadableTitle(rawId);
    const key = rawId.toLowerCase();

    const existing = nodeMap.get(key);
    if (existing) {
      if (m && m[3] && existing.title === formatReadableTitle(rawId)) {
        existing.title = rawLabel.slice(0, 32);
        const reclassified = classifyByImageOrName(existing.title, rawId);
        existing.type = reclassified.type;
        existing.color = reclassified.color;
        existing.iconName = reclassified.iconName;
        existing.latencyMs = reclassified.latencyMs;
        existing.throughputRps = reclassified.throughputRps;
        existing.subtitle = reclassified.defaultSubtitle;
      }
      return existing;
    }

    const classified = classifyByImageOrName(rawLabel, rawId);
    const idx = nodeMap.size;
    const node: GraphNode = {
      id: `mmd-${idx + 1}`,
      type: classified.type,
      title: rawLabel.slice(0, 32),
      subtitle: classified.defaultSubtitle,
      x: 100 + (idx % 4) * 280,
      y: 100 + Math.floor(idx / 4) * 140,
      width: 190,
      height: 90,
      status: 'healthy',
      circuitBreaker: 'closed',
      latencyMs: classified.latencyMs,
      errorRate: 0.1,
      throughputRps: classified.throughputRps,
      color: classified.color,
      iconName: classified.iconName,
    };
    nodeMap.set(key, node);
    return node;
  };

  let edgeIdx = 1;
  for (const line of lines) {
    // Match A -->|label| B, A -- label --> B, A -.-> B, A ==> B
    const edgeMatch =
      line.match(/^(.+?)\s*(?:--+|\.-+|==+)>\s*(?:\|([^|]*)\|\s*)?(.+)$/) ||
      line.match(/^(.+?)\s*--\s*([^-]+?)\s*-->\s*(.+)$/);

    if (edgeMatch) {
      const fromNode = parseEndpoint(edgeMatch[1]);
      const edgeLabel = cleanDiagramLabel(edgeMatch[2] || '');
      const toNode = parseEndpoint(edgeMatch[3]);
      if (fromNode && toNode && fromNode.id !== toNode.id) {
        const proto = inferProtocol(fromNode.type, toNode.type);
        edges.push({
          id: `mmd-e-${edgeIdx++}`,
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
          protocol: proto.protocol,
          latencyMs: proto.latencyMs,
          errorRate: 0,
          label: (edgeLabel || proto.label).slice(0, 22),
        });
      }
    } else if (/^[a-zA-Z0-9_.-]+\s*[\[\(\{]/.test(line)) {
      parseEndpoint(line);
    }
  }

  return {
    nodes: autoLayoutTopology(Array.from(nodeMap.values())),
    edges,
  };
}

/**
 * Universal infrastructure & ERP importer supporting draw.io (.drawio/.xml), Excalidraw (.excalidraw),
 * Mermaid.js flowcharts, GraphFlow JSON, ERP/Excel CSV tables, ERP process descriptions,
 * package.json, OpenAPI/Swagger, Docker Compose YAML, and Terraform HCL.
 */
export function parseInfrastructureToTopology(rawContent: string, filename = ''): ImportTopologyResult {
  const trimmed = rawContent.trim();
  const lowerFile = filename.toLowerCase();

  // 0. Try draw.io / diagrams.net XML (.drawio, .xml, .drawio.svg, <mxfile>, <mxGraphModel>)
  if (
    lowerFile.endsWith('.drawio') ||
    lowerFile.endsWith('.drawio.xml') ||
    lowerFile.endsWith('.drawio.svg') ||
    /<(mxfile|mxGraphModel|mxCell)\b/i.test(trimmed) ||
    (/<svg\b/i.test(trimmed) && /&lt;mxfile\b/i.test(trimmed))
  ) {
    const { nodes, edges } = parseDrawioToTopology(trimmed);
    if (nodes.length === 0) {
      throw new Error('No labeled vertex boxes found in draw.io (.drawio / mxGraphModel) file.');
    }
    return { format: 'drawio', nodes, edges };
  }

  // 1. Try JSON or Excalidraw (.excalidraw / .json)
  if (trimmed.startsWith('{') || lowerFile.endsWith('.json') || lowerFile.endsWith('.excalidraw')) {
    const parsed = JSON.parse(trimmed);

    if (
      lowerFile.endsWith('.excalidraw') ||
      (parsed && typeof parsed === 'object' && (parsed.type === 'excalidraw' || Array.isArray(parsed.elements)))
    ) {
      const { nodes, edges } = parseExcalidrawToTopology(parsed);
      if (nodes.length === 0) {
        throw new Error('No labeled shapes or text nodes found in Excalidraw (.excalidraw) file.');
      }
      return { format: 'excalidraw', nodes, edges };
    }

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

  // 1.5 Try Mermaid.js flowchart / graph (.mmd, .mermaid, or flowchart/graph syntax)
  if (
    lowerFile.endsWith('.mmd') ||
    lowerFile.endsWith('.mermaid') ||
    /^(?:```mermaid\s*\r?\n\s*)?(?:flowchart|graph)\s+(?:LR|RL|TD|TB|BT)\b/im.test(trimmed) ||
    (/[a-zA-Z0-9_.-]+\s*\[[^\]]+\]\s*(?:--+|\.-+|==+)>/m.test(trimmed))
  ) {
    const { nodes, edges } = parseMermaidToTopology(trimmed);
    if (nodes.length > 0) {
      return { format: 'mermaid', nodes, edges };
    }
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

  // 5. Try ERP / Excel CSV or TSV table (.csv, .tsv, or multi-line delimited with ; / \t / ,)
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

  // 6. Try ERP / Multi-Department plain text description (for non-technical ERP users pasting process descriptions)
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
