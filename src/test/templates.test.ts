import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../constants/templates';

describe('Architecture Templates Verification Suite', () => {
  it('contains at least 4 production architecture presets', () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it('validates every template has unique ID, name, difficulty, and valid tags', () => {
    const ids = new Set<string>();

    for (const template of TEMPLATES) {
      expect(template.id).toBeTruthy();
      expect(ids.has(template.id)).toBe(false);
      ids.add(template.id);

      expect(template.name.length).toBeGreaterThan(5);
      expect(template.description.length).toBeGreaterThan(10);
      expect(['Beginner', 'Intermediate', 'Advanced', 'Expert']).toContain(template.difficulty);
      expect(template.tags.length).toBeGreaterThan(0);
      expect(template.nodes.length).toBeGreaterThanOrEqual(5);
      expect(template.edges.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('ensures every edge connects valid source and target nodes with valid metrics', () => {
    for (const template of TEMPLATES) {
      const nodeIds = new Set(template.nodes.map(n => n.id));

      for (const edge of template.edges) {
        expect(nodeIds.has(edge.fromNodeId)).toBe(true);
        expect(nodeIds.has(edge.toNodeId)).toBe(true);
        expect(edge.latencyMs).toBeGreaterThanOrEqual(0);
        expect(edge.errorRate).toBeGreaterThanOrEqual(0);
        expect(edge.errorRate).toBeLessThanOrEqual(1.0);
        expect(edge.protocol).toBeTruthy();
      }
    }
  });

  it('verifies Transactional Outbox & CQRS template integrity', () => {
    const outboxTmpl = TEMPLATES.find(t => t.id === 'resilient-cqrs-outbox');
    expect(outboxTmpl).toBeDefined();

    const titles = outboxTmpl!.nodes.map(n => n.title);
    expect(titles).toContain('Primary DB + Outbox');
    expect(titles).toContain('Kafka Event Broker');
    expect(titles).toContain('Dead-Letter Queue (DLQ)');
  });
});
