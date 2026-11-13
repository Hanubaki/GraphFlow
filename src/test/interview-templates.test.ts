import { describe, it, expect } from 'vitest';
import { INTERVIEW_TEMPLATES } from '../constants/interviewTemplates';
import { TEMPLATES } from '../constants/templates';
import { summarizeClusterHealth } from '../utils/simulationPhysics';

describe('interview templates', () => {
  it('are reachable by ?template= id', () => {
    for (const t of INTERVIEW_TEMPLATES) expect(TEMPLATES.find(x => x.id === t.id)).toBe(t);
  });

  it.each(INTERVIEW_TEMPLATES)('$id: edges point at real nodes', t => {
    const ids = new Set(t.nodes.map(n => n.id));
    expect(ids.size).toBe(t.nodes.length);
    for (const e of t.edges) {
      expect(ids.has(e.fromNodeId)).toBe(true);
      expect(ids.has(e.toNodeId)).toBe(true);
    }
  });

  it.each(INTERVIEW_TEMPLATES)('$id: healthy at normal load', t => {
    expect(summarizeClusterHealth(t.nodes, false).saturatedCount).toBe(0);
  });
});
