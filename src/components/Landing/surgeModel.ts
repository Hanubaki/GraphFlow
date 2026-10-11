import { useCallback, useEffect, useState } from 'react';

/**
 * Tiny queueing model behind the landing page demo.
 *
 * Producers publish into a Kafka topic; one consumer group drains it at a fixed
 * capacity. While a surge runs, producers outpace the consumer and the topic
 * backs up. When the surge ends, the backlog drains at (capacity - producer rate)
 * and the measured drain time is reported.
 *
 * Time is counted in integer ticks so surge length and drain time stay exact.
 */

export const TICK_MS = 200;
export const TICK_SECONDS = TICK_MS / 1000;

export const BASE_RATE = 720; // msg/s at steady state
export const SURGE_RATE = 2400; // msg/s during a surge
export const CONSUMER_CAPACITY = 1500; // msg/s the consumer group can process
export const SURGE_TICKS = 50; // 10 s
export const HISTORY_TICKS = 150; // 30 s window for the lag chart

export interface SurgeState {
  tick: number;
  producerRate: number;
  consumerRate: number;
  depth: number;
  surgeTicksRemaining: number;
  drainStartTick: number | null;
  lastDrainSeconds: number | null;
  peakDepth: number;
  history: number[];
}

export const createInitialState = (): SurgeState => ({
  tick: 0,
  producerRate: BASE_RATE,
  consumerRate: BASE_RATE,
  depth: 0,
  surgeTicksRemaining: 0,
  drainStartTick: null,
  lastDrainSeconds: null,
  peakDepth: 0,
  history: Array.from({ length: HISTORY_TICKS }, () => 0),
});

export const startSurge = (state: SurgeState): SurgeState => ({
  ...state,
  surgeTicksRemaining: SURGE_TICKS,
  drainStartTick: null,
  peakDepth: state.depth,
});

/** Advance the model by one tick. `jitter` is a fractional offset on the producer rate (e.g. 0.02 = +2%). */
export const stepSimulation = (state: SurgeState, jitter = 0): SurgeState => {
  const surging = state.surgeTicksRemaining > 0;
  const producerRate = Math.round((surging ? SURGE_RATE : BASE_RATE) * (1 + jitter));

  const available = state.depth + producerRate * TICK_SECONDS;
  const processed = Math.min(available, CONSUMER_CAPACITY * TICK_SECONDS);
  const depth = available - processed;

  const tick = state.tick + 1;
  const surgeTicksRemaining = Math.max(0, state.surgeTicksRemaining - 1);

  let drainStartTick = state.drainStartTick;
  let lastDrainSeconds = state.lastDrainSeconds;

  if (surging && surgeTicksRemaining === 0) {
    drainStartTick = tick;
  }
  if (drainStartTick !== null && depth < 1) {
    lastDrainSeconds = (tick - drainStartTick) * TICK_SECONDS;
    drainStartTick = null;
  }

  return {
    tick,
    producerRate,
    consumerRate: Math.round(processed / TICK_SECONDS),
    depth: depth < 1 ? 0 : depth,
    surgeTicksRemaining,
    drainStartTick,
    lastDrainSeconds,
    peakDepth: Math.max(state.peakDepth, depth),
    history: [...state.history.slice(1), depth < 1 ? 0 : depth],
  };
};

/** Seconds of work waiting in the topic at full consumer capacity. */
export const consumerLagSeconds = (state: SurgeState): number => state.depth / CONSUMER_CAPACITY;

/** Estimated seconds until the backlog is empty, or null while it is still growing or already empty. */
export const drainEtaSeconds = (state: SurgeState): number | null => {
  const headroom = CONSUMER_CAPACITY - state.producerRate;
  if (state.depth <= 0 || headroom <= 0) return null;
  return state.depth / headroom;
};

/** Gateway p99 rises linearly with inbound load between steady state (18 ms) and surge (64 ms). */
export const gatewayP99Ms = (state: SurgeState): number => {
  const load = (state.producerRate - BASE_RATE) / (SURGE_RATE - BASE_RATE);
  return Math.round(18 + Math.max(0, load) * 46);
};

export type SurgePhase = 'steady' | 'surging' | 'draining';

export const surgePhase = (state: SurgeState): SurgePhase => {
  if (state.surgeTicksRemaining > 0) return 'surging';
  if (state.depth > 0) return 'draining';
  return 'steady';
};

export function useSurgeSimulation() {
  const [state, setState] = useState<SurgeState>(createInitialState);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState(prev => stepSimulation(prev, (Math.random() - 0.5) * 0.04));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const triggerSurge = useCallback(() => setState(startSurge), []);

  return { state, triggerSurge };
}
