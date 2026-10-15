import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveLatency,
  analyzeTopologyDiagnostics,
  generateIncidentPostMortemMarkdown,
  IncidentEvent,
} from '../utils/simulationPhysics';
import { TEMPLATES } from '../constants/templates';

describe('simulationPhysics & Multi-Cloud FinOps / Post-Mortem Engine', () => {
  const sampleTemplate = TEMPLATES[0];

  it('scales effective latency quadratically when trafficLoadMultiplier increases', () => {
    const dbNode = sampleTemplate.nodes.find(n => n.type === 'database')!;
    const baseLat = calculateEffectiveLatency(dbNode, 1, false, 1);
    const highLoadLat = calculateEffectiveLatency(dbNode, 1, false, 5);
    expect(highLoadLat).toBeGreaterThan(baseLat);
  });

  it('computes multi-cloud monthly cost estimates (AWS, GCP, Azure) in analyzeTopologyDiagnostics', () => {
    const diag = analyzeTopologyDiagnostics(sampleTemplate.nodes, sampleTemplate.edges);
    expect(diag.cloudCostsUsd.aws).toBeGreaterThan(0);
    expect(diag.cloudCostsUsd.gcp).toBeGreaterThan(0);
    expect(diag.cloudCostsUsd.azure).toBeGreaterThan(0);
    expect(diag.estimatedMonthlyCostUsd).toBe(diag.cloudCostsUsd.aws);
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
});
