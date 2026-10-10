import React from 'react';
import { GraphNode, GraphEdge, NodeStatus, ProtocolType } from '../../types/graph';
import { NodeIcon } from '../Common/NodeIcon';
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

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedNode,
  selectedEdge,
  nodes,
  edges,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
}) => {
  return (
    <div
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

            {/* Quick Keyboard Shortcuts Reference */}
            <div className="p-3 rounded-xl bg-dark-950/60 border border-slate-800/80 space-y-2 text-[11px]">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Keyboard Shortcuts
              </div>
              <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span>Undo / Redo:</span>
                  <span className="text-slate-200">Ctrl+Z / Ctrl+Y</span>
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
