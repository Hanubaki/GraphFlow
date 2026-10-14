import { useState, useEffect, useRef, useCallback } from 'react';
import { GraphNode, GraphEdge, DataPacket, SimulationMetrics } from '../types/graph';
import { soundFx } from '../utils/sound';
import {
  findIngressEdges,
  findDownstreamEdges,
  createHopPacket,
  calculateEffectiveLatency,
} from '../utils/simulationPhysics';

export {
  SimulationProvider,
  useSimulationControls,
  useSimulationPackets,
} from '../context/SimulationContext';
export type { SimulationControls } from '../context/SimulationContext';

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

  const animFrameRef = useRef<number | null>(null);
  const rpsCounterRef = useRef<number>(0);
  const lastRpsCalcTime = useRef<number>(Date.now());
  const nodesRef = useRef<GraphNode[]>(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef<GraphEdge[]>(edges);
  edgesRef.current = edges;
  const hasEdges = edges.length > 0;

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

  // Generate new packets at ingress edges
  useEffect(() => {
    if (!isRunning || !hasEdges) return;

    const intervalTime = isSpikeMode ? 140 / speedMultiplier : 420 / speedMultiplier;

    const spawnInterval = setInterval(() => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const ingressEdges = findIngressEdges(currentNodes, currentEdges);
      if (ingressEdges.length === 0) return;

      const count = isSpikeMode ? Math.min(ingressEdges.length * 2, 4) : 1;
      const newPackets: DataPacket[] = [];

      for (let i = 0; i < count; i++) {
        const ingressEdge = ingressEdges[Math.floor(Math.random() * ingressEdges.length)];
        const fromNode = currentNodes.find(n => n.id === ingressEdge.fromNodeId);
        const toNode = currentNodes.find(n => n.id === ingressEdge.toNodeId);

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
        setMetrics(m => ({
          ...m,
          totalSent: m.totalSent + newPackets.length,
        }));
      }
    }, intervalTime);

    return () => clearInterval(spawnInterval);
  }, [isRunning, hasEdges, speedMultiplier, isSpikeMode]);

  // Animation frame loop for smooth 60 FPS packet advancement & causal downstream hops
  useEffect(() => {
    if (!isRunning) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      const dt = Math.min(32, timestamp - lastTimestamp);
      lastTimestamp = timestamp;
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      setPackets(prev => {
        if (prev.length === 0) return prev;

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
            } else {
              deliveredCount++;
              if (Math.random() < 0.05) soundFx.playPacketDelivered();

              if (targetNode && prev.length + spawnedDownstream.length < 44) {
                const outEdges = findDownstreamEdges(targetNode.id, currentEdges);
                for (const outEdge of outEdges) {
                  const nextTarget = currentNodes.find(n => n.id === outEdge.toNodeId);
                  const activeIn = inboundCounts.get(outEdge.toNodeId) ?? 0;
                  const childPkt = createHopPacket(outEdge, targetNode, nextTarget, activeIn, isSpikeMode);
                  if (childPkt) {
                    spawnedDownstream.push(childPkt);
                    rpsCounterRef.current += 1;
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

        if (deliveredCount > 0 || errorCount > 0 || spawnedDownstream.length > 0) {
          setMetrics(m => ({
            ...m,
            totalSent: m.totalSent + spawnedDownstream.length,
            delivered: m.delivered + deliveredCount,
            errors: m.errors + errorCount,
          }));
        }

        const combined = [...updated, ...spawnedDownstream];
        return combined.length > 48 ? combined.slice(combined.length - 40) : combined;
      });

      const now = Date.now();
      if (now - lastRpsCalcTime.current >= 1000) {
        const elapsedSec = (now - lastRpsCalcTime.current) / 1000;
        const currentRps = Math.round(rpsCounterRef.current / elapsedSec);
        rpsCounterRef.current = 0;
        lastRpsCalcTime.current = now;

        const activeNodes = currentNodes.filter(n => n.status !== 'down');
        const avgLat = activeNodes.length > 0
          ? Math.round(
              activeNodes.reduce(
                (acc, n) => acc + calculateEffectiveLatency(n, isSpikeMode ? 3 : 1, isSpikeMode),
                0
              ) / activeNodes.length
            )
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
  }, [isRunning, speedMultiplier, isSpikeMode]);

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
