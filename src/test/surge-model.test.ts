import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  startSurge,
  stepSimulation,
  drainEtaSeconds,
  gatewayP99Ms,
  surgePhase,
  SURGE_TICKS,
  CONSUMER_CAPACITY,
  SURGE_RATE,
  BASE_RATE,
} from '../components/Landing/surgeModel';

const run = (state: ReturnType<typeof createInitialState>, ticks: number) => {
  let s = state;
  for (let i = 0; i < ticks; i++) s = stepSimulation(s);
  return s;
};

describe('landing surge queue model', () => {
  it('stays empty at steady state because producers are below consumer capacity', () => {
    const s = run(createInitialState(), 100);
    expect(s.depth).toBe(0);
    expect(s.consumerRate).toBe(BASE_RATE);
    expect(surgePhase(s)).toBe('steady');
  });

  it('backs up by (surge rate - capacity) x 10 s during a surge', () => {
    const s = run(startSurge(createInitialState()), SURGE_TICKS);
    expect(s.depth).toBeCloseTo((SURGE_RATE - CONSUMER_CAPACITY) * 10, 6);
    expect(s.consumerRate).toBe(CONSUMER_CAPACITY);
    expect(surgePhase(s)).toBe('draining');
  });

  it('measures the drain time once the backlog is cleared', () => {
    const s = run(startSurge(createInitialState()), SURGE_TICKS + 80);
    expect(s.depth).toBe(0);
    // 9,000 messages drained at 1,500 - 720 = 780 msg/s, rounded up to a 200 ms tick
    expect(s.lastDrainSeconds).toBeCloseTo(11.6, 5);
    expect(s.peakDepth).toBeCloseTo(9000, 6);
  });

  it('estimates drain ETA only while the backlog is shrinking', () => {
    const surging = run(startSurge(createInitialState()), 10);
    expect(drainEtaSeconds(surging)).toBeNull();

    const draining = run(startSurge(createInitialState()), SURGE_TICKS + 1);
    const eta = drainEtaSeconds(draining);
    expect(eta).not.toBeNull();
    expect(eta!).toBeGreaterThan(10);
    expect(eta!).toBeLessThan(12);
  });

  it('raises gateway p99 with inbound load', () => {
    const steady = createInitialState();
    const surging = run(startSurge(steady), 1);
    expect(gatewayP99Ms(steady)).toBe(18);
    expect(gatewayP99Ms(surging)).toBe(64);
  });

  it('keeps a fixed-length history window for the lag chart', () => {
    const initial = createInitialState();
    const s = run(startSurge(initial), 20);
    expect(s.history).toHaveLength(initial.history.length);
    expect(s.history[s.history.length - 1]).toBeCloseTo(s.depth, 6);
  });
});
