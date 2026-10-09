import React from 'react';
import { SimulationMetrics } from '../../types/graph';
import {
  Play,
  Pause,
  Zap,
  Volume2,
  VolumeX,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  LayoutTemplate,
  Share2,
  Trash2,
  Cpu,
  Sparkles,
  FolderKanban,
  Crown,
  Code2,
} from 'lucide-react';

interface TopBarProps {
  isRunning: boolean;
  speedMultiplier: number;
  isSpikeMode: boolean;
  soundEnabled: boolean;
  metrics: SimulationMetrics;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onTogglePlay: () => void;
  onSetSpeed: (speed: number) => void;
  onTriggerSpike: () => void;
  onToggleSound: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenTemplates: () => void;
  onOpenExport: () => void;
  onOpenEmbed: () => void;
  onOpenAiGenerator: () => void;
  onOpenProjects: () => void;
  onOpenPricing: () => void;
  onOpenHome?: () => void;
  onClearGraph: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isRunning,
  speedMultiplier,
  isSpikeMode,
  soundEnabled,
  metrics,
  canUndo,
  canRedo,
  zoom,
  onTogglePlay,
  onSetSpeed,
  onTriggerSpike,
  onToggleSound,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenTemplates,
  onOpenExport,
  onOpenEmbed,
  onOpenAiGenerator,
  onOpenProjects,
  onOpenPricing,
  onOpenHome,
  onClearGraph,
}) => {
  return (
    <header className="h-14 bg-dark-900/95 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between px-3 md:px-4 z-30 select-none gap-2">
      {/* Brand Logo & Title */}
      <button
        onClick={onOpenHome}
        className="flex items-center gap-2.5 shrink-0 text-left hover:opacity-90 transition-opacity"
        title="Return to Home / Landing Page"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.35)] shrink-0">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-bold text-sm text-slate-100 tracking-tight">GraphFlow</span>
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 font-semibold">
              SIM
            </span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight mt-0.5">Architecture & Flow Engine</div>
        </div>
      </button>

      {/* Center: Live Telemetry Metrics */}
      <div className="hidden xl:flex items-center gap-2 font-mono text-xs">
        {/* Status indicator */}
        <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-dark-950 border border-slate-800">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              isRunning ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-semibold text-slate-300">
            {isRunning ? 'ACTIVE' : 'PAUSED'}
          </span>
        </div>

        {/* Throughput */}
        <div className="h-8 px-2.5 rounded-lg bg-dark-950 border border-slate-800 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">RPS:</span>
          <span className="font-bold text-cyan-400">{metrics.currentRps}</span>
        </div>

        {/* Avg Latency */}
        <div className="h-8 px-2.5 rounded-lg bg-dark-950 border border-slate-800 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">LAT:</span>
          <span className="font-bold text-slate-200">{metrics.avgLatencyMs}ms</span>
        </div>

        {/* Delivered Packets */}
        <div className="h-8 px-2.5 rounded-lg bg-dark-950 border border-slate-800 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">SENT:</span>
          <span className="font-bold text-emerald-400">{metrics.delivered}</span>
        </div>

        {/* Error Packets */}
        <div className="h-8 px-2.5 rounded-lg bg-dark-950 border border-slate-800 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">ERR:</span>
          <span className={`font-bold ${metrics.errors > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
            {metrics.errors}
          </span>
        </div>
      </div>

      {/* Right: Simulation & Canvas Controls (Uniform 32px height) */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Play/Pause + Speed Group */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1 h-7 px-2.5 rounded-md text-xs font-semibold transition-all ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={isRunning ? 'Pause Traffic' : 'Start Traffic'}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isRunning ? 'Pause' : 'Start'}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Speed toggles */}
          <div className="flex gap-0.5">
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`h-7 px-1.5 rounded text-[11px] font-mono transition-colors ${
                  speedMultiplier === s
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Traffic Spike Button */}
        <button
          onClick={onTriggerSpike}
          disabled={!isRunning}
          className={`flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs font-semibold border transition-all ${
            isSpikeMode
              ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
              : 'border-slate-800 bg-dark-950 text-slate-300 hover:border-amber-500/50 hover:text-amber-400'
          } ${!isRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
          title="Inject Traffic Surge / DDoS"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Spike</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className={`w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center transition-colors ${
            soundEnabled
              ? 'bg-dark-950 text-slate-300 hover:text-white'
              : 'bg-dark-950 text-slate-600'
          }`}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <div className="hidden sm:block h-5 w-px bg-slate-800 mx-0.5" />

        {/* Undo / Redo Group */}
        <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'opacity-30 cursor-not-allowed text-slate-600'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'opacity-30 cursor-not-allowed text-slate-600'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Group */}
        <div className="hidden lg:flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8">
          <button
            onClick={onZoomOut}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="h-7 px-1.5 text-[11px] font-mono text-slate-300 hover:text-white transition-colors"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Presets Button */}
        <button
          onClick={onOpenTemplates}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-dark-950 text-slate-200 hover:border-slate-700 text-xs font-semibold transition-colors"
          title="Architecture Presets"
        >
          <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden xl:inline">Presets</span>
        </button>

        {/* AI Generator Button */}
        <button
          onClick={onOpenAiGenerator}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-purple-500/40 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-white text-xs font-semibold transition-all shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          title="AI Prompt-to-Architecture"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="hidden sm:inline">AI Gen</span>
        </button>

        {/* Projects / Cloud Button */}
        <button
          onClick={onOpenProjects}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-dark-950 text-slate-200 hover:border-slate-700 text-xs font-semibold transition-colors"
          title="Saved Projects & Cloud Links"
        >
          <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden md:inline">Projects</span>
        </button>

        {/* Embed Widget Button */}
        <button
          onClick={onOpenEmbed}
          className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-slate-800 bg-dark-950 text-slate-200 hover:border-slate-700 text-xs font-semibold transition-colors"
          title="Embed Interactive Simulator in Notion / Blogs"
        >
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden lg:inline">Embed</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-md shadow-cyan-950"
          title="Export Architecture"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Pro Upgrade Pill */}
        <button
          onClick={onOpenPricing}
          className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs shadow-md transition-all shrink-0"
          title="View Pro & Team Plans"
        >
          <Crown className="w-3.5 h-3.5 text-slate-950" />
          <span>PRO</span>
        </button>

        {/* Clear graph */}
        <button
          onClick={onClearGraph}
          className="w-8 h-8 rounded-lg border border-slate-800 bg-dark-950 text-slate-500 hover:text-rose-400 hover:border-rose-900 flex items-center justify-center transition-colors"
          title="Clear Architecture"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
