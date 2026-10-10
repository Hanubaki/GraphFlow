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
  Languages,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSimulationControls } from '../../context/SimulationContext';
import { useI18n } from '../../i18n/I18nContext';
import { telemetry } from '../../utils/telemetry';

interface TopBarProps {
  isRunning?: boolean;
  speedMultiplier?: number;
  isSpikeMode?: boolean;
  soundEnabled?: boolean;
  metrics?: SimulationMetrics;
  canUndo: boolean;
  canRedo: boolean;
  zoom: number;
  onTogglePlay?: () => void;
  onSetSpeed?: (speed: number) => void;
  onTriggerSpike?: () => void;
  onToggleSound?: () => void;
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
  onOpenAuth?: () => void;
  onOpenHome?: () => void;
  onClearGraph: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  isRunning: propIsRunning,
  speedMultiplier: propSpeedMultiplier,
  isSpikeMode: propIsSpikeMode,
  soundEnabled: propSoundEnabled,
  metrics: propMetrics,
  canUndo,
  canRedo,
  zoom,
  onTogglePlay: propOnTogglePlay,
  onSetSpeed: propOnSetSpeed,
  onTriggerSpike: propOnTriggerSpike,
  onToggleSound: propOnToggleSound,
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
  onOpenAuth,
  onOpenHome,
  onClearGraph,
}) => {
  const { user, isPro, planTier } = useAuth();
  const { locale, setLocale, t } = useI18n();

  let contextControls = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    contextControls = useSimulationControls();
  } catch {
    // TopBar mounted outside SimulationProvider (e.g. standalone test)
  }

  const isRunning = propIsRunning ?? contextControls?.isRunning ?? true;
  const speedMultiplier = propSpeedMultiplier ?? contextControls?.speedMultiplier ?? 1;
  const isSpikeMode = propIsSpikeMode ?? contextControls?.isSpikeMode ?? false;
  const soundEnabled = propSoundEnabled ?? contextControls?.soundEnabled ?? true;
  const metrics = propMetrics ?? contextControls?.metrics ?? {
    totalSent: 0,
    delivered: 0,
    errors: 0,
    currentRps: 0,
    avgLatencyMs: 24,
  };

  const onTogglePlay = propOnTogglePlay ?? contextControls?.togglePlay ?? (() => {});
  const onSetSpeed = propOnSetSpeed ?? contextControls?.setSpeedMultiplier ?? (() => {});
  const onTriggerSpike = propOnTriggerSpike ?? contextControls?.triggerSpike ?? (() => {});
  const onToggleSound = propOnToggleSound ?? contextControls?.toggleSound ?? (() => {});

  const handleTogglePlay = () => {
    telemetry.track('Simulation Toggled', { isRunning: !isRunning, speedMultiplier });
    onTogglePlay();
  };

  const handleTriggerSpike = () => {
    telemetry.track('Simulation Spike Injected', { isSpike: !isSpikeMode });
    onTriggerSpike();
  };

  const handleOpenExport = () => {
    telemetry.track('Modal Opened', { modalName: 'export' });
    onOpenExport();
  };

  const handleOpenPricing = () => {
    telemetry.track('Checkout Clicked', { tier: 'pro', source: 'topbar_upgrade_pill' });
    onOpenPricing();
  };

  return (
    <header className="h-14 bg-dark-900/95 border-b border-slate-800 backdrop-blur-xl flex items-center justify-between px-3 md:px-4 z-30 select-none gap-2 w-full max-w-full overflow-hidden">
      {/* Brand Logo & Title */}
      <button
        onClick={onOpenHome}
        className="flex items-center gap-2 shrink-0 text-left hover:opacity-90 transition-opacity"
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

      {/* Center: Sleek Unified Live Telemetry Pill */}
      <div className="hidden 2xl:flex items-center gap-2 font-mono text-xs shrink-0">
        <div className="flex items-center gap-2.5 h-8 px-3 rounded-lg bg-dark-950 border border-slate-800 text-[11px] text-slate-300 shadow-inner">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isRunning ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-200">
              {isRunning ? 'ACTIVE' : 'PAUSED'}
            </span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">RPS:</span>
            <span className="font-bold text-cyan-400">{metrics.currentRps}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">LAT:</span>
            <span className="font-bold text-slate-200">{metrics.avgLatencyMs}ms</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">SENT:</span>
            <span className="font-bold text-emerald-400">{metrics.delivered}</span>
          </div>
          {metrics.errors > 0 && (
            <>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400">ERR:</span>
                <span className="font-bold text-rose-400">{metrics.errors}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right Controls Container */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Play/Pause + Speed Group */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8 shrink-0">
          <button
            onClick={handleTogglePlay}
            className={`flex items-center gap-1 h-7 px-2 sm:px-2.5 rounded-md text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              isRunning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={isRunning ? t('topbar.pauseTraffic') : t('topbar.startTraffic')}
            aria-label={isRunning ? t('topbar.pauseTraffic') : t('topbar.startTraffic')}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isRunning ? t('topbar.pause') : t('topbar.start')}</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Speed toggles */}
          <div className="flex gap-0.5" role="group" aria-label="Simulation speed">
            {[0.5, 1, 2].map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className={`h-7 px-1.5 rounded text-[11px] font-mono transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  speedMultiplier === s
                    ? 'bg-cyan-500/20 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                aria-label={`Set speed to ${s}x`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Traffic Spike Button */}
        <button
          onClick={handleTriggerSpike}
          disabled={!isRunning}
          className={`flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-lg text-xs font-semibold border transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none ${
            isSpikeMode
              ? 'bg-rose-500 text-white border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-pulse'
              : 'border-slate-800 bg-dark-950 text-slate-300 hover:border-amber-500/50 hover:text-amber-400'
          } ${!isRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={t('topbar.spikeTitle')}
          aria-label={t('topbar.spikeTitle')}
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{t('topbar.spike')}</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className={`w-8 h-8 rounded-lg border border-slate-800 flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
            soundEnabled
              ? 'bg-dark-950 text-slate-300 hover:text-white'
              : 'bg-dark-950 text-slate-600'
          }`}
          title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
          aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        <div className="hidden sm:block h-5 w-px bg-slate-800 mx-0.5" />

        {/* Undo / Redo Group */}
        <div className="hidden sm:flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8 shrink-0" role="group" aria-label="History controls">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'opacity-30 cursor-not-allowed text-slate-600'
            }`}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last change"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`w-7 h-7 rounded flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
              canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800' : 'opacity-30 cursor-not-allowed text-slate-600'
            }`}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last change"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom Group */}
        <div className="hidden lg:flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8 shrink-0" role="group" aria-label="Zoom controls">
          <button
            onClick={onZoomOut}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Zoom Out"
            aria-label="Zoom out canvas"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetZoom}
            className="h-7 px-1.5 text-[11px] font-mono text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Reset Zoom (Auto-Center)"
            aria-label="Reset zoom and auto-center architecture"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Zoom In"
            aria-label="Zoom in canvas"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Studio Tools Segmented Group (Presets, AI Gen, Projects, Embed) */}
        <div className="flex items-center rounded-lg border border-slate-800 bg-dark-950 p-0.5 h-8 shrink-0" role="group" aria-label="Studio tools">
          {/* Presets */}
          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 h-7 px-2 rounded hover:bg-slate-800/80 text-slate-200 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Architecture Presets"
            aria-label="Open architecture presets modal"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden 3xl:inline">Presets</span>
          </button>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* AI Generator */}
          <button
            onClick={onOpenAiGenerator}
            className="flex items-center gap-1.5 h-7 px-2 rounded hover:bg-purple-950/60 text-purple-300 text-xs font-medium transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
            title="AI Prompt-to-Architecture"
            aria-label="Open AI prompt-to-architecture generator"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="hidden 3xl:inline">AI Gen</span>
          </button>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Projects */}
          <button
            onClick={onOpenProjects}
            className="flex items-center gap-1.5 h-7 px-2 rounded hover:bg-slate-800/80 text-slate-200 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Saved Projects & Cloud Links"
            aria-label="Open saved projects and cloud links modal"
          >
            <FolderKanban className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden 3xl:inline">Projects</span>
          </button>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Embed */}
          <button
            onClick={onOpenEmbed}
            className="flex items-center gap-1.5 h-7 px-2 rounded hover:bg-slate-800/80 text-slate-200 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Embed Interactive Simulator in Notion / Blogs"
            aria-label="Open embed simulator modal"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden 3xl:inline">Embed</span>
          </button>
        </div>

        {/* Export Button */}
        <button
          onClick={handleOpenExport}
          className="flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-md shadow-cyan-950/50 shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          title={t('topbar.exportTitle')}
          aria-label="Export architecture as JSON, PNG, or SVG"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('topbar.export')}</span>
        </button>

        {/* Pro Upgrade Pill */}
        <button
          onClick={handleOpenPricing}
          className={`flex items-center gap-1 h-8 px-2.5 rounded-lg font-bold text-xs shadow-md transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
            isPro
              ? 'bg-purple-950 border border-purple-800/80 text-purple-300 hover:bg-purple-900/60'
              : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold'
          }`}
          title={t('topbar.upgradeTitle')}
          aria-label="View Pro and Team subscription plans"
        >
          <Crown className={`w-3.5 h-3.5 shrink-0 ${isPro ? 'text-amber-400' : 'text-slate-950'}`} />
          <span>{isPro ? t('topbar.pro') : t('topbar.upgrade')}</span>
        </button>

        {/* User Account / Sign In */}
        {user ? (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 h-8 px-2 rounded-lg border border-slate-800 bg-dark-950 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title={`Account: ${user.email} (${planTier.toUpperCase()} tier)`}
            aria-label={`User account: ${user.email}`}
          >
            <div className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 flex items-center justify-center text-[10px] font-bold shrink-0">
              {user.email?.[0]?.toUpperCase() || <UserIcon className="w-3 h-3" />}
            </div>
            <span className="hidden xl:inline max-w-[75px] truncate text-[11px]">{user.email?.split('@')[0]}</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1 h-8 px-2 sm:px-2.5 rounded-lg border border-slate-800 bg-dark-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title={t('topbar.signInTitle')}
            aria-label="Sign in to sync cloud architectures"
          >
            <UserIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden md:inline">{t('topbar.signIn')}</span>
          </button>
        )}

        {/* Language Switcher */}
        <button
          onClick={() => {
            const nextLocale = locale === 'en' ? 'tr' : 'en';
            setLocale(nextLocale);
            telemetry.track('Locale Changed' as any, { locale: nextLocale });
          }}
          className="flex items-center gap-1 h-8 px-2 rounded-lg border border-slate-800 bg-dark-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-semibold transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          title={locale === 'en' ? 'Türkçe diline geç' : 'Switch to English'}
          aria-label={`Current language: ${locale.toUpperCase()}. Click to switch language.`}
        >
          <Languages className="w-3.5 h-3.5 text-cyan-400" />
          <span>{locale.toUpperCase()}</span>
        </button>

        {/* Clear graph */}
        <button
          onClick={onClearGraph}
          className="w-8 h-8 rounded-lg border border-slate-800 bg-dark-950 text-slate-500 hover:text-rose-400 hover:border-rose-900 flex items-center justify-center transition-colors shrink-0 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
          title={t('topbar.clear')}
          aria-label="Clear all nodes and edges from architecture"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
