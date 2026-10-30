import { describe, it, expect } from 'vitest';
import { generateMarkdownDoc, generateArchitectureSvg, generateTerraform } from '../utils/export';
import {
  parseInfrastructureToTopology,
  SAMPLE_DOCKER_COMPOSE_IMPORT,
  SAMPLE_DRAWIO_IMPORT,
  SAMPLE_ERP_CSV_IMPORT,
} from '../utils/importTopology';
import { synthesizeArchitectureOffline } from '../services/aiGenerator';
import { generateShareUrl, parseShareUrl, generateEmbedUrl, generateIframeSnippet } from '../services/projectStorage';
import {
  parseLiveTelemetryPayload,
  generateSimulatedLiveTick,
  SAMPLE_LOGO_ERP_BRIDGE_SCRIPT,
} from '../services/liveTelemetry';
import { checkFeatureEntitlement } from '../services/billing';
import { GraphNode, GraphEdge } from '../types/graph';

describe('Export & Documentation Generator', () => {
  const nodes: GraphNode[] = [
    {
      id: 'n1',
      type: 'client',
      title: 'Frontend Client',
      subtitle: 'React App',
      x: 0,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 15,
      errorRate: 0,
      throughputRps: 100,
      color: '#38bdf8',
      iconName: 'Globe',
    },
    {
      id: 'n2',
      type: 'gateway',
      title: 'API Gateway',
      subtitle: 'Envoy',
      x: 300,
      y: 0,
      width: 190,
      height: 90,
      status: 'healthy',
      latencyMs: 5,
      errorRate: 0.1,
      throughputRps: 1000,
      color: '#818cf8',
      iconName: 'Network',
    }
  ];

  const edges: GraphEdge[] = [
    {
      id: 'e1',
      fromNodeId: 'n1',
      toNodeId: 'n2',
      protocol: 'HTTP/REST',
      latencyMs: 10,
      errorRate: 0,
      label: '/api/v1',
    }
  ];

  it('generates valid Markdown with component count and table', () => {
    const md = generateMarkdownDoc(nodes, edges, 'E-Commerce');
    expect(md).toContain('# E-Commerce Architecture');
    expect(md).toContain('**2 components**');
    expect(md).toContain('**1 communication pipelines**');
    expect(md).toContain('| **Frontend Client** (React App) |');
    expect(md).toContain('| **API Gateway** (Envoy) |');
  });

  it('generates embedded Mermaid diagram with clean syntax', () => {
    const md = generateMarkdownDoc(nodes, edges);
    expect(md).toContain('```mermaid\ngraph LR');
    expect(md).toContain('n1["Frontend Client (React App)"]');
    expect(md).toContain('n1 -->|"/api/v1"| n2');
  });

  it('correctly serializes and parses shareable URL hashes', () => {
    const shareUrl = generateShareUrl(nodes, edges);
    expect(shareUrl).toContain('#share=');

    window.location.hash = shareUrl.split('#')[1];
    const parsed = parseShareUrl();
    expect(parsed).not.toBeNull();
    expect(parsed?.nodes.length).toBe(2);
    expect(parsed?.edges.length).toBe(1);
    expect(parsed?.nodes[0].title).toBe('Frontend Client');
    expect(parsed?.edges[0].fromNodeId).toBe('n1');
    expect(parsed?.edges[0].toNodeId).toBe('n2');
  });

  it('returns null gracefully on corrupted URL hashes without crashing', () => {
    window.location.hash = 'share=invalid-non-base64-random-string!!!';
    expect(parseShareUrl()).toBeNull();

    window.location.hash = '';
    expect(parseShareUrl()).toBeNull();
  });

  it('generates valid iframe embed URL and HTML iframe snippet', () => {
    const embedUrl = generateEmbedUrl(nodes, edges);
    expect(embedUrl).toContain('#embed=');
    expect(embedUrl).not.toContain('#share=');

    const iframe = generateIframeSnippet(embedUrl, 500);
    expect(iframe).toContain('<iframe');
    expect(iframe).toContain('src="');
    expect(iframe).toContain('height="500"');
    expect(iframe).toContain('allow="autoplay"');

    window.location.hash = embedUrl.split('#')[1];
    const parsed = parseShareUrl();
    expect(parsed).not.toBeNull();
    expect(parsed?.isEmbed).toBe(true);
    expect(parsed?.nodes.length).toBe(2);
  });

  it('includes automated Critical Path, Bottleneck, and Composite SLA diagnostics in Markdown spec', () => {
    const md = generateMarkdownDoc(nodes, edges, 'Production Cluster');
    expect(md).toContain('## 3. Capacity, Critical Path & SLA Diagnostics');
    expect(md).toContain('Critical Path Latency (Worst-Case Hop Chain):** `30ms`');
    expect(md).toContain('Frontend Client -> API Gateway');
    expect(md).toContain('Primary Throughput Bottleneck:** **API Gateway**');
  });

  it('generates standalone SVG architecture diagram with Free watermark and clean Pro white-label option', () => {
    const freeSvg = generateArchitectureSvg(nodes, edges, { includeWatermark: true });
    expect(freeSvg).toContain('<svg');
    expect(freeSvg).toContain('Frontend Client');
    expect(freeSvg).toContain('Simulated with GraphFlow.dev');

    const proSvg = generateArchitectureSvg(nodes, edges, { includeWatermark: false });
    expect(proSvg).not.toContain('Simulated with GraphFlow.dev');
  });

  it('reverse-engineers docker-compose.yml and Terraform main.tf into live GraphFlow topologies', () => {
    const dcResult = parseInfrastructureToTopology(SAMPLE_DOCKER_COMPOSE_IMPORT, 'docker-compose.yml');
    expect(dcResult.format).toBe('docker-compose');
    expect(dcResult.nodes.length).toBeGreaterThanOrEqual(7);
    expect(dcResult.edges.length).toBeGreaterThanOrEqual(6);

    const tfHcl = generateTerraform(dcResult.nodes, dcResult.edges, 'checkout');
    const tfResult = parseInfrastructureToTopology(tfHcl, 'main.tf');
    expect(tfResult.format).toBe('terraform');
    expect(tfResult.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('imports ERP / Excel CSV tables and multi-department ERP prompts into separate department nodes', () => {
    const erpCsvResult = parseInfrastructureToTopology(SAMPLE_ERP_CSV_IMPORT, 'erp-uretim.csv');
    expect(erpCsvResult.format).toBe('erp-csv');
    expect(erpCsvResult.nodes.length).toBeGreaterThanOrEqual(8);
    expect(erpCsvResult.edges.length).toBeGreaterThanOrEqual(10);

    const csvTitles = erpCsvResult.nodes.map(n => n.title);
    expect(csvTitles).toContain('Depo Giriş (Inbound)');
    expect(csvTitles).toContain('Ar-Ge Departmanı (R&D)');
    expect(csvTitles).toContain('Kalite Kontrol (IQC / QA)');
    expect(csvTitles).toContain('Üretim Departmanı (MES)');
    expect(csvTitles).toContain('Bakım Departmanı (MRO)');
    expect(csvTitles).toContain('Depo Çıkış (Outbound)');

    const erpPrompt = `ERP sistemlerinde Depo Giriş (Inbound), Ar-Ge, Kalite Kontrol, Üretim, Bakım ve Depo Çıkış (Outbound) süreçleri`;
    const synthesized = synthesizeArchitectureOffline(erpPrompt);
    const synthTitles = synthesized.nodes.map(n => n.title);
    expect(synthTitles).not.toContain('Business Logic Service');
    expect(synthTitles).toContain('Depo Giriş (Inbound)');
    expect(synthTitles).toContain('Ar-Ge Departmanı (R&D)');
    expect(synthTitles).toContain('Kalite Kontrol (IQC / QA)');
    expect(synthTitles).toContain('Üretim Departmanı (MES)');
    expect(synthTitles).toContain('Bakım Departmanı (MRO)');
    expect(synthTitles).toContain('Depo Çıkış (Outbound)');
  });

  it('parses real-time live telemetry JSON, CSV, and Prometheus payloads and enforces Pro entitlement for live URL streaming', () => {
    const erpNodes = synthesizeArchitectureOffline(
      'ERP Depo Giriş, Ar-Ge, Kalite Kontrol, Üretim, Bakım ve Depo Çıkış'
    ).nodes;

    // 1. JSON array live payload matching Turkish department names
    const jsonPayload = JSON.stringify([
      { department: 'Depo Giriş (Inbound)', throughputRps: 495, latencyMs: 19, errorRate: 0.2, status: 'healthy' },
      { department: 'Kalite Kontrol (IQC / QA)', throughputRps: 310, latencyMs: 145, errorRate: 2.4, status: 'warning' },
      { department: 'Üretim Departmanı (MES)', throughputRps: 640, latencyMs: 88, errorRate: 0.4, status: 'healthy' },
    ]);
    const parsedJson = parseLiveTelemetryPayload(jsonPayload, erpNodes);
    expect(parsedJson.sourceFormat).toBe('json');
    expect(parsedJson.updates.length).toBe(3);
    const qcUpdate = parsedJson.updates.find(u => u.matchedTitle.includes('Kalite Kontrol'));
    expect(qcUpdate?.throughputRps).toBe(310);
    expect(qcUpdate?.status).toBe('degraded');

    // 2. CSV live snapshot matching department names
    const csvPayload = [
      'Departman;Islem_Hizi_RPS;Gecikme_MS;Hata_Orani;Durum',
      'Ar-Ge Departmanı (R&D);155;42;0.1;healthy',
      'Bakım Departmanı (MRO);85;210;6.5;down',
    ].join('\n');
    const parsedCsv = parseLiveTelemetryPayload(csvPayload, erpNodes);
    expect(parsedCsv.sourceFormat).toBe('csv');
    expect(parsedCsv.updates.length).toBe(2);
    const mroUpdate = parsedCsv.updates.find(u => u.matchedTitle.includes('Bakım'));
    expect(mroUpdate?.status).toBe('down');

    // 3. Simulated Live Tick generator
    const demoTick = generateSimulatedLiveTick(erpNodes, 1);
    expect(demoTick.parsed.updates.length).toBe(erpNodes.length);
    expect(demoTick.parsed.updates[0].throughputRps).toBeGreaterThan(0);

    // 4. Logo ERP / SQL Bridge script contains port 4040 and /metrics endpoint
    expect(SAMPLE_LOGO_ERP_BRIDGE_SCRIPT).toContain('4040');
    expect(SAMPLE_LOGO_ERP_BRIDGE_SCRIPT).toContain('/metrics');

    // 5. Pro Plan feature entitlement check for live_telemetry_stream
    const freeEntitlement = checkFeatureEntitlement('live_telemetry_stream', 'free');
    expect(freeEntitlement.allowed).toBe(false);
    expect(freeEntitlement.reason).toContain('Pro');

    const proEntitlement = checkFeatureEntitlement('live_telemetry_stream', 'pro');
    expect(proEntitlement.allowed).toBe(true);
  });

  it('reverse-engineers draw.io (.drawio), Excalidraw (.excalidraw), and Mermaid.js flowcharts into live topologies', () => {
    // 1. draw.io XML import
    const drawioResult = parseInfrastructureToTopology(SAMPLE_DRAWIO_IMPORT, 'architecture.drawio');
    expect(drawioResult.format).toBe('drawio');
    expect(drawioResult.nodes.length).toBe(6);
    expect(drawioResult.edges.length).toBe(5);
    expect(drawioResult.nodes.map(n => n.title)).toContain('PostgreSQL Ledger DB');

    // 1b. Compressed draw.io Desktop / Electron (Base64 + raw DEFLATE <diagram>) import
    const compressedDrawio = `<mxfile host="Electron"><diagram id="W8V2PKvsyrTW8OwQvnD8" name="Page-1">7Vptc9soEP41nrn7EI/ebX9M7KZN73JNm3Tu+hFL2OIiCRVQbN+vv0Ug6zWt41pxJk4ymcACC+yzyy4rBvY0Xr9nKA2vaYCjgWUE64E9G1iWaRsm/JOUjaJMRp4iLBkJdKeScEv+w5poaGpGAsxrHQWlkSBpnejTJMG+qNEQY3RV77agUX3WFC1xi3Dro6hN/ZsEItRU05uUDR8wWYZ66rE1Ug0xKjrrnfAQBXRVIdnvBvaUUSpUKV5PcSSFV8hFjbt8pHW7MIYTscuAxaV1ma7v/qVf3fCjm878K5OcaS4PKMr0hvVixaaQAKNZEmDJxBjYF6uQCHybIl+2rgBzoIUijqBmQjFAPMz7ykp7hcV0mAm8rpD0it9jGmPBNtBFt3paeFp77EItVhUsjLEmhhUczGIk0gqw3PIuZQQFLaYniMx6isjMn4tsQaJoSiPK8rH2wpW/QOeC0XtcafHyHzmCJqJCVz+HkbdpeHWBO22Bb0GpydvoS952h7y9SGg51ATvfc9o0XDG87PkHDqY43RdNkJpKf9/zlBEFnLvXzAXKGNIclOcYaGKueraAhikKeoo1tFKaIIb0GoSzLlMoOoDRhjoFxIbAufNuW6ISRDIaTrVpm6Lh8B7bNbx9joMzOzA2+0L7tFrNi/HdV6aeY17Mq8v+HsGdgXtMywQifjJ2ZZrTV6YbZmv2neNjRdnXGZfzusa3WNonCKBIroE3qdmXOPRSzMux+ntJC3DE+NTMqeIBSRZnhzkptOIVYw25JNJG3GrL8TdrtvT0xB37C7ECy7Z1tyJzyjH7IH4cBmWN9vc+mmcUg6SL8oJCFc2A4iWcZvNEyyqbjdr8j8d1THr90jPbquOa3e5Brs35enLNVz9dXLwuo0sgTtqodvl9/s7GPpyBSeIrWM2wW2b7vOC676BeyhwRy3L9YbukeHtSkAcAt5PX+9ODl+7mb91JkfHt6+ExyniOzIbV+6je97JG7qHi5oNrwFvxyW7L3g/TtYY8w/WnzfJfZReoNG3Pz7v8rkKJ8G5/O4nxRghzolfx0INwEHrs19LUAKxJRY/UDarW3rVO8UPEhAMR0iQh/oyuiSmZ7ihJFfgLTh1aCYNmXOaMR/rQaXYW3zcySPxVcFIiaHFKMdvu+v9Id0hJXkoSI8HVdOOxpOhY+6Hl2k2fWoHs54x67q6vjLMbM87GGSOZx0bsa4L6StDrBWL/AJi4+bp+vyIPX7LDM1tWhBzLt+vWMYnRmTMEEDxOo8RVipF+Ns1vf69EriUYwti2iTwFCX7x0l3oZxWv8ahTGYj51isME5ycpmw9KsJSyJbEfwFBGIlMs/UVviGCxwPinznXH1PjOUjoyjvkPE8EW7ALqXDplIfGX0gQd5dx0MwV4hgPREfwipRLGOlZM7TeiJUbbuVH033DvMCvECZijzbkR7M5sul2zO3rN1RWNPszHrsnQ2F0G0R5RYaAsgg0u6grxXh7WSlxWFlNVS/HfI5o74e3HRagvfrZxdeE/GPlpEsf5Ploatrs3WlabbRlY6nTLtEjeqI+ZlhH+uQdBsJF6cZqu/s044bNe7wSmRXnTD31QlAnm1yDkPDsAuCYuM4Rb1klNc21doNZgQkIa96FfM9nJbtcIc5qst27LoWmftqYzON2DyLetbGx1NKpb+92HqjacU5Pp9jvlo0ne6KiHDreOPKF0YJbJYo8cF8GPQP5T4bfKsPIUf+CVKEWCpKjDa5H8aFF55Kz5sJ1SN328p5U1mVtRS4ID/MmZxJl48Eyr2aZURkzhBEMrJpkX/ExGvw1xHWXYncw+XFjSxytcpEBQAk4crpy73IoCCqrHf45ubbD2vHdZNxOx7LPLOf70rdPfFM38tnH+v0mzROP7f5rXnX02/UdMbNXNDexx9Uywfqqnv5zN9+9z8=</diagram></mxfile>`;
    const compressedResult = parseInfrastructureToTopology(compressedDrawio, 'Composite Microservice.drawio');
    expect(compressedResult.format).toBe('drawio');
    expect(compressedResult.nodes.map(n => n.title)).toContain('Qualify Restaurant');
    expect(compressedResult.nodes.map(n => n.title)).toContain('Request Details');
    expect(compressedResult.nodes.map(n => n.title)).toContain('Make Catalogue');

    // 2. Excalidraw JSON import
    const excalidrawJson = JSON.stringify({
      type: 'excalidraw',
      version: 2,
      elements: [
        { id: 'rect1', type: 'rectangle', x: 100, y: 100, width: 160, height: 80 },
        { id: 'txt1', type: 'text', containerId: 'rect1', text: 'Next.js Web Client' },
        { id: 'rect2', type: 'rectangle', x: 350, y: 100, width: 160, height: 80 },
        { id: 'txt2', type: 'text', containerId: 'rect2', text: 'Kong API Gateway' },
        { id: 'rect3', type: 'rectangle', x: 600, y: 100, width: 160, height: 80 },
        { id: 'txt3', type: 'text', containerId: 'rect3', text: 'PostgreSQL Primary' },
        {
          id: 'arr1',
          type: 'arrow',
          startBinding: { elementId: 'rect1' },
          endBinding: { elementId: 'rect2' },
        },
        {
          id: 'arr2',
          type: 'arrow',
          startBinding: { elementId: 'rect2' },
          endBinding: { elementId: 'rect3' },
        },
      ],
    });
    const excalResult = parseInfrastructureToTopology(excalidrawJson, 'system.excalidraw');
    expect(excalResult.format).toBe('excalidraw');
    expect(excalResult.nodes.length).toBe(3);
    expect(excalResult.edges.length).toBe(2);

    // 3. Mermaid.js flowchart import
    const mermaidText = `flowchart LR
      A[Web Storefront] -->|HTTPS| B[Envoy Gateway]
      B -->|gRPC| C[Checkout Service]
      C -->|SETNX| D[(Redis Cluster)]
      C -->|SQL| E[(Postgres DB)]`;
    const mmdResult = parseInfrastructureToTopology(mermaidText, 'architecture.mmd');
    expect(mmdResult.format).toBe('mermaid');
    expect(mmdResult.nodes.length).toBe(5);
    expect(mmdResult.edges.length).toBe(4);
  });
});
