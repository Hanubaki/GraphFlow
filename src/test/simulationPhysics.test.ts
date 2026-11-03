import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveLatency,
  calculateNodeUtilizationPercent,
  analyzeTopologyDiagnostics,
  compareTopologyWithBaseline,
  evaluateChaosResilienceAudit,
  autoHardenTopology,
  generateIncidentPostMortemMarkdown,
  applyDownstreamFailureCascade,
  summarizeClusterHealth,
  getCloudStackSummaryLabel,
  createHopPacket,
  IncidentEvent,
} from '../utils/simulationPhysics';
import {
  generateMermaidPrBundle,
  generateK6LoadTestScript,
} from '../utils/export';
import {
  parseInfrastructureToTopology,
  SAMPLE_PACKAGE_JSON_IMPORT,
} from '../utils/importTopology';
import { TEMPLATES } from '../constants/templates';

describe('simulationPhysics & Multi-Cloud FinOps / Post-Mortem Engine', () => {
  const sampleTemplate = TEMPLATES[0];

  it('scales effective latency quadratically when trafficLoadMultiplier increases', () => {
    const dbNode = sampleTemplate.nodes.find(n => n.type === 'database')!;
    const baseLat = calculateEffectiveLatency(dbNode, 1, false, 1);
    const highLoadLat = calculateEffectiveLatency(dbNode, 1, false, 5);
    expect(highLoadLat).toBeGreaterThan(baseLat);
  });

  it('computes node capacity utilization percentage accurately under load', () => {
    const dbNode = sampleTemplate.nodes.find(n => n.type === 'database')!;
    const normalUtil = calculateNodeUtilizationPercent(dbNode, 0, false, 1);
    const stressedUtil = calculateNodeUtilizationPercent(dbNode, 4, true, 5);
    expect(normalUtil).toBeGreaterThanOrEqual(0);
    expect(stressedUtil).toBeGreaterThan(normalUtil);
  });

  it('computes multi-cloud monthly cost estimates (AWS, GCP, Azure) in analyzeTopologyDiagnostics', () => {
    const diag = analyzeTopologyDiagnostics(sampleTemplate.nodes, sampleTemplate.edges);
    expect(diag.cloudCostsUsd.aws).toBeGreaterThan(0);
    expect(diag.cloudCostsUsd.gcp).toBeGreaterThan(0);
    expect(diag.cloudCostsUsd.azure).toBeGreaterThan(0);
    expect(diag.estimatedMonthlyCostUsd).toBe(diag.cloudCostsUsd.aws);
  });

  it('compares baseline topology with hardened topology and generates an Executive ROI Proposal', () => {
    const baseDiag = analyzeTopologyDiagnostics(sampleTemplate.nodes, sampleTemplate.edges);
    const hardenedNodes = autoHardenTopology(sampleTemplate.nodes, sampleTemplate.edges);
    const hardenedDiag = analyzeTopologyDiagnostics(hardenedNodes, sampleTemplate.edges);
    const diff = compareTopologyWithBaseline(baseDiag, hardenedDiag);

    expect(diff.slaDeltaPct).toBeGreaterThanOrEqual(0);
    expect(diff.proposalMarkdown).toContain('# Executive Architecture Diff & ROI Proposal');
    expect(diff.proposalMarkdown).toContain('Tail Latency (p99)');
    expect(diff.proposalMarkdown).toContain('Composite SLA');
  });

  it('evaluates automated Chaos & Load Resilience Audit scorecard and improves grade after auto-hardening', () => {
    const rawAudit = evaluateChaosResilienceAudit(sampleTemplate.nodes, sampleTemplate.edges);
    const hardenedNodes = autoHardenTopology(sampleTemplate.nodes, sampleTemplate.edges);
    const hardenedAudit = evaluateChaosResilienceAudit(hardenedNodes, sampleTemplate.edges);

    expect(rawAudit.score).toBeGreaterThanOrEqual(0);
    expect(hardenedAudit.score).toBeGreaterThanOrEqual(rawAudit.score);
    expect(hardenedAudit.breakerCoveragePct).toBeGreaterThanOrEqual(rawAudit.breakerCoveragePct);
    expect(['A+', 'A', 'B', 'C', 'D', 'F']).toContain(hardenedAudit.grade);
  });

  it('generates a GitHub PR Mermaid bundle and Grafana k6 load test script', () => {
    const mermaid = generateMermaidPrBundle(sampleTemplate.nodes, sampleTemplate.edges, 'Payment Engine');
    expect(mermaid).toContain('flowchart LR');
    expect(mermaid).toContain('sequenceDiagram');
    expect(mermaid).toContain('Multi-Cloud FinOps');

    const k6Script = generateK6LoadTestScript(sampleTemplate.nodes, sampleTemplate.edges, 'Payment Engine');
    expect(k6Script).toContain("import http from 'k6/http'");
    expect(k6Script).toContain('http_req_duration');
    expect(k6Script).toContain('stages:');
  });

  it('reverse-engineers package.json and OpenAPI 3.0 specs into interactive topologies', () => {
    const pkgResult = parseInfrastructureToTopology(SAMPLE_PACKAGE_JSON_IMPORT);
    expect(pkgResult.format).toBe('package-json');
    expect(pkgResult.nodes.length).toBeGreaterThanOrEqual(4);
    expect(pkgResult.edges.length).toBeGreaterThanOrEqual(3);

    const openApiSample = `
openapi: 3.0.3
info:
  title: Checkout Ledger API
  version: 1.0.0
paths:
  /v1/auth/token:
    post:
      summary: Issue JWT
  /v1/payments/charge:
    post:
      summary: Charge card via Stripe
  /v1/orders/search:
    get:
      summary: Search orders
`;
    const oaResult = parseInfrastructureToTopology(openApiSample);
    expect(oaResult.format).toBe('openapi');
    expect(oaResult.nodes.length).toBeGreaterThanOrEqual(4);
  });

  it('generates a complete SRE Incident Post-Mortem Markdown report', () => {
    const incidents: IncidentEvent[] = [
      {
        id: 'inc-1',
        timestamp: Date.now(),
        timeLabel: '10:25:00',
        severity: 'critical',
        nodeId: 'node-db-orders',
        nodeTitle: 'Orders Database',
        type: 'CIRCUIT_OPEN',
        message: 'Circuit Breaker tripped OPEN after 5 consecutive failures.',
      },
    ];
    const md = generateIncidentPostMortemMarkdown(
      sampleTemplate.nodes,
      sampleTemplate.edges,
      incidents,
      { totalSent: 500, delivered: 450, errors: 50, currentRps: 1200, avgLatencyMs: 68 },
      4
    );
    expect(md).toContain('# SRE Chaos & Incident Post-Mortem Report');
    expect(md).toContain('Orders Database');
    expect(md).toContain('Traffic Load Scale:** 4x');
    expect(md).toContain('Multi-Cloud FinOps Estimate');
  });

  it('propagates cascading degradation to callers without circuit breakers when downstream DB goes DOWN and heals on recovery', () => {
    const nodes = [
      { ...sampleTemplate.nodes[0], id: 'billing-api', type: 'service' as const, title: 'Billing API', status: 'healthy' as const, errorRate: 0.5, circuitBreaker: undefined },
      { ...sampleTemplate.nodes[6], id: 'postgres-db', type: 'database' as const, title: 'Postgres', status: 'healthy' as const, errorRate: 0.1, circuitBreaker: undefined },
    ];
    const edges = [
      { id: 'e-billing-pg', fromNodeId: 'billing-api', toNodeId: 'postgres-db', protocol: 'SQL Query' as const, latencyMs: 12, errorRate: 0 },
    ];

    const afterKill = applyDownstreamFailureCascade(nodes, edges, 'postgres-db', { status: 'down' });
    const callerAfterKill = afterKill.find(n => n.id === 'billing-api')!;
    const dbAfterKill = afterKill.find(n => n.id === 'postgres-db')!;

    expect(dbAfterKill.status).toBe('down');
    expect(callerAfterKill.status).toBe('degraded');
    expect(callerAfterKill.errorRate).toBeGreaterThanOrEqual(35);

    // Emits error packet when calling DOWN database
    const hopPkt = createHopPacket(edges[0], callerAfterKill, dbAfterKill);
    expect(hopPkt).not.toBeNull();
    expect(hopPkt?.status).toBe('error');

    // Healing Postgres restores caller to healthy
    const afterHeal = applyDownstreamFailureCascade(afterKill, edges, 'postgres-db', { status: 'healthy' });
    const callerAfterHeal = afterHeal.find(n => n.id === 'billing-api')!;
    expect(callerAfterHeal.status).toBe('healthy');
  });

  it('reports saturated nodes honestly in summarizeClusterHealth and builds FinOps stack labels from actual node types', () => {
    const defaultHealth = summarizeClusterHealth(sampleTemplate.nodes, false, 1);
    expect(defaultHealth.saturatedCount).toBe(2);
    expect(defaultHealth.optimalCount).toBe(8);
    expect(defaultHealth.label).toBe('8/10 Optimal · 2 Saturated');

    const hardenedNodes = autoHardenTopology(sampleTemplate.nodes, sampleTemplate.edges);
    const hardenedHealth = summarizeClusterHealth(hardenedNodes, false, 1);
    expect(hardenedHealth.saturatedCount).toBe(0);
    expect(hardenedHealth.label).toBe('10/10 Optimal');

    // Stack with only service + database should NOT mention ElastiCache or MSK
    const minimalStack = sampleTemplate.nodes.filter(n => n.type === 'service' || n.type === 'database');
    const awsMinimalLabel = getCloudStackSummaryLabel(minimalStack, 'aws');
    expect(awsMinimalLabel).toBe('ECS Fargate · RDS Multi-AZ');
    expect(awsMinimalLabel).not.toContain('MSK');
    expect(awsMinimalLabel).not.toContain('ElastiCache');
  });
});
