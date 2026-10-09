import { GraphNode, GraphEdge, NodeType, ProtocolType } from '../types/graph';

export interface GeneratedArchitecture {
  title: string;
  description: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
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
  connectedTo: string[]; // target node ids
  protocol: ProtocolType;
  edgeLabel?: string;
}

/**
 * Intelligent client-side rule-based NLP synthesizer.
 * Analyzes natural language prompts and generates realistic distributed topologies.
 */
export function synthesizeArchitectureOffline(prompt: string): GeneratedArchitecture {
  const p = prompt.toLowerCase();
  const specs: ComponentSpec[] = [];

  // Determine Title
  let title = 'Custom Architecture';
  if (p.includes('food') || p.includes('yemek') || p.includes('restaurant')) {
    title = 'On-Demand Food Delivery Platform';
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

  // 1. Clients
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

  // 2. Ingress & Routing
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

  // 3. Core Services
  if (p.includes('video') || p.includes('stream')) {
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
      subtitle: 'Google Gemini 1.5 Pro',
      layer: 4,
      color: '#10b981',
      iconName: 'ExternalLink',
      latencyMs: 220,
      errorRate: 0.5,
      throughputRps: 80,
      connectedTo: [],
      protocol: 'HTTP/REST',
    });
  } else {
    // Standard Microservice
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

  // 4. Cache (Redis)
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

  // 5. Async Queue (Kafka / RabbitMQ)
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

    // Connect core service to Kafka
    const core = specs.find(s => s.id === 'service-core');
    if (core && !core.connectedTo.includes('queue-events')) {
      core.connectedTo.push('queue-events');
    }
  }

  // 6. Primary Database (PostgreSQL)
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

  // Convert Specs to Positioned Nodes and Edges
  const layerXPositions = [80, 360, 640, 920, 1200];
  const layerItems: Record<number, ComponentSpec[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

  specs.forEach(s => {
    layerItems[s.layer].push(s);
  });

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const NODE_WIDTH = 190;
  const NODE_HEIGHT = 90;
  const VERTICAL_SPACING = 140;

  // Position nodes layer by layer
  Object.keys(layerItems).forEach(lStr => {
    const layer = Number(lStr);
    const items = layerItems[layer];
    const totalHeight = items.length * VERTICAL_SPACING;
    const startY = Math.max(60, 260 - totalHeight / 2);

    items.forEach((item, index) => {
      const nodeX = layerXPositions[layer];
      const nodeY = startY + index * VERTICAL_SPACING;

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
        latencyMs: item.latencyMs,
        errorRate: item.errorRate,
        throughputRps: item.throughputRps,
        color: item.color,
        iconName: item.iconName,
      });

      // Create edges for connections
      item.connectedTo.forEach((targetId, eIdx) => {
        edges.push({
          id: `edge-${item.id}-${targetId}-${eIdx}`,
          fromNodeId: item.id,
          toNodeId: targetId,
          protocol: item.protocol,
          latencyMs: item.latencyMs > 20 ? 15 : 5,
          errorRate: 0,
          label: item.edgeLabel || item.protocol,
        });
      });
    });
  });

  return {
    title,
    description: `Auto-generated architecture matching: "${prompt}"`,
    nodes,
    edges,
  };
}

/**
 * Optional Gemini LLM generator when API key is provided
 */
export async function generateArchitectureWithGemini(
  prompt: string,
  apiKey: string
): Promise<GeneratedArchitecture> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemInstruction = `
You are an expert distributed systems architect. 
Generate a valid JSON object representing a system architecture based on the user's prompt.
Strict Schema:
{
  "title": string,
  "description": string,
  "nodes": Array<{
    "id": string,
    "type": "client" | "gateway" | "service" | "database" | "cache" | "queue" | "serverless" | "storage" | "external",
    "title": string,
    "subtitle": string,
    "layer": number (0 to 4),
    "latencyMs": number,
    "errorRate": number,
    "throughputRps": number,
    "color": string (hex e.g. #38bdf8),
    "iconName": string
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

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemInstruction}\nUser Prompt: ${prompt}` }] }
        ]
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini API error: ${res.statusText}`);
    }

    const json = await res.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Map layer coordinates
    const layerXPositions = [80, 360, 640, 920, 1200];
    const layerCounts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };

    const nodes: GraphNode[] = parsed.nodes.map((n: any) => {
      const layer = Math.min(4, Math.max(0, n.layer || 2));
      const idx = layerCounts[layer] || 0;
      layerCounts[layer] = idx + 1;

      return {
        id: n.id,
        type: n.type,
        title: n.title,
        subtitle: n.subtitle,
        x: layerXPositions[layer],
        y: 80 + idx * 140,
        width: 190,
        height: 90,
        status: 'healthy',
        latencyMs: n.latencyMs || 25,
        errorRate: n.errorRate || 0,
        throughputRps: n.throughputRps || 500,
        color: n.color || '#818cf8',
        iconName: n.iconName || 'Server',
      };
    });

    const edges: GraphEdge[] = parsed.edges.map((e: any, idx: number) => ({
      id: `ai-edge-${idx}`,
      fromNodeId: e.fromNodeId,
      toNodeId: e.toNodeId,
      protocol: e.protocol || 'HTTP/REST',
      latencyMs: e.latencyMs || 10,
      errorRate: 0,
      label: e.label || e.protocol,
    }));

    return {
      title: parsed.title || 'AI Architecture',
      description: parsed.description || prompt,
      nodes,
      edges,
    };
  } catch (err) {
    console.warn('Falling back to offline neural architecture synthesizer:', err);
    return synthesizeArchitectureOffline(prompt);
  }
}
