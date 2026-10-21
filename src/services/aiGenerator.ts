import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';

export interface GeneratedArchitecture {
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  usedOnlineGemini?: boolean;
  warningMessage?: string;
}

interface ComponentSpec {
  id: string;
  type: NodeType;
  title: string;
  subtitle: string;
  layer: number; // 0: client, 1: ingress, 2: service, 3: cache/queue, 4: db/external
  color: string;
  iconName: string;
  latencyMs: number;
  errorRate: number;
  throughputRps: number;
  circuitBreaker?: 'closed' | 'open' | 'half-open';
  connectedTo: string[]; // target node ids
  protocol: ProtocolType;
  edgeLabel?: string;
}

const STANDARD_ERP_DEPARTMENTS_REGEX =
  /(depo giriş|depo giris|inbound|goods receipt|depo çıkış|depo cikis|outbound|goods issue|ar-ge|arge|r&d|research|kalite kontrol|quality control|iqc|oqc|üretim departman|uretim departman|production|shop floor|bakım departman|bakim departman|maintenance|mro|erp depo|format ve dil|metin içeriğinde)/i;

/**
 * Extracts custom department or process step titles from bulleted/numbered lines like:
 * "- Finans Departmanı (Finance): Fatura ve maliyet kontrolü"
 */
function extractCustomDepartmentsFromPrompt(prompt: string): Array<{ title: string; subtitle: string }> {
  const lines = prompt.split(/\r?\n/);
  const extracted: Array<{ title: string; subtitle: string }> = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    const match = trimmed.match(/^(?:[-*•]|\d+[.)])\s*([^:\n]{3,48})\s*:\s*(.+)$/);
    if (!match) continue;

    const rawHeader = match[1].trim();
    const rawDesc = match[2].trim();
    if (STANDARD_ERP_DEPARTMENTS_REGEX.test(rawHeader)) continue;

    const parenMatch = rawHeader.match(/^([^(]+)\(([^)]+)\)/);
    const title = (parenMatch ? parenMatch[1].trim() : rawHeader).slice(0, 28);
    const subtitle = (parenMatch ? parenMatch[2].trim() : rawDesc).slice(0, 32);

    if (title.length >= 3 && !extracted.some(e => e.title.toLowerCase() === title.toLowerCase())) {
      extracted.push({ title, subtitle });
    }
  }

  return extracted.slice(0, 4);
}

/**
 * Synthesizes a multi-department ERP, Warehouse (Inbound/Outbound), and Factory Production (MES) topology
 * where every department (Ar-Ge, Kalite Kontrol, Üretim, Bakım, Inbound, Outbound, FIFO Stok) is rendered as its own node.
 */
function synthesizeErpMultiDepartmentTopology(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase();
  const specs: ComponentSpec[] = [];

  // Layer 0: Entry Triggers (Purchase Orders & Barcode/RFID Hand Terminals)
  specs.push({
    id: 'erp-po-supplier',
    type: 'client',
    title: 'Satın Alma & Tedarikçi',
    subtitle: 'Purchase Order (PO / İrsaliye)',
    layer: 0,
    color: '#38bdf8',
    iconName: 'Globe',
    latencyMs: 14,
    errorRate: 0.1,
    throughputRps: 450,
    connectedTo: ['erp-inbound-warehouse'],
    protocol: 'HTTP/REST',
    edgeLabel: 'PO / Sevk',
  });

  specs.push({
    id: 'erp-barcode-terminal',
    type: 'client',
    title: 'El Terminali & Barkod',
    subtitle: 'RFID / Barkod Okutma (WMS)',
    layer: 0,
    color: '#0ea5e9',
    iconName: 'Smartphone',
    latencyMs: 10,
    errorRate: 0.1,
    throughputRps: 650,
    connectedTo: ['erp-inbound-warehouse'],
    protocol: 'HTTP/REST',
    edgeLabel: 'Barkod Okut',
  });

  // Layer 1: Depo Giriş (Inbound / Goods Receipt)
  const deptIds: string[] = [];
  specs.push({
    id: 'erp-inbound-warehouse',
    type: 'gateway',
    title: 'Depo Giriş (Inbound)',
    subtitle: 'Mal Kabul / Goods Receipt',
    layer: 1,
    color: '#818cf8',
    iconName: 'Network',
    latencyMs: 12,
    errorRate: 0.1,
    throughputRps: 1100,
    circuitBreaker: 'closed',
    connectedTo: deptIds,
    protocol: 'gRPC',
    edgeLabel: 'Mal Kabul',
  });

  // Layer 2: Multi-Department Units (Ar-Ge, Kalite Kontrol, Üretim, Bakım + any custom departments)
  const hasArge = /(ar-ge|arge|r&d|research|reçete|recete|ürün ağacı|urun agaci|\bbom\b|prototip)/i.test(p);
  const hasQuality = /(kalite|quality|\biqc\b|\boqc\b|\bqa\b|karantina|numune|kontrol)/i.test(p);
  const hasProduction = /(üretim|uretim|production|imalat|\bmes\b|iş emri|is emri|yarı mamul|wip|montaj)/i.test(p);
  const hasMaintenance = /(bakım|bakim|maintenance|\bmro\b|arıza|ariza|yedek parça|yedek parca)/i.test(p);

  if (hasArge || (!hasQuality && !hasProduction && !hasMaintenance)) {
    deptIds.push('dept-rd-bom');
    specs.push({
      id: 'dept-rd-bom',
      type: 'service',
      title: 'Ar-Ge Departmanı (R&D)',
      subtitle: 'BOM / Ürün Ağacı & Reçete',
      layer: 2,
      color: '#a855f7',
      iconName: 'Cpu',
      latencyMs: 22,
      errorRate: 0.1,
      throughputRps: 520,
      circuitBreaker: 'closed',
      connectedTo: ['erp-stock-db', 'erp-realtime-visibility'],
      protocol: 'gRPC',
      edgeLabel: 'BOM / Reçete',
    });
  }

  if (hasQuality || deptIds.length < 2) {
    deptIds.push('dept-quality-control');
    specs.push({
      id: 'dept-quality-control',
      type: 'service',
      title: 'Kalite Kontrol (IQC / QA)',
      subtitle: 'Numune Testi & Serbest Stok',
      layer: 2,
      color: '#10b981',
      iconName: 'ShieldCheck',
      latencyMs: 28,
      errorRate: 0.2,
      throughputRps: 600,
      circuitBreaker: 'closed',
      connectedTo: ['erp-stock-db', 'erp-picklist-queue'],
      protocol: 'gRPC',
      edgeLabel: 'Kalite Onayı',
    });
  }

  if (hasProduction || deptIds.length < 3) {
    deptIds.push('dept-production-mes');
    specs.push({
      id: 'dept-production-mes',
      type: 'service',
      title: 'Üretim Departmanı (MES)',
      subtitle: 'İş Emri & Yarı Mamul (WIP)',
      layer: 2,
      color: '#ec4899',
      iconName: 'Server',
      latencyMs: 35,
      errorRate: 0.2,
      throughputRps: 750,
      circuitBreaker: 'closed',
      connectedTo: ['erp-picklist-queue', 'erp-stock-db'],
      protocol: 'gRPC',
      edgeLabel: 'Üretim Emri',
    });
  }

  if (hasMaintenance) {
    deptIds.push('dept-maintenance-mro');
    specs.push({
      id: 'dept-maintenance-mro',
      type: 'service',
      title: 'Bakım Departmanı (MRO)',
      subtitle: 'Yedek Parça & Makine Bakım',
      layer: 2,
      color: '#eab308',
      iconName: 'Zap',
      latencyMs: 24,
      errorRate: 0.1,
      throughputRps: 420,
      circuitBreaker: 'closed',
      connectedTo: ['erp-stock-db', 'erp-realtime-visibility'],
      protocol: 'gRPC',
      edgeLabel: 'MRO Parça',
    });
  }

  const customDepts = extractCustomDepartmentsFromPrompt(prompt);
  customDepts.forEach((cd, idx) => {
    const customId = `dept-custom-${idx + 1}`;
    deptIds.push(customId);
    specs.push({
      id: customId,
      type: 'service',
      title: cd.title,
      subtitle: cd.subtitle || 'ERP Departman Modülü',
      layer: 2,
      color: '#a855f7',
      iconName: 'Layers',
      latencyMs: 25,
      errorRate: 0.1,
      throughputRps: 500,
      circuitBreaker: 'closed',
      connectedTo: ['erp-stock-db', 'erp-picklist-queue'],
      protocol: 'gRPC',
      edgeLabel: 'ERP İşlem',
    });
  });

  // Layer 3: FIFO/LIFO Stock Database, Real-time Visibility Cache & Pick List Queue
  specs.push({
    id: 'erp-realtime-visibility',
    type: 'cache',
    title: 'Anlık İzlenebilirlik',
    subtitle: 'Real-Time Visibility & Lot',
    layer: 3,
    color: '#f43f5e',
    iconName: 'Cpu',
    latencyMs: 3,
    errorRate: 0,
    throughputRps: 2500,
    circuitBreaker: 'closed',
    connectedTo: ['erp-outbound-shipping'],
    protocol: 'TCP',
    edgeLabel: 'Canlı Takip',
  });

  specs.push({
    id: 'erp-picklist-queue',
    type: 'queue',
    title: 'Toplama Listesi (Pick List)',
    subtitle: 'FIFO / LIFO Hazırlık Kuyruğu',
    layer: 3,
    color: '#f59e0b',
    iconName: 'Shuffle',
    latencyMs: 9,
    errorRate: 0.05,
    throughputRps: 1400,
    circuitBreaker: 'closed',
    connectedTo: ['erp-outbound-shipping', 'erp-external-dispatch'],
    protocol: 'Kafka',
    edgeLabel: 'Pick List',
  });

  specs.push({
    id: 'erp-stock-db',
    type: 'database',
    title: 'ERP Merkezi Stok DB',
    subtitle: 'FIFO/LIFO & Stok Düşümü',
    layer: 3,
    color: '#3b82f6',
    iconName: 'Database',
    latencyMs: 16,
    errorRate: 0.05,
    throughputRps: 950,
    circuitBreaker: 'closed',
    connectedTo: ['erp-outbound-shipping'],
    protocol: 'SQL Query',
    edgeLabel: 'Stok Düşümü',
  });

  // Layer 4: Depo Çıkış (Outbound / Goods Issue) & ERP Accounting/Customer Dispatch
  specs.push({
    id: 'erp-outbound-shipping',
    type: 'storage',
    title: 'Depo Çıkış (Outbound)',
    subtitle: 'Goods Issue & Sevkiyat Onayı',
    layer: 4,
    color: '#14b8a6',
    iconName: 'HardDrive',
    latencyMs: 20,
    errorRate: 0.1,
    throughputRps: 850,
    circuitBreaker: 'closed',
    connectedTo: [],
    protocol: 'HTTP/REST',
  });

  specs.push({
    id: 'erp-external-dispatch',
    type: 'external',
    title: 'Sevkiyat & e-İrsaliye',
    subtitle: 'Hatasız Teslimat & ERP Kaydı',
    layer: 4,
    color: '#10b981',
    iconName: 'ExternalLink',
    latencyMs: 35,
    errorRate: 0.1,
    throughputRps: 700,
    circuitBreaker: 'closed',
    connectedTo: [],
    protocol: 'HTTP/REST',
  });

  return buildPositionedTopologyFromSpecs(
    'ERP Depo (Inbound/Outbound) & Departman Entegrasyonu',
    `Auto-generated multi-department ERP workflow matching: "${prompt.slice(0, 120)}"`,
    specs
  );
}

function buildPositionedTopologyFromSpecs(
  title: string,
  description: string,
  specs: ComponentSpec[]
): GeneratedArchitecture {
  const layerXPositions = [80, 360, 640, 920, 1200];
  const layerItems: Record<number, ComponentSpec[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

  specs.forEach(s => {
    const safeLayer = Math.min(4, Math.max(0, s.layer));
    layerItems[safeLayer].push(s);
  });

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const NODE_WIDTH = 190;
  const NODE_HEIGHT = 90;
  const VERTICAL_SPACING = 135;

  Object.keys(layerItems).forEach(lStr => {
    const layer = Number(lStr);
    const items = layerItems[layer];
    const totalHeight = items.length * VERTICAL_SPACING;
    const startY = Math.max(50, 260 - totalHeight / 2);

    items.forEach((item, index) => {
      const nodeX = layerXPositions[layer];
      const nodeY = Math.round(startY + index * VERTICAL_SPACING);

      nodes.push({
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        x: nodeX,
        y: nodeY,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        status: 'healthy',
        circuitBreaker: item.circuitBreaker || 'closed',
        latencyMs: item.latencyMs,
        errorRate: item.errorRate,
        throughputRps: item.throughputRps,
        color: item.color,
        iconName: item.iconName,
      });

      item.connectedTo.forEach((targetId, eIdx) => {
        edges.push({
          id: `edge-${item.id}-${targetId}-${eIdx}`,
          fromNodeId: item.id,
          toNodeId: targetId,
          protocol: item.protocol,
          latencyMs: item.latencyMs > 20 ? 12 : 5,
          errorRate: 0,
          label: item.edgeLabel || item.protocol,
        });
      });
    });
  });

  return {
    title,
    description,
    nodes,
    edges,
  };
}

/**
 * Intelligent client-side rule-based NLP synthesizer.
 * Analyzes natural language prompts and generates realistic distributed or ERP multi-department topologies.
 */
export function synthesizeArchitectureOffline(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase();

  if (
    /(erp|kurumsal kaynak|inbound|outbound|goods receipt|goods issue|depo giriş|depo giris|depo çıkış|depo cikis|mal kabul|satın alma|satin alma|barkod|kalite kontrol|ar-ge|arge|üretim talebi|uretim talebi|pick list|toplama listesi|stok düşümü|stok dusumu|fifo|lifo|sevkiyat|departman|fabrika|üretim hattı|uretim hatti|\bmrp\b|\bmes\b|\bwms\b|\bsap\b|\bodoo\b)/i.test(
      p
    )
  ) {
    return synthesizeErpMultiDepartmentTopology(prompt);
  }

  const specs: ComponentSpec[] = [];

  let title = 'Custom Architecture';
  if (p.includes('food') || p.includes('yemek') || p.includes('restaurant')) {
    title = 'On-Demand Food Delivery Platform';
  } else if (p.includes('fintech') || p.includes('payment') || p.includes('odeme') || p.includes('bank') || p.includes('stripe')) {
    title = 'Resilient Fintech Payment Gateway';
  } else if (p.includes('iot') || p.includes('sensor') || p.includes('telemetry') || p.includes('mqtt')) {
    title = 'Industrial IoT Real-Time Ingestion Cluster';
  } else if (p.includes('cqrs') || p.includes('outbox') || p.includes('event sourcing')) {
    title = 'Transactional Outbox & Event-Sourced Architecture';
  } else if (p.includes('video') || p.includes('stream') || p.includes('netflix') || p.includes('youtube')) {
    title = 'High-Scale Video Streaming Platform';
  } else if (p.includes('chat') || p.includes('messaging') || p.includes('whatsapp') || p.includes('slack')) {
    title = 'Real-time Chat & Collaboration Cluster';
  } else if (p.includes('ecommerce') || p.includes('e-ticaret') || p.includes('shop') || p.includes('store')) {
    title = 'E-Commerce Microservices Engine';
  } else if (p.includes('ai') || p.includes('llm') || p.includes('rag') || p.includes('agent')) {
    title = 'AI Multi-Agent & RAG Pipeline';
  } else if (p.includes('ride') || p.includes('uber') || p.includes('taksi') || p.includes('driver')) {
    title = 'Real-time Ride-Hailing & Geo-Tracking System';
  }

  specs.push({
    id: 'client-web',
    type: 'client',
    title: 'Web Application',
    subtitle: 'Next.js Frontend',
    layer: 0,
    color: '#38bdf8',
    iconName: 'Globe',
    latencyMs: 15,
    errorRate: 0,
    throughputRps: 200,
    connectedTo: ['gateway-api'],
    protocol: 'HTTP/REST',
    edgeLabel: '/api',
  });

  if (p.includes('mobile') || p.includes('app') || p.includes('ios') || p.includes('android') || p.includes('food') || p.includes('ride')) {
    specs.push({
      id: 'client-mobile',
      type: 'client',
      title: 'Mobile App',
      subtitle: 'React Native / Flutter',
      layer: 0,
      color: '#0ea5e9',
      iconName: 'Smartphone',
      latencyMs: 25,
      errorRate: 0.1,
      throughputRps: 350,
      connectedTo: ['gateway-api'],
      protocol: 'HTTP/REST',
      edgeLabel: '/v1/mobile',
    });
  }

  specs.push({
    id: 'gateway-api',
    type: 'gateway',
    title: 'API Gateway',
    subtitle: 'Kong / Envoy Proxy',
    layer: 1,
    color: '#818cf8',
    iconName: 'Network',
    latencyMs: 6,
    errorRate: 0.05,
    throughputRps: 1500,
    connectedTo: ['service-core'],
    protocol: 'gRPC',
    edgeLabel: 'route',
  });

  if (p.includes('video') || p.includes('netflix') || p.includes('youtube')) {
    specs.push({
      id: 'service-core',
      type: 'service',
      title: 'Catalog & Stream Service',
      subtitle: 'Go Video Chunker',
      layer: 2,
      color: '#a855f7',
      iconName: 'Server',
      latencyMs: 35,
      errorRate: 0.2,
      throughputRps: 800,
      connectedTo: ['cache-redis', 'storage-s3'],
      protocol: 'HTTP/REST',
      edgeLabel: 'fetchSegment',
    });
    specs.push({
      id: 'storage-s3',
      type: 'storage',
      title: 'Video Asset CDN / S3',
      subtitle: 'HLS Chunks Storage',
      layer: 4,
      color: '#14b8a6',
      iconName: 'HardDrive',
      latencyMs: 40,
      errorRate: 0.1,
      throughputRps: 2000,
      connectedTo: [],
      protocol: 'TCP',
    });
  } else if (p.includes('ai') || p.includes('rag') || p.includes('llm')) {
    specs.push({
      id: 'service-core',
      type: 'service',
      title: 'AI Orchestrator',
      subtitle: 'FastAPI / LangChain',
      layer: 2,
      color: '#a855f7',
      iconName: 'Server',
      latencyMs: 50,
      errorRate: 0.4,
      throughputRps: 150,
      connectedTo: ['db-vector', 'ext-gemini'],
      protocol: 'HTTP/REST',
      edgeLabel: 'synthesize',
    });
    specs.push({
      id: 'db-vector',
      type: 'database',
      title: 'Vector Database',
      subtitle: 'Pinecone / Qdrant',
      layer: 4,
      color: '#3b82f6',
      iconName: 'Database',
      latencyMs: 45,
      errorRate: 0.1,
      throughputRps: 300,
      connectedTo: [],
      protocol: 'gRPC',
    });
    specs.push({
      id: 'ext-gemini',
      type: 'external',
      title: 'LLM Inference API',
      subtitle: 'Google Gemini 2.5 Flash',
      layer: 4,
      color: '#10b981',
      iconName: 'ExternalLink',
      latencyMs: 220,
      errorRate: 0.5,
      throughputRps: 80,
      connectedTo: [],
      protocol: 'HTTP/REST',
    });
  } else if (p.includes('fintech') || p.includes('payment') || p.includes('odeme') || p.includes('bank') || p.includes('stripe')) {
    specs.push({
      id: 'service-core',
      type: 'service',
      title: 'Payment Engine',
      subtitle: 'Idempotent Checkout Svc',
      layer: 2,
      color: '#10b981',
      iconName: 'Server',
      latencyMs: 25,
      errorRate: 0.1,
      throughputRps: 1200,
      circuitBreaker: 'closed',
      connectedTo: ['cache-redis', 'queue-dlq', 'ext-stripe'],
      protocol: 'gRPC',
      edgeLabel: 'authorize',
    });
    specs.push({
      id: 'queue-dlq',
      type: 'queue',
      title: 'Dead-Letter Queue (DLQ)',
      subtitle: 'Kafka Poison Message Bus',
      layer: 3,
      color: '#f43f5e',
      iconName: 'Shuffle',
      latencyMs: 8,
      errorRate: 0,
      throughputRps: 3000,
      connectedTo: [],
      protocol: 'Kafka',
      edgeLabel: 'divert',
    });
    specs.push({
      id: 'ext-stripe',
      type: 'external',
      title: 'Stripe Banking API',
      subtitle: 'Card Network Switch',
      layer: 4,
      color: '#6366f1',
      iconName: 'ExternalLink',
      latencyMs: 120,
      errorRate: 0.8,
      throughputRps: 500,
      circuitBreaker: 'closed',
      connectedTo: [],
      protocol: 'HTTP/REST',
    });
  } else if (p.includes('iot') || p.includes('sensor') || p.includes('telemetry') || p.includes('mqtt')) {
    specs.push({
      id: 'service-core',
      type: 'service',
      title: 'Stream Engine',
      subtitle: 'Apache Flink CEP',
      layer: 2,
      color: '#0ea5e9',
      iconName: 'Zap',
      latencyMs: 14,
      errorRate: 0.05,
      throughputRps: 5000,
      connectedTo: ['cache-redis', 'db-primary'],
      protocol: 'TCP',
      edgeLabel: 'telemetry',
    });
  } else {
    specs.push({
      id: 'service-core',
      type: 'service',
      title: 'Business Logic Service',
      subtitle: 'Core Microservice',
      layer: 2,
      color: '#a855f7',
      iconName: 'Server',
      latencyMs: 30,
      errorRate: 0.2,
      throughputRps: 600,
      connectedTo: ['cache-redis', 'db-primary'],
      protocol: 'gRPC',
      edgeLabel: 'process',
    });
  }

  if (!specs.some(s => s.id === 'cache-redis')) {
    specs.push({
      id: 'cache-redis',
      type: 'cache',
      title: 'Distributed Cache',
      subtitle: 'Redis Cluster',
      layer: 3,
      color: '#f43f5e',
      iconName: 'Cpu',
      latencyMs: 3,
      errorRate: 0,
      throughputRps: 5000,
      connectedTo: [],
      protocol: 'TCP',
    });
  }

  if (p.includes('queue') || p.includes('kafka') || p.includes('event') || p.includes('food') || p.includes('ride') || p.includes('ecommerce')) {
    specs.push({
      id: 'queue-events',
      type: 'queue',
      title: 'Event Streaming Queue',
      subtitle: 'Apache Kafka Topic',
      layer: 3,
      color: '#f59e0b',
      iconName: 'Shuffle',
      latencyMs: 8,
      errorRate: 0.05,
      throughputRps: 3500,
      connectedTo: ['worker-consumer'],
      protocol: 'Kafka',
      edgeLabel: 'produce',
    });

    specs.push({
      id: 'worker-consumer',
      type: 'service',
      title: 'Async Worker',
      subtitle: 'Background Consumer',
      layer: 4,
      color: '#ec4899',
      iconName: 'Zap',
      latencyMs: 65,
      errorRate: 0.3,
      throughputRps: 450,
      connectedTo: ['ext-thirdparty'],
      protocol: 'HTTP/REST',
      edgeLabel: 'notify',
    });

    specs.push({
      id: 'ext-thirdparty',
      type: 'external',
      title: 'Notification & Payments',
      subtitle: 'Stripe / Twilio API',
      layer: 4,
      color: '#10b981',
      iconName: 'ExternalLink',
      latencyMs: 150,
      errorRate: 1.0,
      throughputRps: 120,
      connectedTo: [],
      protocol: 'HTTP/REST',
    });

    const core = specs.find(s => s.id === 'service-core');
    if (core && !core.connectedTo.includes('queue-events')) {
      core.connectedTo.push('queue-events');
    }
  }

  if (!specs.some(s => s.id === 'db-primary') && !p.includes('rag')) {
    specs.push({
      id: 'db-primary',
      type: 'database',
      title: 'Primary Database',
      subtitle: 'PostgreSQL Multi-AZ',
      layer: 4,
      color: '#3b82f6',
      iconName: 'Database',
      latencyMs: 25,
      errorRate: 0.1,
      throughputRps: 750,
      connectedTo: [],
      protocol: 'SQL Query',
    });
  }

  return buildPositionedTopologyFromSpecs(
    title,
    `Auto-generated architecture matching: "${prompt}"`,
    specs
  );
}

const GEMINI_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-flash-latest',
];

/**
 * Online Gemini LLM generator when API key is provided.
 * Automatically tries modern Gemini Flash endpoints and maps multi-department ERP or cloud architectures.
 */
export async function generateArchitectureWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeneratedArchitecture> {
  const systemInstruction = `
You are an expert distributed systems & enterprise ERP/manufacturing workflow architect.
Generate a valid JSON object representing a complete topology based on the user's prompt.
IMPORTANT RULES:
1. If the user describes an ERP, warehouse (Inbound / Outbound), factory production (MES / MRP), or business departments (e.g. Ar-Ge / R&D, Kalite Kontrol / QA, Üretim / Production, Bakım / Maintenance, Satın Alma, Depo), create SEPARATE, DISTINCT nodes for EACH department, entry point, queue, database, and outbound step in the same language as the prompt! Never collapse multiple departments into a single node.
2. Layer assignment (0 to 4):
   - layer 0: Entry triggers / Clients / Suppliers / Hand terminals (type: "client")
   - layer 1: Gateways / Inbound Receiving / Mal Kabul (type: "gateway")
   - layer 2: Core Services / Departments (Ar-Ge, Kalite Kontrol, Üretim, Bakım, Microservices) (type: "service" or "serverless")
   - layer 3: Queues / Caches / Pick Lists / Real-time Visibility / Central Databases (type: "queue", "cache", or "database")
   - layer 4: Outbound Shipping / Storage / External ERP / Third-party APIs (type: "storage", "database", or "external")
Strict Schema:
{
  "title": string,
  "description": string,
  "nodes": Array<{
    "id": string,
    "type": "client" | "gateway" | "service" | "database" | "cache" | "queue" | "serverless" | "storage" | "external",
    "title": string,
    "subtitle": string,
    "layer": number,
    "latencyMs": number,
    "errorRate": number,
    "throughputRps": number,
    "circuitBreaker": "closed" | "open" | "half-open",
    "color": string,
    "iconName": "Globe" | "Smartphone" | "Network" | "Server" | "Zap" | "Cpu" | "Database" | "HardDrive" | "Shuffle" | "ExternalLink" | "ShieldCheck" | "Layers"
  }>,
  "edges": Array<{
    "fromNodeId": string,
    "toNodeId": string,
    "protocol": "HTTP/REST" | "gRPC" | "WebSocket" | "Kafka" | "TCP" | "SQL Query",
    "latencyMs": number,
    "label": string
  }>
}
Only output pure raw JSON without any markdown formatting.
`;

  let lastErrorText = '';

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: `${systemInstruction}\nUser Prompt: ${prompt}` }] },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => res.statusText);
        lastErrorText = `${modelName} (${res.status}): ${errBody.slice(0, 140)}`;
        if (res.status === 400 || res.status === 403) {
          break;
        }
        continue;
      }

      const json = await res.json();
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (!parsed || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
        lastErrorText = `${modelName}: Empty nodes array returned`;
        continue;
      }

      const layerXPositions = [80, 360, 640, 920, 1200];
      const layerCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

      const nodes: GraphNode[] = parsed.nodes.map((n: any, i: number) => {
        const layer = Math.min(4, Math.max(0, Number.isFinite(Number(n.layer)) ? Number(n.layer) : 2));
        const idx = layerCounts[layer] || 0;
        layerCounts[layer] = idx + 1;

        return {
          id: String(n.id || `node-${i + 1}`),
          type: n.type || 'service',
          title: String(n.title || `Component ${i + 1}`).slice(0, 32),
          subtitle: String(n.subtitle || '').slice(0, 38),
          x: layerXPositions[layer],
          y: 70 + idx * 135,
          width: 190,
          height: 90,
          status: 'healthy',
          circuitBreaker: n.circuitBreaker || 'closed',
          latencyMs: Number(n.latencyMs) || 22,
          errorRate: Number(n.errorRate) || 0.1,
          throughputRps: Number(n.throughputRps) || 600,
          color: n.color || '#818cf8',
          iconName: n.iconName || 'Server',
        };
      });

      const validNodeIds = new Set(nodes.map(n => n.id));
      const edges: GraphEdge[] = (Array.isArray(parsed.edges) ? parsed.edges : [])
        .filter((e: any) => e && validNodeIds.has(String(e.fromNodeId)) && validNodeIds.has(String(e.toNodeId)))
        .map((e: any, idx: number) => ({
          id: `ai-edge-${idx}`,
          fromNodeId: String(e.fromNodeId),
          toNodeId: String(e.toNodeId),
          protocol: e.protocol || 'HTTP/REST',
          latencyMs: Number(e.latencyMs) || 10,
          errorRate: 0,
          label: String(e.label || e.protocol || 'flow').slice(0, 24),
        }));

      return {
        title: parsed.title || 'AI Architecture',
        description: parsed.description || prompt,
        nodes,
        edges,
        usedOnlineGemini: true,
      };
    } catch (err) {
      lastErrorText = err instanceof Error ? err.message : String(err);
    }
  }

  console.warn('Falling back to offline neural architecture synthesizer:', lastErrorText);
  const offlineFallback = synthesizeArchitectureOffline(prompt);
  return {
    ...offlineFallback,
    usedOnlineGemini: false,
    warningMessage: lastErrorText
      ? `Gemini API yanıt vermedi (${lastErrorText.slice(0, 90)}). Dahili Çoklu-Departman & ERP Sentezleyici ile oluşturuldu.`
      : undefined,
  };
}
