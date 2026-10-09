import { useState, useEffect, useRef, useCallback } from 'react';
import { GraphNode, GraphEdge, DataPacket, SimulationMetrics } from '../types/graph';
import { soundFx } from '../utils/sound';

export function useSimulation(nodes: GraphNode[], edges: GraphEdge[]) {
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [isSpikeMode, setIsSpikeMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [packets, setPackets] = useState<DataPacket[]>([]);

  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalSent: 0,
    delivered: 0,
    errors: 0,
    currentRps: 0,
    avgLatencyMs: 24,
  });

  // Track animation frame & intervals
  const animFrameRef = useRef<number | null>(null);
  const rpsCounterRef = useRef<number>(0);
  const lastRpsCalcTime = useRef<number>(Date.now());

  // Toggle sound
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => {
      soundFx.enabled = !prev;
      return !prev;
    });
  }, []);

  // Trigger temporary traffic spike
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

  const resetSimulation = useCallback(() => {
    setPackets([]);
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
      // Pick random active edges to send traffic
      const count = isSpikeMode ? Math.min(edges.length, 4) : 1;
      const newPackets: DataPacket[] = [];

      for (let i = 0; i < count; i++) {
        const randomEdge = edges[Math.floor(Math.random() * edges.length)];
        const fromNode = nodes.find(n => n.id === randomEdge.fromNodeId);
        const toNode = nodes.find(n => n.id === randomEdge.toNodeId);

        if (!fromNode || !toNode || fromNode.status === 'down' || toNode.status === 'down') {
          continue;
        }

        // Check if error will occur based on node and edge error rate
        const combinedErrorRate = Math.max(fromNode.errorRate, toNode.errorRate, randomEdge.errorRate);
        const isError = Math.random() * 100 < combinedErrorRate;

        // Base speed inverse to latency
        const totalLatency = (fromNode.latencyMs + toNode.latencyMs + randomEdge.latencyMs);
        const baseSpeed = Math.min(0.025, Math.max(0.006, 120 / Math.max(30, totalLatency)));

        newPackets.push({
          id: `pkt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          edgeId: randomEdge.id,
          fromNodeId: randomEdge.fromNodeId,
          toNodeId: randomEdge.toNodeId,
          progress: 0,
          speed: baseSpeed,
          status: isError ? 'error' : (toNode.status === 'degraded' ? 'warning' : 'success'),
          label: randomEdge.protocol,
          createdAt: Date.now(),
        });

        rpsCounterRef.current += 1;
      }

      if (newPackets.length > 0) {
        setPackets(prev => {
          // Cap total active packets to prevent DOM clutter
          const filtered = prev.length > 40 ? prev.slice(prev.length - 30) : prev;
          return [...filtered, ...newPackets];
        });
        setMetrics(m => ({
          ...m,
          totalSent: m.totalSent + newPackets.length,
        }));
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
      const dt = Math.min(32, timestamp - lastTimestamp); // cap dt
      lastTimestamp = timestamp;

      setPackets(prev => {
        if (prev.length === 0) return prev;

        const updated: DataPacket[] = [];
        let deliveredCount = 0;
        let errorCount = 0;

        for (const pkt of prev) {
          const nextProgress = pkt.progress + pkt.speed * (dt / 16.66) * speedMultiplier;
          if (nextProgress >= 1) {
            // Packet finished journey
            if (pkt.status === 'error') {
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
          setMetrics(m => ({
            ...m,
            delivered: m.delivered + deliveredCount,
            errors: m.errors + errorCount,
          }));
        }

        return updated;
      });

      // Calculate RPS every 1 second
      const now = Date.now();
      if (now - lastRpsCalcTime.current >= 1000) {
        const elapsedSec = (now - lastRpsCalcTime.current) / 1000;
        const currentRps = Math.round(rpsCounterRef.current / elapsedSec);
        rpsCounterRef.current = 0;
        lastRpsCalcTime.current = now;

        // Calculate dynamic average latency from active nodes
        const activeNodes = nodes.filter(n => n.status !== 'down');
        const avgLat = activeNodes.length > 0
          ? Math.round(activeNodes.reduce((acc, n) => acc + n.latencyMs, 0) / activeNodes.length)
          : 0;

        setMetrics(m => ({
          ...m,
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

  return {
    isRunning,
    speedMultiplier,
    isSpikeMode,
    soundEnabled,
    packets,
    metrics,
    togglePlay,
    setSpeedMultiplier,
    triggerSpike,
    toggleSound,
    resetSimulation,
  };
}
