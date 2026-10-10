import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { GraphNode, GraphEdge, DataPacket, SimulationMetrics } from '../types/graph';
import { soundFx } from '../utils/sound';

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
  children: React.ReactNode;
}

export const SimulationProvider: React.FC<SimulationProviderProps> = ({
  nodes,
  edges,
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
    setMetrics({
      totalSent: 0,
      delivered: 0,
      errors: 0,
      currentRps: 0,
      avgLatencyMs: 24,
    });
    soundFx.playClick();
  }, []);

  // Generate new packets along active edges
  useEffect(() => {
    if (!isRunning || edges.length === 0) return;

    const intervalTime = isSpikeMode ? 120 / speedMultiplier : 400 / speedMultiplier;

    const spawnInterval = setInterval(() => {
      const count = isSpikeMode ? Math.min(edges.length, 4) : 1;
      const newPackets: DataPacket[] = [];

      for (let i = 0; i < count; i++) {
        const randomEdge = edges[Math.floor(Math.random() * edges.length)];
        const fromNode = nodes.find(n => n.id === randomEdge.fromNodeId);
        const toNode = nodes.find(n => n.id === randomEdge.toNodeId);

        if (!fromNode || !toNode || fromNode.status === 'down' || toNode.status === 'down') {
          continue;
        }

        const combinedErrorRate = Math.max(fromNode.errorRate, toNode.errorRate, randomEdge.errorRate);
        const isError = Math.random() * 100 < combinedErrorRate;

        const totalLatency = fromNode.latencyMs + toNode.latencyMs + randomEdge.latencyMs;
        const baseSpeed = Math.min(0.025, Math.max(0.006, 120 / Math.max(30, totalLatency)));

        const isCircuitOpen = toNode.circuitBreaker === 'open';
        const packetStatus: 'success' | 'warning' | 'error' | 'dlq' = isCircuitOpen
          ? 'dlq'
          : (isError ? 'error' : (toNode.status === 'degraded' ? 'warning' : 'success'));

        newPackets.push({
          id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          edgeId: randomEdge.id,
          fromNodeId: randomEdge.fromNodeId,
          toNodeId: randomEdge.toNodeId,
          progress: 0,
          speed: baseSpeed,
          status: packetStatus,
          label: isCircuitOpen ? 'DLQ/Trip' : randomEdge.protocol,
          createdAt: Date.now(),
        });

        rpsCounterRef.current += 1;
      }

      if (newPackets.length > 0) {
        setPackets(prev => {
          const filtered = prev.length > 40 ? prev.slice(prev.length - 30) : prev;
          return [...filtered, ...newPackets];
        });
        pendingMetricsRef.current.sent += newPackets.length;
      }
    }, intervalTime);

    return () => clearInterval(spawnInterval);
  }, [isRunning, edges, nodes, speedMultiplier, isSpikeMode]);

  // Animation frame loop for smooth 60 FPS packet advancement
  useEffect(() => {
    if (!isRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(32, timestamp - lastTimestamp);
      lastTimestamp = timestamp;

      setPackets(prev => {
        if (prev.length === 0) return prev;

        const updated: DataPacket[] = [];
        let deliveredCount = 0;
        let errorCount = 0;

        for (const pkt of prev) {
          const nextProgress = pkt.progress + pkt.speed * (dt / 16.66) * speedMultiplier;
          if (nextProgress >= 1) {
            if (pkt.status === 'error' || pkt.status === 'dlq') {
              errorCount++;
              if (Math.random() < 0.2) soundFx.playError();
            } else {
              deliveredCount++;
              if (Math.random() < 0.05) soundFx.playPacketDelivered();
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

        return updated;
      });

      // Calculate RPS and commit accumulated metrics in 1 Hz batches (prevents 60 FPS UI thrashing)
      const now = Date.now();
      if (now - lastRpsCalcTime.current >= 1000) {
        const elapsedSec = (now - lastRpsCalcTime.current) / 1000;
        const currentRps = Math.round(rpsCounterRef.current / elapsedSec);
        rpsCounterRef.current = 0;
        lastRpsCalcTime.current = now;

        const activeNodes = nodes.filter(n => n.status !== 'down');
        const avgLat = activeNodes.length > 0
          ? Math.round(activeNodes.reduce((acc, n) => acc + n.latencyMs, 0) / activeNodes.length)
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
  }, [isRunning, speedMultiplier, nodes]);

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
