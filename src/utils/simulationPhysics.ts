import { GraphNode, GraphEdge, DataPacket } from '../types/graph';

/**
 * Pure Distributed Systems Simulation Physics & Resilience Engine.
 * Implements causal hop-by-hop packet propagation, Little's Law queueing backpressure,
 * and automatic Circuit Breaker state transitions (CLOSED -> OPEN -> HALF-OPEN -> CLOSED).
 */

export const DEFAULT_FAILURE_THRESHOLD = 5;
export const DEFAULT_COOLDOWN_MS = 6000;

/**
 * Identifies ingress edges where external requests enter the topology.
 * Prioritizes edges originating from 'client' nodes or nodes with zero incoming edges.
 * Falls back to all edges if the topology is a closed cycle with no root.
 */
export function findIngressEdges(nodes: GraphNode[], edges: GraphEdge[]): GraphEdge[] {
  if (edges.length === 0) return [];

  const incomingCount = new Map<string, number>();
  for (const node of nodes) {
    incomingCount.set(node.id, 0);
  }
  for (const edge of edges) {
    incomingCount.set(edge.toNodeId, (incomingCount.get(edge.toNodeId) ?? 0) + 1);
  }

  const rootNodeIds = new Set(
    nodes
      .filter(n => n.type === 'client' || (incomingCount.get(n.id) ?? 0) === 0)
      .map(n => n.id)
  );

  const ingressEdges = edges.filter(e => rootNodeIds.has(e.fromNodeId));
  return ingressEdges.length > 0 ? ingressEdges : edges;
}

/**
 * Returns all outgoing edges from a given node to drive causal hop-by-hop propagation.
 */
export function findDownstreamEdges(nodeId: string, edges: GraphEdge[]): GraphEdge[] {
  return edges.filter(e => e.fromNodeId === nodeId);
}

/**
 * Calculates effective node latency (ms) under queueing load (M/M/1 backpressure model).
 * As utilization ratio approaches or exceeds capacity (throughputRps), latency scales quadratically.
 */
export function calculateEffectiveLatency(
  node: GraphNode,
  activeInboundPackets: number,
  isSpikeMode = false
): number {
  const capacityRps = Math.max(50, node.throughputRps || 500);
  // Each active visual packet represents a batch of ~120 RPS (or ~300 RPS in spike mode)
  const simulatedInboundRps = activeInboundPackets * (isSpikeMode ? 300 : 120);
  const utilization = Math.min(2.5, simulatedInboundRps / capacityRps);

  const backpressureMultiplier = 1 + 2.5 * utilization * utilization;
  return Math.round(Math.max(1, node.latencyMs) * backpressureMultiplier);
}

/**
 * Evaluates deterministic Circuit Breaker state transitions:
 * - CLOSED -> OPEN: when consecutiveErrors >= failureThreshold
 * - OPEN -> HALF-OPEN: when elapsedSinceOpenMs >= cooldownMs
 * - HALF-OPEN -> CLOSED: when consecutiveErrors === 0 (probe succeeded)
 * - HALF-OPEN -> OPEN: when consecutiveErrors > 0 (probe failed)
 */
export function evaluateCircuitBreakerTransition(
  currentState: 'closed' | 'open' | 'half-open' = 'closed',
  consecutiveErrors: number,
  elapsedSinceStateChangeMs: number,
  failureThreshold = DEFAULT_FAILURE_THRESHOLD,
  cooldownMs = DEFAULT_COOLDOWN_MS
): 'closed' | 'open' | 'half-open' {
  if (currentState === 'closed') {
    if (consecutiveErrors >= failureThreshold) {
      return 'open';
    }
    return 'closed';
  }

  if (currentState === 'open') {
    if (elapsedSinceStateChangeMs >= cooldownMs) {
      return 'half-open';
    }
    return 'open';
  }

  // currentState === 'half-open'
  if (consecutiveErrors > 0) {
    return 'open';
  }
  return 'closed';
}

/**
 * Spawns a single causal data packet along a specific edge, incorporating
 * backpressure latency, overload error amplification, and circuit breaker fast-fail.
 */
export function createHopPacket(
  edge: GraphEdge,
  fromNode: GraphNode | undefined,
  toNode: GraphNode | undefined,
  activeInboundPackets = 0,
  isSpikeMode = false,
  randomFn: () => number = Math.random
): DataPacket | null {
  if (!fromNode || !toNode || fromNode.status === 'down' || toNode.status === 'down') {
    return null;
  }

  const effectiveToLatency = calculateEffectiveLatency(toNode, activeInboundPackets, isSpikeMode);
  const totalLatency = fromNode.latencyMs + effectiveToLatency + edge.latencyMs;
  const baseSpeed = Math.min(0.025, Math.max(0.005, 120 / Math.max(30, totalLatency)));

  // Overload penalty: if effective latency is >2.5x base latency, add backpressure error probability
  const overloadPenalty = effectiveToLatency > toNode.latencyMs * 2.5 ? 15 : 0;
  const combinedErrorRate = Math.min(
    100,
    Math.max(fromNode.errorRate, toNode.errorRate, edge.errorRate) + overloadPenalty
  );

  const isCircuitOpen = toNode.circuitBreaker === 'open';
  const isError = !isCircuitOpen && randomFn() * 100 < combinedErrorRate;

  const status: DataPacket['status'] = isCircuitOpen
    ? 'dlq'
    : isError
      ? 'error'
      : toNode.status === 'degraded' || overloadPenalty > 0
        ? 'warning'
        : 'success';

  return {
    id: `pkt-${Date.now()}-${randomFn().toString(36).substring(2, 7)}`,
    edgeId: edge.id,
    fromNodeId: edge.fromNodeId,
    toNodeId: edge.toNodeId,
    progress: 0,
    speed: baseSpeed,
    status,
    label: isCircuitOpen ? 'DLQ/Trip' : edge.protocol,
    createdAt: Date.now(),
  };
}
