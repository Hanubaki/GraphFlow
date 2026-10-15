import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GraphNode, GraphEdge, DataPacket, SimulationMetrics } from '../types/graph';
import { soundFx } from '../utils/sound';
import {
  findIngressEdges,
  findDownstreamEdges,
  createHopPacket,
  calculateEffectiveLatency,
  evaluateCircuitBreakerTransition,
  IncidentEvent,
} from '../utils/simulationPhysics';

export interface SimulationControls {
  isRunning: boolean;
  speedMultiplier: number;
  trafficLoadMultiplier: number;
  isSpikeMode: boolean;
  soundEnabled: boolean;
  metrics: SimulationMetrics;
  incidents: IncidentEvent[];
  togglePlay: () => void;
  setSpeedMultiplier: (speed: number) => void;
  setTrafficLoadMultiplier: (load: number) => void;
  triggerSpike: () => void;
  toggleSound: () => void;
  resetSimulation: () => void;
  clearIncidents: () => void;
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

function formatIncidentTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  nodes,
  edges,
  onUpdateNode,
  children,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplierState] = useState<number>(1);
  const [trafficLoadMultiplier, setTrafficLoadMultiplierState] = useState<number>(1);
  const [isSpikeMode, setIsSpikeMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [incidents, setIncidents] = useState<IncidentEvent[]>([]);

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
  const prevNodeStatusRef = useRef<Map<string, GraphNode['status']>>(new Map());

  // Stable refs prevent node dragging (60-120 Hz position updates) from tearing down setInterval & RAF loops
  const nodesRef = useRef<GraphNode[]>(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef<GraphEdge[]>(edges);
  edgesRef.current = edges;
  const onUpdateNodeRef = useRef(onUpdateNode);
  onUpdateNodeRef.current = onUpdateNode;
  const trafficLoadRef = useRef<number>(trafficLoadMultiplier);
  trafficLoadRef.current = trafficLoadMultiplier;
  const hasEdges = edges.length > 0;

  const appendIncident = useCallback(
    (
      severity: IncidentEvent['severity'],
      nodeId: string,
      nodeTitle: string,
      type: IncidentEvent['type'],
      message: string
    ) => {
      const now = Date.now();
      setIncidents(prev => {
        const entry: IncidentEvent = {
          id: `inc-${now}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now,
          timeLabel: formatIncidentTime(now),
          severity,
          nodeId,
          nodeTitle,
          type,
          message,
        };
        return [entry, ...prev].slice(0, 20);
      });
    },
    []
  );

  // Track manual node status changes (e.g. Chaos Kill / Degrade / Restore) for SRE Post-Mortem log
  useEffect(() => {
    const prevMap = prevNodeStatusRef.current;
    for (const n of nodes) {
      const prevStatus = prevMap.get(n.id);
      if (prevStatus && prevStatus !== n.status) {
        if (n.status === 'down') {
          appendIncident('critical', n.id, n.title, 'NODE_DOWN', 'Service terminated (DOWN) — dropping all inbound traffic.');
        } else if (n.status === 'degraded') {
          appendIncident('warning', n.id, n.title, 'NODE_DEGRADED', `Service degraded (${n.latencyMs}ms latency, ${n.errorRate}% error rate).`);
        } else if (n.status === 'healthy' && (prevStatus === 'down' || prevStatus === 'degraded')) {
          appendIncident('recovery', n.id, n.title, 'NODE_RECOVERED', 'Service restored to HEALTHY operational status.');
        }
      }
      prevMap.set(n.id, n.status);
    }
  }, [nodes, appendIncident]);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      soundFx.enabled = !prev;
      return !prev;
    });
  }, []);

  const triggerSpike = useCallback(() => {
    setIsSpikeMode(true);
    soundFx.playSpike();
    appendIncident(
      'warning',
      'ingress',
      'Edge Ingress',
      'TRAFFIC_SPIKE',
      '3x Traffic Surge injected at edge ingress for 4.0s.'
    );
    setTimeout(() => {
      setIsSpikeMode(false);
    }, 4000);
  }, [appendIncident]);

  const togglePlay = useCallback(() => {
    setIsRunning(prev => !prev);
    soundFx.playClick();
  }, []);

  const setSpeedMultiplier = useCallback((speed: number) => {
    setSpeedMultiplierState(speed);
  }, []);

  const setTrafficLoadMultiplier = useCallback((load: number) => {
    setTrafficLoadMultiplierState(Math.max(0.5, Math.min(10, Number(load.toFixed(1)))));
  }, []);

  const clearIncidents = useCallback(() => {
    setIncidents([]);
  }, []);

  const resetSimulation = useCallback(() => {
    setPackets([]);
    setIncidents([]);
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
    if (!isRunning || !hasEdges) return;

    const effectiveRateScale = Math.max(0.5, Math.min(4, Math.sqrt(trafficLoadMultiplier)));
    const intervalTime = Math.max(
      70,
      (isSpikeMode ? 140 : 420) / (speedMultiplier * effectiveRateScale)
    );

    const spawnInterval = setInterval(() => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const currentLoad = trafficLoadRef.current;
      const ingressEdges = findIngressEdges(currentNodes, currentEdges);
      if (ingressEdges.length === 0) return;

      const baseBurst = currentLoad >= 5 ? 2 : 1;
      const count = isSpikeMode ? Math.min(ingressEdges.length * 2, 4) : baseBurst;
      const newPackets: DataPacket[] = [];

      for (let i = 0; i < count; i++) {
        const ingressEdge = ingressEdges[Math.floor(Math.random() * ingressEdges.length)];
        const fromNode = currentNodes.find(n => n.id === ingressEdge.fromNodeId);
        const toNode = currentNodes.find(n => n.id === ingressEdge.toNodeId);

        const pkt = createHopPacket(
          ingressEdge,
          fromNode,
          toNode,
          isSpikeMode ? 3 : Math.ceil(currentLoad),
          isSpikeMode,
          Math.random,
          currentLoad
        );
        if (!pkt) continue;

        newPackets.push(pkt);
        rpsCounterRef.current += Math.max(1, Math.round(currentLoad));
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
  }, [isRunning, hasEdges, speedMultiplier, isSpikeMode, trafficLoadMultiplier]);

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
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const currentLoad = trafficLoadRef.current;
      const handleUpdateNode = onUpdateNodeRef.current;

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
            const targetNode = currentNodes.find(n => n.id === pkt.toNodeId);

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

                if (nextBreaker !== currentBreaker && handleUpdateNode) {
                  breakerChangedAtRef.current.set(targetNode.id, now);
                  handleUpdateNode(targetNode.id, { circuitBreaker: nextBreaker });
                  if (nextBreaker === 'open') {
                    appendIncident(
                      'critical',
                      targetNode.id,
                      targetNode.title,
                      'CIRCUIT_OPEN',
                      `Circuit Breaker tripped OPEN after ${prevErr} consecutive failures — fast-failing traffic to DLQ.`
                    );
                  }
                }
              }
            } else {
              deliveredCount++;
              if (Math.random() < 0.05) soundFx.playPacketDelivered();

              if (targetNode) {
                consecutiveErrorsRef.current.set(targetNode.id, 0);
                if (targetNode.circuitBreaker === 'half-open' && handleUpdateNode) {
                  breakerChangedAtRef.current.set(targetNode.id, now);
                  handleUpdateNode(targetNode.id, { circuitBreaker: 'closed' });
                  appendIncident(
                    'recovery',
                    targetNode.id,
                    targetNode.title,
                    'CIRCUIT_RECOVERED',
                    'Circuit Breaker probe succeeded — restored CLOSED state.'
                  );
                }

                // Causal hop propagation: forward packet to downstream edges
                if (prev.length + spawnedDownstream.length < 44) {
                  const outEdges = findDownstreamEdges(targetNode.id, currentEdges);
                  for (const outEdge of outEdges) {
                    const nextTarget = currentNodes.find(n => n.id === outEdge.toNodeId);
                    const activeIn = inboundCounts.get(outEdge.toNodeId) ?? 0;
                    const childPkt = createHopPacket(
                      outEdge,
                      targetNode,
                      nextTarget,
                      activeIn,
                      isSpikeMode,
                      Math.random,
                      currentLoad
                    );
                    if (childPkt) {
                      spawnedDownstream.push(childPkt);
                      rpsCounterRef.current += Math.max(1, Math.round(currentLoad));
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
        if (handleUpdateNode) {
          for (const n of currentNodes) {
            if (n.circuitBreaker === 'open') {
              const openedAt = breakerChangedAtRef.current.get(n.id) ?? (now - 7000);
              const nextState = evaluateCircuitBreakerTransition('open', 0, now - openedAt);
              if (nextState === 'half-open') {
                breakerChangedAtRef.current.set(n.id, now);
                handleUpdateNode(n.id, { circuitBreaker: 'half-open' });
              }
            }
          }
        }

        const activeNodes = currentNodes.filter(n => n.status !== 'down');
        const avgLat = activeNodes.length > 0
          ? Math.round(
              activeNodes.reduce(
                (acc, n) => acc + calculateEffectiveLatency(n, isSpikeMode ? 3 : 1, isSpikeMode, currentLoad),
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
  }, [isRunning, speedMultiplier, isSpikeMode, appendIncident]);

  const controlsValue = useMemo<SimulationControls>(() => ({
    isRunning,
    speedMultiplier,
    trafficLoadMultiplier,
    isSpikeMode,
    soundEnabled,
    metrics,
    incidents,
    togglePlay,
    setSpeedMultiplier,
    setTrafficLoadMultiplier,
    triggerSpike,
    toggleSound,
    resetSimulation,
    clearIncidents,
  }), [
    isRunning,
    speedMultiplier,
    trafficLoadMultiplier,
    isSpikeMode,
    soundEnabled,
    metrics,
    incidents,
    togglePlay,
    setSpeedMultiplier,
    setTrafficLoadMultiplier,
    triggerSpike,
    toggleSound,
    resetSimulation,
    clearIncidents,
  ]);

  return (
    <SimulationControlContext.Provider value={controlsValue}>
      <SimulationPacketContext.Provider value={packets}>
        {children}
      </SimulationPacketContext.Provider>
    </SimulationControlContext.Provider>
  );
};
