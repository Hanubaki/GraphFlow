import { describe, it, expect, beforeEach } from 'vitest';
import { telemetry } from '../utils/telemetry';
import { detectEntry, getFunnelContext, markEngaged, startFunnel } from '../utils/funnel';

describe('Funnel measurement', () => {
  it('classifies how a visitor entered', () => {
    expect(detectEntry({ search: '', hash: '' })).toBe('landing');
    expect(detectEntry({ search: '?template=stripe-webhook-ledger', hash: '' })).toBe('template_link');
    expect(detectEntry({ search: '?blueprint=x', hash: '' })).toBe('template_link');
    expect(detectEntry({ search: '', hash: '#share=A~B' })).toBe('share_link');
    expect(detectEntry({ search: '', hash: '#embed=abc' })).toBe('embed');
  });

  it('builds an anonymous session context without PII', () => {
    const ctx = getFunnelContext();
    expect(ctx.sid.length).toBeGreaterThan(8);
    expect(['mobile', 'desktop']).toContain(ctx.device);
    expect(Object.keys(ctx).sort()).toEqual(['device', 'entry', 'ref', 'sid', 'utm']);
    expect(getFunnelContext().sid).toBe(ctx.sid);
  });

  describe('session events', () => {
    beforeEach(() => telemetry.clearHistory());

    it('emits Session Started once and Studio Engaged only for the first real interaction', () => {
      startFunnel();
      startFunnel(); // idempotent
      expect(telemetry.getHistory().filter(e => e.name === 'Session Started')).toHaveLength(1);

      telemetry.track('Node Created', { type: 'gateway' });
      telemetry.track('Simulation Toggled', {});
      markEngaged('canvas_touch');

      const engaged = telemetry.getHistory().filter(e => e.name === 'Studio Engaged');
      expect(engaged).toHaveLength(1);
      expect(engaged[0].properties.action).toBe('Node Created');
    });
  });
});
