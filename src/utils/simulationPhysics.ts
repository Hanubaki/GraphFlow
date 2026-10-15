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

export interface TopologyDiagnostics {
  criticalPathLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  estimatedMonthlyCostUsd: number;
  criticalPathTitles: string[];
  bottleneckNode: {
    id: string;
    title: string;
    effectiveCapacityRps: number;
    inboundFanIn: number;
  } | null;
  compositeSlaPercent: number;
  spofWarnings: string[];
}

/**
 * Computes static & dynamic engineering diagnostics for an architecture topology:
 * - End-to-end critical path latency (p50, p95, p99)
 * - Primary throughput bottleneck (accounting for fan-in amplification)
 * - Estimated monthly AWS cloud infrastructure cost ($/mo)
 * - Composite serial/pipeline SLA availability percentage
 * - Single Point of Failure (SPOF) & resilience warnings
 */
export function analyzeTopologyDiagnostics(
  nodes: GraphNode[],
  edges: GraphEdge[]
): TopologyDiagnostics {
  if (nodes.length === 0) {
    return {
      criticalPathLatencyMs: 0,
      p95LatencyMs: 0,
      p99LatencyMs: 0,
      estimatedMonthlyCostUsd: 0,
      criticalPathTitles: [],
      bottleneckNode: null,
      compositeSlaPercent: 100,
      spofWarnings: [],
    };
  }

  const nodeMap = new Map<string, GraphNode>();
  const inboundCount = new Map<string, number>();
  const outboundEdges = new Map<string, GraphEdge[]>();

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    inboundCount.set(n.id, 0);
    outboundEdges.set(n.id, []);
  }

  for (const e of edges) {
    if (!nodeMap.has(e.fromNodeId) || !nodeMap.has(e.toNodeId)) continue;
    inboundCount.set(e.toNodeId, (inboundCount.get(e.toNodeId) ?? 0) + 1);
    outboundEdges.get(e.fromNodeId)?.push(e);
  }

  // 1. Critical Path DFS (longest latency chain with cycle guard)
  const roots = nodes.filter(
    n => n.type === 'client' || (inboundCount.get(n.id) ?? 0) === 0
  );
  const startNodes = roots.length > 0 ? roots : [nodes[0]];

  let maxLatency = 0;
  let bestPath: string[] = [];

  const dfs = (nodeId: string, visited: Set<string>, accLatency: number, pathTitles: string[]) => {
    const node = nodeMap.get(nodeId);
    if (!node) return;

    const currentLatency = accLatency + Math.max(0, node.latencyMs);
    const nextPath = [...pathTitles, node.title];
    const outs = outboundEdges.get(nodeId) ?? [];

    let advanced = false;
    for (const edge of outs) {
      if (!visited.has(edge.toNodeId) && nodeMap.has(edge.toNodeId)) {
        advanced = true;
        visited.add(edge.toNodeId);
        dfs(edge.toNodeId, visited, currentLatency + Math.max(0, edge.latencyMs), nextPath);
        visited.delete(edge.toNodeId);
      }
    }

    if (!advanced && currentLatency >= maxLatency) {
      maxLatency = currentLatency;
      bestPath = nextPath;
    }
  };

  for (const root of startNodes) {
    dfs(root.id, new Set([root.id]), 0, []);
  }

  // 2. Primary Throughput Bottleneck (lowest effective RPS ceiling among backend/infra nodes)
  const infraCandidates = nodes.filter(n => n.type !== 'client');
  const candidatePool = infraCandidates.length > 0 ? infraCandidates : nodes;

  let bottleneckNode: TopologyDiagnostics['bottleneckNode'] = null;
  for (const n of candidatePool) {
    const fanIn = Math.max(1, inboundCount.get(n.id) ?? 1);
    const effectiveCap = Math.round(Math.max(1, n.throughputRps) / fanIn);
    if (!bottleneckNode || effectiveCap < bottleneckNode.effectiveCapacityRps) {
      bottleneckNode = {
        id: n.id,
        title: n.title,
        effectiveCapacityRps: effectiveCap,
        inboundFanIn: inboundCount.get(n.id) ?? 0,
      };
    }
  }

  // 3. Composite SLA Percentage across active nodes & edges
  let reliabilityProduct = 1.0;
  for (const n of nodes) {
    if (n.status === 'down') {
      reliabilityProduct *= 0;
    } else {
      const errProb = Math.min(1, Math.max(0, n.errorRate) / 100);
      reliabilityProduct *= 1 - errProb * 0.25;
    }
  }
  for (const e of edges) {
    const edgeErrProb = Math.min(1, Math.max(0, e.errorRate) / 100);
    reliabilityProduct *= 1 - edgeErrProb * 0.25;
  }
  const compositeSlaPercent = Number((reliabilityProduct * 100).toFixed(2));

  // 4. SPOF & Resilience Warnings
  const spofWarnings: string[] = [];
  for (const n of nodes) {
    const fanIn = inboundCount.get(n.id) ?? 0;
    const fanOut = (outboundEdges.get(n.id) ?? []).length;
    if (n.status === 'down') {
      spofWarnings.push(`${n.title} is DOWN (blocks ${fanIn} inbound pipeline${fanIn === 1 ? '' : 's'})`);
    } else if (n.type === 'external' && !n.circuitBreaker && fanIn > 0) {
      spofWarnings.push(`${n.title}: 3rd-party dependency without Circuit Breaker protection`);
    } else if (fanIn >= 2 && fanOut >= 1 && n.throughputRps < 600) {
      spofWarnings.push(`${n.title}: High fan-in (${fanIn}x) with low RPS ceiling (${n.throughputRps} RPS)`);
    } else if (n.errorRate >= 5 && (!n.circuitBreaker || n.circuitBreaker === 'closed')) {
      spofWarnings.push(`${n.title}: Elevated error rate (${n.errorRate}%) can cascade upstream`);
    }
  }

  // 5. Tail Latency (p95 / p99) & FinOps Monthly Cloud Cost Estimate ($/mo)
  const p95LatencyMs = Math.round(maxLatency * 1.45);
  const p99LatencyMs = Math.round(maxLatency * 2.15);

  let estimatedMonthlyCostUsd = 0;
  for (const n of nodes) {
    const rps = Math.max(50, n.throughputRps || 500);
    if (n.type === 'database') {
      estimatedMonthlyCostUsd += 85 + Math.round((rps / 500) * 18);
    } else if (n.type === 'cache') {
      estimatedMonthlyCostUsd += 45 + Math.round((rps / 1000) * 12);
    } else if (n.type === 'queue') {
      estimatedMonthlyCostUsd += 60 + Math.round((rps / 1000) * 10);
    } else if (n.type === 'gateway') {
      estimatedMonthlyCostUsd += 28 + Math.round((rps / 1000) * 6);
    } else if (n.type === 'storage') {
      estimatedMonthlyCostUsd += 24;
    } else if (n.type === 'serverless') {
      estimatedMonthlyCostUsd += 14 + Math.round((rps / 1000) * 5);
    } else if (n.type === 'service') {
      const replicas = Math.max(2, Math.min(12, Math.ceil(rps / 400)));
      estimatedMonthlyCostUsd += replicas * 18;
    }
  }

  return {
    criticalPathLatencyMs: maxLatency,
    p95LatencyMs,
    p99LatencyMs,
    estimatedMonthlyCostUsd,
    criticalPathTitles: bestPath,
    bottleneckNode,
    compositeSlaPercent,
    spofWarnings: spofWarnings.slice(0, 4),
  };
}

/**
 * One-click Auto-Harden remediation: resolves SPOF warnings, enables Circuit Breakers
 * on vulnerable downstream nodes, restores degraded/down nodes, and scales bottleneck RPS.
 */
export function autoHardenTopology(nodes: GraphNode[], edges: GraphEdge[]): GraphNode[] {
  const inboundCount = new Map<string, number>();
  for (const e of edges) {
    inboundCount.set(e.toNodeId, (inboundCount.get(e.toNodeId) ?? 0) + 1);
  }

  return nodes.map(n => {
    const fanIn = inboundCount.get(n.id) ?? 0;
    const minRecommendedRps = n.type === 'client' ? n.throughputRps : Math.max(n.throughputRps, Math.max(800, fanIn * 450));
    const needsBreaker = n.type !== 'client';
    return {
      ...n,
      status: 'healthy',
      circuitBreaker: needsBreaker ? 'closed' : n.circuitBreaker,
      throughputRps: minRecommendedRps,
      errorRate: n.errorRate > 1 ? 0.2 : n.errorRate,
    };
  });
}

/**
 * One-click Architectural DAG Auto-Layout: organizes nodes left-to-right by architectural tier
 * with clean 10px grid snapping and non-overlapping vertical distribution.
 */
export function autoLayoutTopology(nodes: GraphNode[]): GraphNode[] {
  const tierOrder: Record<GraphNode['type'], number> = {
    client: 0,
    gateway: 1,
    service: 2,
    serverless: 2,
    cache: 3,
    queue: 3,
    database: 4,
    storage: 4,
    external: 4,
  };

  const columns = new Map<number, GraphNode[]>();
  for (const n of nodes) {
    const col = tierOrder[n.type] ?? 2;
    if (!columns.has(col)) columns.set(col, []);
    columns.get(col)!.push(n);
  }

  const sortedCols = Array.from(columns.keys()).sort((a, b) => a - b);
  const startX = 80;
  const colSpacing = 270;
  const rowSpacing = 140;
  const centerY = 300;

  const updatedPositions = new Map<string, { x: number; y: number }>();

  sortedCols.forEach((colKey, colIndex) => {
    const group = columns.get(colKey)!;
    const totalHeight = (group.length - 1) * rowSpacing;
    const topY = centerY - totalHeight / 2;

    group.forEach((node, rowIndex) => {
      const rawX = startX + colIndex * colSpacing;
      const rawY = Math.max(60, topY + rowIndex * rowSpacing);
      updatedPositions.set(node.id, {
        x: Math.round(rawX / 10) * 10,
        y: Math.round(rawY / 10) * 10,
      });
    });
  });

  return nodes.map(n => {
    const pos = updatedPositions.get(n.id);
    return pos ? { ...n, x: pos.x, y: pos.y } : n;
  });
}


