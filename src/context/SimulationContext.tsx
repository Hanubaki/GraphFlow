import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GraphNode, GraphEdge, DataPacket, SimulationMetrics } from '../types/graph';
import { soundFx } from '../utils/sound';
import {
  findIngressEdges,
  findDownstreamEdges,
  createHopPacket,
  calculateEffectiveLatency,
  evaluateCircuitBreakerTransition,
} from '../utils/simulationPhysics';

export interface SimulationControls {
  isRunning: boolean;
  speedMultiplier: number;
  isSpikeMode: boolean;
  soundEnabled: boolean;
  metrics: SimulationMetrics;
  togglePlay: () => void;
  setSpeedMultiplier: (speed: number) => void;
  triggerSpike: () => void;
  toggleSound: () => void;
  resetSimulation: () => void;
}

// Low-frequency control context (updates on user interaction or 1 Hz metrics)
const SimulationControlContext = createContext<SimulationControls | null>(null);

// High-frequency animation context (updates at 60 FPS for canvas rendering)
const SimulationPacketContext = createContext<DataPacket[]>([]);

export const useSimulationControls = (): SimulationControls => {
  const ctx = useContext(SimulationControlContext);
  if (!ctx) {
    throw new Error('useSimulationControls must be used within a SimulationProvider');
  }
  return ctx;
};

export const useSimulationPackets = (): DataPacket[] => {
  return useContext(SimulationPacketContext);
};

interface SimulationProviderProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onUpdateNode?: (id: string, updates: Partial<GraphNode>) => void;
  children: React.ReactNode;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  nodes,
  edges,
  onUpdateNode,
  children,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplierState] = useState<number>(1);
  const [isSpikeMode, setIsSpikeMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // High-frequency packet animation state (isolated to SimulationPacketContext)
  const [packets, setPackets] = useState<DataPacket[]>([]);

  // Low-frequency metrics (updated at 1 Hz)
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalSent: 0,
    delivered: 0,
    errors: 0,
    currentRps: 0,
    avgLatencyMs: 24,
  });

  const animFrameRef = useRef<number | null>(null);
  const rpsCounterRef = useRef<number>(0);
  const lastRpsCalcTime = useRef<number>(Date.now());
  const pendingMetricsRef = useRef<{ sent: number; delivered: number; errors: number }>({
    sent: 0,
    delivered: 0,
    errors: 0,
  });
  const consecutiveErrorsRef = useRef<Map<string, number>>(new Map());
  const breakerChangedAtRef = useRef<Map<string, number>>(new Map());

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      soundFx.enabled = !prev;
      return !prev;
    });
  }, []);

  const triggerSpike = useCallback(() => {
    setIsSpikeMode(true);
    soundFx.playSpike();
    setTimeout(() => {
      setIsSpikeMode(false);
    }, 4000);
  }, []);

  const togglePlay = useCallback(() => {
    setIsRunning(prev => !prev);
    soundFx.playClick();
  }, []);

  const setSpeedMultiplier = useCallback((speed: number) => {
    setSpeedMultiplierState(speed);
  }, []);

  const resetSimulation = useCallback(() => {
    setPackets([]);
    pendingMetricsRef.current = { sent: 0, delivered: 0, errors: 0 };
    consecutiveErrorsRef.current.clear();
    breakerChangedAtRef.current.clear();
    setMetrics({
      totalSent: 0,
      delivered: 0,
      errors: 0,
      currentRps: 0,
      avgLatencyMs: 24,
    });
    soundFx.playClick();
  }, []);

  // Generate new packets at ingress edges (causal entry points)
  useEffect(() => {
    if (!isRunning || edges.length === 0) return;

    const intervalTime = isSpikeMode ? 140 / speedMultiplier : 420 / speedMultiplier;

    const spawnInterval = setInterval(() => {
      const ingressEdges = findIngressEdges(nodes, edges);
      if (ingressEdges.length === 0) return;

      const count = isSpikeMode ? Math.min(ingressEdges.length * 2, 4) : 1;
      const newPackets: DataPacket[] = [];

      for (let i = 0; i < count; i++) {
        const ingressEdge = ingressEdges[Math.floor(Math.random() * ingressEdges.length)];
        const fromNode = nodes.find(n => n.id === ingressEdge.fromNodeId);
        const toNode = nodes.find(n => n.id === ingressEdge.toNodeId);

        const pkt = createHopPacket(ingressEdge, fromNode, toNode, isSpikeMode ? 3 : 1, isSpikeMode);
        if (!pkt) continue;

        newPackets.push(pkt);
        rpsCounterRef.current += 1;
      }

      if (newPackets.length > 0) {
        setPackets(prev => {
          const filtered = prev.length > 42 ? prev.slice(prev.length - 32) : prev;
          return [...filtered, ...newPackets];
        });
        pendingMetricsRef.current.sent += newPackets.length;
      }
    }, intervalTime);

    return () => clearInterval(spawnInterval);
  }, [isRunning, edges, nodes, speedMultiplier, isSpikeMode]);

  // Animation frame loop for smooth 60 FPS packet advancement & causal downstream hop propagation
  useEffect(() => {
    if (!isRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(32, timestamp - lastTimestamp);
      lastTimestamp = timestamp;
      const now = Date.now();

      setPackets(prev => {
        if (prev.length === 0) return prev;

        // Count active inbound packets per node for backpressure physics
        const inboundCounts = new Map<string, number>();
        for (const p of prev) {
          inboundCounts.set(p.toNodeId, (inboundCounts.get(p.toNodeId) ?? 0) + 1);
        }

        const updated: DataPacket[] = [];
        const spawnedDownstream: DataPacket[] = [];
        let deliveredCount = 0;
        let errorCount = 0;

        for (const pkt of prev) {
          const nextProgress = pkt.progress + pkt.speed * (dt / 16.66) * speedMultiplier;
          if (nextProgress >= 1) {
            const targetNode = nodes.find(n => n.id === pkt.toNodeId);

            if (pkt.status === 'error' || pkt.status === 'dlq') {
              errorCount++;
              if (Math.random() < 0.2) soundFx.playError();

              if (targetNode) {
                const prevErr = (consecutiveErrorsRef.current.get(targetNode.id) ?? 0) + 1;
                consecutiveErrorsRef.current.set(targetNode.id, prevErr);

                const lastChange = breakerChangedAtRef.current.get(targetNode.id) ?? now;
                const currentBreaker = targetNode.circuitBreaker || 'closed';
                const nextBreaker = evaluateCircuitBreakerTransition(
                  currentBreaker,
                  prevErr,
                  now - lastChange
                );

                if (nextBreaker !== currentBreaker && onUpdateNode) {
                  breakerChangedAtRef.current.set(targetNode.id, now);
                  onUpdateNode(targetNode.id, { circuitBreaker: nextBreaker });
                }
              }
            } else {
              deliveredCount++;
              if (Math.random() < 0.05) soundFx.playPacketDelivered();

              if (targetNode) {
                consecutiveErrorsRef.current.set(targetNode.id, 0);
                if (targetNode.circuitBreaker === 'half-open' && onUpdateNode) {
                  breakerChangedAtRef.current.set(targetNode.id, now);
                  onUpdateNode(targetNode.id, { circuitBreaker: 'closed' });
                }

                // Causal hop propagation: forward packet to downstream edges
                if (prev.length + spawnedDownstream.length < 44) {
                  const outEdges = findDownstreamEdges(targetNode.id, edges);
                  for (const outEdge of outEdges) {
                    const nextTarget = nodes.find(n => n.id === outEdge.toNodeId);
                    const activeIn = inboundCounts.get(outEdge.toNodeId) ?? 0;
                    const childPkt = createHopPacket(
                      outEdge,
                      targetNode,
                      nextTarget,
                      activeIn,
                      isSpikeMode
                    );
                    if (childPkt) {
                      spawnedDownstream.push(childPkt);
                      rpsCounterRef.current += 1;
                      pendingMetricsRef.current.sent += 1;
                    }
                  }
                }
              }
            }
          } else {
            updated.push({
              ...pkt,
              progress: nextProgress,
            });
          }
        }

        if (deliveredCount > 0 || errorCount > 0) {
          pendingMetricsRef.current.delivered += deliveredCount;
          pendingMetricsRef.current.errors += errorCount;
        }

        const combined = [...updated, ...spawnedDownstream];
        return combined.length > 48 ? combined.slice(combined.length - 40) : combined;
      });

      // Calculate RPS, effective backpressure latency, and circuit breaker cooldowns in 1 Hz batches (prevents 60 FPS UI thrashing)
      if (now - lastRpsCalcTime.current >= 1000) {
        const elapsedSec = (now - lastRpsCalcTime.current) / 1000;
        const currentRps = Math.round(rpsCounterRef.current / elapsedSec);
        rpsCounterRef.current = 0;
        lastRpsCalcTime.current = now;

        // Check if any OPEN circuit breakers have completed their cooldown to enter HALF-OPEN
        if (onUpdateNode) {
          for (const n of nodes) {
            if (n.circuitBreaker === 'open') {
              const openedAt = breakerChangedAtRef.current.get(n.id) ?? (now - 7000);
              const nextState = evaluateCircuitBreakerTransition('open', 0, now - openedAt);
              if (nextState === 'half-open') {
                breakerChangedAtRef.current.set(n.id, now);
                onUpdateNode(n.id, { circuitBreaker: 'half-open' });
              }
            }
          }
        }

        const activeNodes = nodes.filter(n => n.status !== 'down');
        const avgLat = activeNodes.length > 0
          ? Math.round(
              activeNodes.reduce(
                (acc, n) => acc + calculateEffectiveLatency(n, isSpikeMode ? 3 : 1, isSpikeMode),
                0
              ) / activeNodes.length
            )
          : 0;

        const pending = pendingMetricsRef.current;
        pendingMetricsRef.current = { sent: 0, delivered: 0, errors: 0 };

        setMetrics(m => ({
          totalSent: m.totalSent + pending.sent,
          delivered: m.delivered + pending.delivered,
          errors: m.errors + pending.errors,
          currentRps,
          avgLatencyMs: avgLat,
        }));
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isRunning, speedMultiplier, nodes, edges, isSpikeMode, onUpdateNode]);

  const controlsValue = useMemo<SimulationControls>(() => ({
    isRunning,
    speedMultiplier,
    isSpikeMode,
    soundEnabled,
    metrics,
    togglePlay,
    setSpeedMultiplier,
    triggerSpike,
    toggleSound,
    resetSimulation,
  }), [
    isRunning,
    speedMultiplier,
    isSpikeMode,
    soundEnabled,
    metrics,
    togglePlay,
    setSpeedMultiplier,
    triggerSpike,
    toggleSound,
    resetSimulation,
  ]);

  return (
    <SimulationControlContext.Provider value={controlsValue}>
      <SimulationPacketContext.Provider value={packets}>
        {children}
      </SimulationPacketContext.Provider>
    </SimulationControlContext.Provider>
  );
};
