import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../../types/graph';
import { useSimulation } from '../../hooks/useSimulation';
import { GraphCanvas } from '../Canvas/GraphCanvas';
import { CatalogItem } from '../../constants/nodeCatalog';
import { generateShareUrl } from '../../services/projectStorage';
import {
  Play,
  Pause,
  Zap,
  Volume2,
  VolumeX,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Cpu,
} from 'lucide-react';

interface EmbedViewProps {
  initialNodes: GraphNode[];
  initialEdges: GraphEdge[];
}

export const EmbedView: React.FC<EmbedViewProps> = ({
  initialNodes,
  initialEdges,
}) => {
  const [nodes, setNodes] = useState<GraphNode[]>(initialNodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.95);

  const {
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
  } = useSimulation(nodes, edges);

  const fullStudioUrl = generateShareUrl(nodes, edges);

  const handleSelectNode = (id: string | null) => {
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  };

  const handleSelectEdge = (id: string | null) => {
    setSelectedEdgeId(id);
    setSelectedNodeId(null);
  };

  const handleMoveNode = (id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const handleDeleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.fromNodeId !== id && e.toNodeId !== id));
  };

  const handleDeleteEdge = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
  };

  const handleAddEdge = (edge: GraphEdge) => {
    setEdges(prev => [...prev, edge]);
  };

  const handleAddNodeAt = (_item: CatalogItem, _x: number, _y: number) => {
    // Disabled in read-mostly embed
  };

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-dark-950 text-slate-100 font-sans select-none">
      {/* Floating Compact Toolbar (Glassmorphic) */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        {/* Left: Brand & Telemetry */}
        <div className="flex items-center gap-2 pointer-events-auto bg-dark-900/90 border border-slate-800/80 backdrop-blur-xl px-3 py-1.5 rounded-xl shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
              <Cpu className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-xs tracking-tight text-white">GraphFlow</span>
            <span className="text-[11px] font-mono px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 font-semibold">
              LIVE EMBED
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Telemetry pill */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isSpikeMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
              <span>{metrics.currentRps} RPS</span>
            </span>
            <span>•</span>
            <span className="text-slate-400">{metrics.avgLatencyMs}ms</span>
          </div>
        </div>

        {/* Right: Simulation Controls */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-dark-900/90 border border-slate-800/80 backdrop-blur-xl p-1.5 rounded-xl shadow-xl">
          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
              isRunning ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950' : 'bg-emerald-600 text-white'
            }`}
            title={isRunning ? 'Pause' : 'Play'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-dark-950 rounded-lg p-0.5 border border-slate-800 text-[11px] font-mono font-semibold">
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  speedMultiplier === s ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Spike */}
          <button
            onClick={triggerSpike}
            disabled={isSpikeMode}
            className={`h-7 px-2 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
              isSpikeMode
                ? 'bg-amber-500 text-slate-950 animate-pulse'
                : 'bg-dark-950 border border-slate-800 text-slate-300 hover:border-amber-500/40 hover:text-amber-400'
            }`}
            title="Inject Traffic Spike (DDoS Mode)"
          >
            <Zap className="w-3 h-3 text-amber-400" />
            <span className="hidden md:inline">Spike</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200 flex items-center justify-center"
            title="Toggle Sound Synthesizer"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
          </button>

          <div className="h-4 w-px bg-slate-800 mx-0.5" />

          {/* Zoom */}
          <button
            onClick={() => setZoom(z => Math.min(2.5, z * 1.2))}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200 flex items-center justify-center"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(0.3, z / 1.2))}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200 flex items-center justify-center"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(0.95);
              setPan({ x: 0, y: 0 });
            }}
            className="w-7 h-7 rounded-lg border border-slate-800 bg-dark-950 text-slate-400 hover:text-slate-200 flex items-center justify-center"
            title="Reset View"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="flex-1 relative w-full h-full">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          packets={packets}
          pan={pan}
          zoom={zoom}
          setPan={setPan}
          setZoom={setZoom}
          onSelectNode={handleSelectNode}
          onSelectEdge={handleSelectEdge}
          onMoveNode={handleMoveNode}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
          onAddEdge={handleAddEdge}
          onAddNodeAt={handleAddNodeAt}
        />
      </div>

      {/* Viral Floating Watermark Pill (Bottom Right) */}
      <div className="absolute bottom-3 right-3 z-30 pointer-events-auto">
        <a
          href={fullStudioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-900/90 border border-cyan-500/40 hover:border-cyan-400 shadow-xl shadow-cyan-950/50 backdrop-blur-xl transition-all hover:scale-105"
        >
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white">
            Powered by <strong className="text-cyan-400">GraphFlow</strong>
          </span>
          <span className="text-[11px] text-slate-400 group-hover:text-cyan-300 flex items-center gap-0.5">
            <span>Open Studio</span>
            <ExternalLink className="w-3 h-3" />
          </span>
        </a>
      </div>
    </div>
  );
};
