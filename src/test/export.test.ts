import { describe, it, expect } from 'vitest';
import { generateMarkdownDoc, generateArchitectureSvg, generateTerraform } from '../utils/export';
import {
  parseInfrastructureToTopology,
  SAMPLE_DOCKER_COMPOSE_IMPORT,
  SAMPLE_ERP_CSV_IMPORT,
} from '../utils/importTopology';
import { synthesizeArchitectureOffline } from '../services/aiGenerator';
import { generateShareUrl, parseShareUrl, generateEmbedUrl, generateIframeSnippet } from '../services/projectStorage';
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
});
