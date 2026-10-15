import React, { useMemo, useState } from 'react';
import { GraphNode, GraphEdge, NodeStatus, ProtocolType } from '../../types/graph';
import { NodeIcon } from '../Common/NodeIcon';
import {
  analyzeTopologyDiagnostics,
  generateIncidentPostMortemMarkdown,
  compareTopologyWithBaseline,
  evaluateChaosResilienceAudit,
  TopologyDiagnostics,
} from '../../utils/simulationPhysics';
import { useSimulationControls } from '../../context/SimulationContext';
import {
  Sliders,
  Trash2,
  Activity,
  Layers,
  Info,
  Clock,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Copy,
  Check,
  GitCompare,
} from 'lucide-react';

interface InspectorPanelProps {
  selectedNode: GraphNode | null;
  selectedEdge: GraphEdge | null;
  nodes: GraphNode[];
  edges: GraphEdge[];
  onUpdateNode: (id: string, updates: Partial<GraphNode>) => void;
  onUpdateEdge: (id: string, updates: Partial<GraphEdge>) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onAutoHarden?: () => void;
  onAutoLayout?: () => void;
}

const ACCENT_COLORS = [
  { name: 'Sky', hex: '#38bdf8' },
  { name: 'Cyan', hex: '#0ea5e9' },
  { name: 'Indigo', hex: '#818cf8' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
];

const PROTOCOLS: ProtocolType[] = [
  'HTTP/REST',
  'gRPC',
  'WebSocket',
  'Kafka',
  'TCP',
  'SQL Query',
];

const CLOUD_STACK_LABELS: Record<'aws' | 'gcp' | 'azure', string> = {
  aws: 'ECS Fargate · RDS Multi-AZ · ElastiCache · MSK',
  gcp: 'Cloud Run · Cloud SQL HA · Memorystore · Pub/Sub',
  azure: 'Container Apps · Azure DB · Redis Cache · Event Hubs',
};

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onAutoHarden,
  onAutoLayout,
}) => {
  const diagnostics = useMemo(() => analyzeTopologyDiagnostics(nodes, edges), [nodes, edges]);
  const chaosAudit = useMemo(() => evaluateChaosResilienceAudit(nodes, edges), [nodes, edges]);
  const [cloudProvider, setCloudProvider] = useState<'aws' | 'gcp' | 'azure'>('aws');
  const [copiedPostMortem, setCopiedPostMortem] = useState(false);
  const [pinnedBaseline, setPinnedBaseline] = useState<TopologyDiagnostics | null>(null);
  const [copiedProposal, setCopiedProposal] = useState(false);
  const [showAuditFindings, setShowAuditFindings] = useState(false);

  const baselineDiff = useMemo(
    () => (pinnedBaseline ? compareTopologyWithBaseline(pinnedBaseline, diagnostics) : null),
    [pinnedBaseline, diagnostics]
  );

  let simControls = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    simControls = useSimulationControls();
  } catch {
    // Mounted outside SimulationProvider in standalone unit tests
  }

  const incidents = simControls?.incidents ?? [];
  const trafficLoadMultiplier = simControls?.trafficLoadMultiplier ?? 1;
  const metrics = simControls?.metrics ?? {
    totalSent: 0,
    delivered: 0,
    errors: 0,
    currentRps: 0,
    avgLatencyMs: 24,
  };

  const handleCopyPostMortem = () => {
    const md = generateIncidentPostMortemMarkdown(
      nodes,
      edges,
      incidents,
      metrics,
      trafficLoadMultiplier
    );
    navigator.clipboard?.writeText(md);
    setCopiedPostMortem(true);
    setTimeout(() => setCopiedPostMortem(false), 2000);
  };

  const handleCopyProposal = () => {
    if (!baselineDiff) return;
    navigator.clipboard?.writeText(baselineDiff.proposalMarkdown);
    setCopiedProposal(true);
    setTimeout(() => setCopiedProposal(false), 2000);
  };

  const handleRunChaosAudit = () => {
    setShowAuditFindings(true);
    simControls?.triggerSpike();
  };

  return (
    <div
      data-tour="inspector"
      className={`${
        selectedNode || selectedEdge ? 'flex' : 'hidden md:flex'
      } absolute inset-x-0 bottom-0 max-h-[55vh] w-full rounded-t-2xl border-t md:relative md:inset-auto md:max-h-none md:w-80 md:h-full md:rounded-none md:border-t-0 md:border-l bg-dark-900/95 border-slate-800 backdrop-blur-xl flex-col z-30 md:z-20 overflow-y-auto shadow-2xl md:shadow-none`}
    >
      {/* Panel Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            {selectedNode ? 'Service Inspector' : selectedEdge ? 'Connection Inspector' : 'System Overview'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* NODE INSPECTOR */}
        {selectedNode && (
          <div className="space-y-4">
            {/* Header info card */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-950/80 border border-slate-800">
              <div
                className="p-2.5 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${selectedNode.color}25`, color: selectedNode.color }}
              >
                <NodeIcon name={selectedNode.iconName} className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={selectedNode.title}
                  onChange={e => onUpdateNode(selectedNode.id, { title: e.target.value })}
                  className="w-full bg-transparent font-semibold text-sm text-slate-100 border-b border-transparent hover:border-slate-700 focus:border-cyan-400 focus:outline-none transition-colors"
                />
                <input
                  type="text"
                  value={selectedNode.subtitle}
                  onChange={e => onUpdateNode(selectedNode.id, { subtitle: e.target.value })}
                  className="w-full bg-transparent text-xs text-slate-400 border-b border-transparent hover:border-slate-700 focus:border-cyan-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Health Status Buttons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Operational Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['healthy', 'degraded', 'down'] as NodeStatus[]).map(status => {
                  const isActive = selectedNode.status === status;
                  const config = {
                    healthy: { label: 'Healthy', active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
                    degraded: { label: 'Degraded', active: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
                    down: { label: 'Down', active: 'bg-rose-500/20 text-rose-400 border-rose-500/50' },
                  }[status];

                  return (
                    <button
                      key={status}
                      onClick={() => onUpdateNode(selectedNode.id, { status })}
                      className={`h-8 rounded-lg border text-xs font-semibold capitalize flex items-center justify-center transition-all ${
                        isActive
                          ? config.active
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Circuit Breaker Resilience */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Circuit Breaker
                </span>
                <span className="font-mono text-[11px] text-slate-400 uppercase">
                  {selectedNode.circuitBreaker || 'closed'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(['closed', 'half-open', 'open'] as const).map(cb => {
                  const isActive = (selectedNode.circuitBreaker || 'closed') === cb;
                  const config = {
                    closed: { label: 'Closed (Pass)', active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
                    'half-open': { label: 'Half-Open', active: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
                    open: { label: 'Open (Trip)', active: 'bg-rose-500/20 text-rose-400 border-rose-500/50' },
                  }[cb];

                  return (
                    <button
                      key={cb}
                      onClick={() => onUpdateNode(selectedNode.id, { circuitBreaker: cb })}
                      className={`h-7 rounded-lg border text-[11px] font-semibold flex items-center justify-center transition-all ${
                        isActive
                          ? config.active
                          : 'bg-dark-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Processing Latency Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Service Latency
                </span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedNode.latencyMs} ms</span>
              </div>
              <input
                type="range"
                min="1"
                max="500"
                value={selectedNode.latencyMs}
                onChange={e => onUpdateNode(selectedNode.id, { latencyMs: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Error Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Error Rate
                </span>
                <span className="font-mono text-rose-400 font-semibold">{selectedNode.errorRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={selectedNode.errorRate}
                onChange={e => onUpdateNode(selectedNode.id, { errorRate: Number(e.target.value) })}
                className="w-full accent-rose-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Throughput Capacity (RPS) */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Throughput Capacity
                </span>
                <span className="font-mono text-amber-400 font-semibold">{selectedNode.throughputRps} rps</span>
              </div>
              <input
                type="range"
                min="10"
                max="5000"
                step="25"
                value={selectedNode.throughputRps}
                onChange={e => onUpdateNode(selectedNode.id, { throughputRps: Number(e.target.value) })}
                className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Accent Color Palette */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Accent Theme
              </label>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.name}
                    onClick={() => onUpdateNode(selectedNode.id, { color: c.hex })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                      selectedNode.color === c.hex ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Notes / Documentation Field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Architecture Notes
              </label>
              <textarea
                value={selectedNode.notes || ''}
                onChange={e => onUpdateNode(selectedNode.id, { notes: e.target.value })}
                placeholder="Add service architecture documentation, deployment specs, or SLA goals..."
                rows={3}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors resize-none"
              />
            </div>

            {/* Danger Zone: Delete Node */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onDeleteNode(selectedNode.id)}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-400 hover:bg-rose-900/30 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Component
              </button>
            </div>
          </div>
        )}

        {/* EDGE INSPECTOR */}
        {selectedEdge && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-dark-950/80 border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400">Connection Pipeline</div>
              <div className="text-sm font-semibold text-cyan-400">
                {nodes.find(n => n.id === selectedEdge.fromNodeId)?.title} → {nodes.find(n => n.id === selectedEdge.toNodeId)?.title}
              </div>
            </div>

            {/* Protocol Selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Transport Protocol
              </label>
              <select
                value={selectedEdge.protocol}
                onChange={e => onUpdateEdge(selectedEdge.id, { protocol: e.target.value as ProtocolType })}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors"
              >
                {PROTOCOLS.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Label / Route */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Route / Channel Label
              </label>
              <input
                type="text"
                value={selectedEdge.label || ''}
                onChange={e => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
                placeholder="e.g. /api/v1/orders or topic:events"
                className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Edge Latency */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  Network Latency
                </span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedEdge.latencyMs} ms</span>
              </div>
              <input
                type="range"
                min="1"
                max="250"
                value={selectedEdge.latencyMs}
                onChange={e => onUpdateEdge(selectedEdge.id, { latencyMs: Number(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Edge Packet Loss / Error Rate */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Packet Loss Rate
                </span>
                <span className="font-mono text-rose-400 font-semibold">{selectedEdge.errorRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={selectedEdge.errorRate}
                onChange={e => onUpdateEdge(selectedEdge.id, { errorRate: Number(e.target.value) })}
                className="w-full accent-rose-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Delete Connection */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onDeleteEdge(selectedEdge.id)}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-400 hover:bg-rose-900/30 text-xs font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Connection
              </button>
            </div>
          </div>
        )}

        {/* DEFAULT OVERVIEW (Nothing selected) */}
        {!selectedNode && !selectedEdge && (
          <div className="space-y-4">
            <div className="text-center py-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/50 border border-cyan-800/40 text-cyan-400 mx-auto flex items-center justify-center mb-2">
                <Activity className="w-6 h-6" />
              </div>
              <div className="text-xs font-semibold text-slate-200">System Topology Active</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Click any component or pipeline to inspect</div>
            </div>

            {/* Topology Statistics */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-950 border border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Total Services
                </span>
                <span className="font-mono font-bold text-slate-200">{nodes.length}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-950 border border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Active Pipelines
                </span>
                <span className="font-mono font-bold text-slate-200">{edges.length}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-dark-950 border border-slate-800 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Cluster Health
                </span>
                <span className="font-mono text-emerald-400 font-medium">
                  {nodes.filter(n => n.status === 'healthy').length}/{nodes.length} Optimal
                </span>
              </div>
            </div>

            {/* Automated Engineering Diagnostics (Critical Path, Tail Latency, FinOps Cost, Bottleneck, SLA, SPOF) */}
            <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Engineering Diagnostics
                </span>
                <span className="font-mono text-[11px] text-emerald-400 font-semibold">
                  SLA {diagnostics.compositeSlaPercent}%
                </span>
              </div>

              <div className="space-y-1 pt-1 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Critical Path (p50)</span>
                  <span className="font-mono font-bold text-cyan-400">
                    {diagnostics.criticalPathLatencyMs} ms
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>p95: <strong className="text-slate-200">{diagnostics.p95LatencyMs}ms</strong></span>
                  <span>p99: <strong className="text-amber-300">{diagnostics.p99LatencyMs}ms</strong></span>
                </div>
                {diagnostics.criticalPathTitles.length > 0 && (
                  <div className="text-[11px] font-mono text-slate-400 truncate" title={diagnostics.criticalPathTitles.join(' → ')}>
                    {diagnostics.criticalPathTitles.join(' → ')}
                  </div>
                )}
              </div>

              {diagnostics.bottleneckNode && (
                <div className="space-y-0.5 pt-1.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Primary Bottleneck</span>
                    <span className="font-mono font-bold text-amber-400">
                      {diagnostics.bottleneckNode.effectiveCapacityRps} RPS cap
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 truncate">
                    {diagnostics.bottleneckNode.title} (fan-in: {diagnostics.bottleneckNode.inboundFanIn})
                  </div>
                </div>
              )}

              {/* Multi-Cloud FinOps Cost Selector (AWS / GCP / Azure) */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Multi-Cloud FinOps</span>
                  <div className="flex items-center gap-0.5 rounded bg-slate-900 p-0.5 border border-slate-800">
                    {(['aws', 'gcp', 'azure'] as const).map(provider => (
                      <button
                        key={provider}
                        type="button"
                        onClick={() => setCloudProvider(provider)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                          cloudProvider === provider
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {provider}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[165px]" title={CLOUD_STACK_LABELS[cloudProvider]}>
                    {CLOUD_STACK_LABELS[cloudProvider]}
                  </span>
                  <span className="font-mono font-bold text-emerald-400">
                    ~${diagnostics.cloudCostsUsd[cloudProvider]}/mo
                  </span>
                </div>
              </div>

              {/* Baseline vs. Proposed Architecture Diff & ROI Calculator */}
              <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-semibold flex items-center gap-1">
                    <GitCompare className="w-3 h-3 text-cyan-400" />
                    Before / After Diff
                  </span>
                  <button
                    type="button"
                    onClick={() => setPinnedBaseline(pinnedBaseline ? null : diagnostics)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border transition-colors ${
                      pinnedBaseline
                        ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/25'
                    }`}
                    title="Pin current architecture metrics as Baseline, then modify nodes/caches to compare ROI & latency improvements"
                  >
                    {pinnedBaseline ? 'Reset Baseline' : 'Pin Baseline'}
                  </button>
                </div>

                {baselineDiff && (
                  <div className="p-2 rounded-lg bg-slate-900/90 border border-cyan-500/30 space-y-1.5 text-[10px] font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">p99 Tail Latency:</span>
                      <span
                        className={`font-bold ${
                          baselineDiff.p99LatencyDeltaMs <= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {baselineDiff.p99LatencyDeltaMs > 0 ? `+${baselineDiff.p99LatencyDeltaMs}` : baselineDiff.p99LatencyDeltaMs}ms ({baselineDiff.p99LatencyDeltaPct > 0 ? `+${baselineDiff.p99LatencyDeltaPct}` : baselineDiff.p99LatencyDeltaPct}%)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Composite SLA:</span>
                      <span
                        className={`font-bold ${
                          baselineDiff.slaDeltaPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {baselineDiff.slaDeltaPct >= 0 ? `+${baselineDiff.slaDeltaPct}` : baselineDiff.slaDeltaPct}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Max Throughput:</span>
                      <span className="font-bold text-cyan-300">
                        {baselineDiff.bottleneckMultiplier}x ({baselineDiff.bottleneckRpsDelta >= 0 ? `+${baselineDiff.bottleneckRpsDelta}` : baselineDiff.bottleneckRpsDelta} RPS)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">AWS Cost Delta:</span>
                      <span className="font-bold text-slate-200">
                        {baselineDiff.awsCostDeltaUsd >= 0 ? `+$${baselineDiff.awsCostDeltaUsd}` : `-$${Math.abs(baselineDiff.awsCostDeltaUsd)}`}/mo
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyProposal}
                      className="w-full mt-1 h-6 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-sans font-semibold text-[10px] flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedProposal ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">Copied ROI Proposal MD</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Executive ROI Proposal</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {diagnostics.spofWarnings.length > 0 && (
                <div className="space-y-1.5 pt-1.5 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      Topology Risk Advisories
                    </div>
                  </div>
                  {diagnostics.spofWarnings.map((warn, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 leading-snug pl-2 border-l border-amber-500/40">
                      {warn}
                    </div>
                  ))}
                  {onAutoHarden && (
                    <button
                      onClick={onAutoHarden}
                      className="w-full mt-1 h-7 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Auto-Harden Risks & Breakers
                    </button>
                  )}
                </div>
              )}

              {onAutoLayout && nodes.length > 1 && (
                <div className="pt-1.5 border-t border-slate-800/80">
                  <button
                    onClick={onAutoLayout}
                    className="w-full h-7 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Auto-Align Architecture DAG
                  </button>
                </div>
              )}
            </div>

            {/* Automated Chaos & Load Resilience Scorecard */}
            <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Resilience Audit Grade
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
                    chaosAudit.grade.startsWith('A')
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : chaosAudit.grade === 'B'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  Grade {chaosAudit.grade} ({chaosAudit.score}/100)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400">Max Safe Load</div>
                  <div className="text-slate-100 font-bold">{chaosAudit.maxSafeRps} RPS</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900/90 border border-slate-800">
                  <div className="text-slate-400">Breaker Coverage</div>
                  <div className="text-emerald-400 font-bold">{chaosAudit.breakerCoveragePct}%</div>
                </div>
              </div>

              {showAuditFindings && (
                <div className="space-y-1 pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-300">
                  {chaosAudit.findings.map((finding, idx) => (
                    <div key={idx} className="leading-snug pl-2 border-l border-cyan-500/40">
                      {finding}
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleRunChaosAudit}
                className="w-full h-7 px-2.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Run 3x Chaos & Stress Audit
              </button>
            </div>

            {/* Live SRE Chaos & Incident Post-Mortem Log */}
            <div className="p-3 rounded-xl bg-dark-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  SRE Post-Mortem Log
                </span>
                <button
                  type="button"
                  onClick={handleCopyPostMortem}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono text-cyan-300 transition-colors"
                  title="Copy full SRE Incident Post-Mortem Markdown report to clipboard"
                >
                  {copiedPostMortem ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-300">Copied MD</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Report</span>
                    </>
                  )}
                </button>
              </div>

              {incidents.length === 0 ? (
                <div className="text-[11px] text-slate-400 font-mono py-1.5 leading-relaxed">
                  No circuit trips or outages recorded yet. Inject a <strong className="text-slate-200">Spike</strong> or <strong className="text-slate-200">Kill</strong> a node to log chaos events.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {incidents.slice(0, 6).map(inc => {
                    const badgeStyle =
                      inc.severity === 'critical'
                        ? 'text-rose-400 border-rose-500/40 bg-rose-950/30'
                        : inc.severity === 'recovery'
                          ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30'
                          : 'text-amber-400 border-amber-500/40 bg-amber-950/30';
                    return (
                      <div
                        key={inc.id}
                        className={`p-1.5 rounded border text-[10px] font-mono leading-snug ${badgeStyle}`}
                      >
                        <div className="flex items-center justify-between opacity-80 mb-0.5">
                          <span className="font-bold truncate">{inc.nodeTitle}</span>
                          <span>{inc.timeLabel}</span>
                        </div>
                        <div className="text-slate-200">{inc.message}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Keyboard Shortcuts Reference */}
            <div className="p-3 rounded-xl bg-dark-950/60 border border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Keyboard Shortcuts
              </div>
              <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Command Palette:</span>
                  <span className="text-cyan-300 font-bold">Ctrl+K / Cmd+K</span>
                </div>
                <div className="flex justify-between">
                  <span>Undo / Redo:</span>
                  <span className="text-slate-200">Ctrl+Z / Ctrl+Y</span>
                </div>
                <div className="flex justify-between">
                  <span>Duplicate Node:</span>
                  <span className="text-slate-200">Ctrl+D</span>
                </div>
                <div className="flex justify-between">
                  <span>Delete Selected:</span>
                  <span className="text-slate-200">Del / Backspace</span>
                </div>
                <div className="flex justify-between">
                  <span>Pan Canvas:</span>
                  <span className="text-slate-200">Drag background</span>
                </div>
                <div className="flex justify-between">
                  <span>Connect Nodes:</span>
                  <span className="text-slate-200">Drag right port</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
