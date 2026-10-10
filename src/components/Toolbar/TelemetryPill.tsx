import React from 'react';
import { SimulationMetrics } from '../../types/graph';
import { Activity } from 'lucide-react';

interface TelemetryPillProps {
  metrics: SimulationMetrics;
  isRunning: boolean;
  onOpenAnalytics?: () => void;
}

const TelemetryPillBase: React.FC<TelemetryPillProps> = ({
  metrics,
  isRunning,
  onOpenAnalytics,
}) => {
  return (
    <button
      onClick={onOpenAnalytics}
      className="flex items-center gap-2.5 h-8 px-3 rounded-lg bg-dark-950 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 shadow-inner transition-colors group cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none select-none font-mono"
      title="Open Live Simulation & WebPerf Analytics"
      aria-label="Open performance analytics dashboard"
    >
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

        <Activity className="w-3 h-3 text-cyan-400 opacity-60 group-hover:opacity-100 transition-opacity ml-1" />
      </button>
  );
};

function areTelemetryPillPropsEqual(prev: TelemetryPillProps, next: TelemetryPillProps): boolean {
  return (
    prev.isRunning === next.isRunning &&
    prev.metrics.currentRps === next.metrics.currentRps &&
    prev.metrics.avgLatencyMs === next.metrics.avgLatencyMs &&
    prev.metrics.delivered === next.metrics.delivered &&
    prev.metrics.errors === next.metrics.errors &&
    prev.metrics.totalSent === next.metrics.totalSent &&
    prev.onOpenAnalytics === next.onOpenAnalytics
  );
}

export const TelemetryPill = React.memo(TelemetryPillBase, areTelemetryPillPropsEqual);
