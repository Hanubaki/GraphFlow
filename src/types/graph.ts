export type NodeType =
  | 'client'
  | 'gateway'
  | 'service'
  | 'database'
  | 'cache'
  | 'queue'
  | 'serverless'
  | 'storage'
  | 'external';

export type NodeStatus = 'healthy' | 'degraded' | 'down';

export type ProtocolType = 'HTTP/REST' | 'gRPC' | 'WebSocket' | 'Kafka' | 'TCP' | 'SQL Query';

export interface Port {
  id: string;
  nodeId: string;
  type: 'input' | 'output';
  label?: string;
}

export interface GraphNode {
  id: string;
  type: NodeType;
  title: string;
  subtitle: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: NodeStatus;
  latencyMs: number;
  errorRate: number; // 0 to 100 percentage
  throughputRps: number;
  notes?: string;
  color: string;
  iconName: string;
}

export interface GraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  protocol: ProtocolType;
  latencyMs: number;
  errorRate: number; // 0 to 100 percentage
  label?: string;
}

export interface DataPacket {
  id: string;
  edgeId: string;
  fromNodeId: string;
  toNodeId: string;
  progress: number; // 0.0 to 1.0 along the bezier curve
  speed: number;    // increment per frame
  status: 'success' | 'warning' | 'error';
  label: string;
  createdAt: number;
}

export interface SimulationMetrics {
  totalSent: number;
  delivered: number;
  errors: number;
  currentRps: number;
  avgLatencyMs: number;
}

export interface SimulationState {
  isRunning: boolean;
  speedMultiplier: number;
  isSpikeMode: boolean;
  soundEnabled: boolean;
  metrics: SimulationMetrics;
}

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface Command {
  name: string;
  execute: () => void;
  undo: () => void;
}
