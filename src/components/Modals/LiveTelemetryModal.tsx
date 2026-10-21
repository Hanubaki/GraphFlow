import React, { useState, useEffect } from 'react';
import { GraphNode } from '../../types/graph';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { useAuth } from '../../context/AuthContext';
import { checkFeatureEntitlement } from '../../services/billing';
import {
  parseLiveTelemetryPayload,
  generateSimulatedLiveTick,
  SAMPLE_LOGO_ERP_BRIDGE_SCRIPT,
  LiveNodeMetricUpdate,
} from '../../services/liveTelemetry';
import {
  Radio,
  X,
  Play,
  Square,
  Lock,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Activity,
  Globe,
  FileSpreadsheet,
} from 'lucide-react';

interface LiveTelemetryModalProps {
  isOpen: boolean;
  nodes: GraphNode[];
  isStreaming: boolean;
  streamMode: 'demo' | 'url' | null;
  endpointUrl: string;
  pollIntervalSec: number;
  lastTickTime: string | null;
  recentUpdates: LiveNodeMetricUpdate[];
  streamError: string | null;
  onClose: () => void;
  onSetEndpointUrl: (url: string) => void;
  onSetPollIntervalSec: (sec: number) => void;
  onStartDemoStream: () => void;
  onStartUrlStream: () => void;
  onStopStream: () => void;
  onApplyManualSnapshot: (updates: LiveNodeMetricUpdate[]) => void;
  onOpenPricing?: () => void;
}

export const LiveTelemetryModal: React.FC<LiveTelemetryModalProps> = ({
  isOpen,
  nodes,
  isStreaming,
  streamMode,
  endpointUrl,
  pollIntervalSec,
  lastTickTime,
  recentUpdates,
  streamError,
  onClose,
  onSetEndpointUrl,
  onSetPollIntervalSec,
  onStartDemoStream,
  onStartUrlStream,
  onStopStream,
  onApplyManualSnapshot,
  onOpenPricing,
}) => {
  const { planTier, isPro } = useAuth();
  const [activeTab, setActiveTab] = useState<'stream' | 'snapshot' | 'agent'>('stream');
  const [manualText, setManualText] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccessCount, setManualSuccessCount] = useState<number | null>(null);
  const [copiedAgent, setCopiedAgent] = useState(false);

  useEscapeToClose(isOpen, onClose);

  useEffect(() => {
    if (isOpen && !manualText && nodes.length > 0) {
      const sample = generateSimulatedLiveTick(nodes, 1);
      setManualText(sample.payloadJson);
    }
  }, [isOpen, nodes, manualText]);

  if (!isOpen) return null;

  const liveEntitlement = checkFeatureEntitlement('live_telemetry_stream', planTier);

  const handleApplySnapshot = () => {
    setManualError(null);
    setManualSuccessCount(null);
    if (!manualText.trim()) {
      setManualError('Paste a JSON, ERP CSV, or Prometheus metric snapshot first.');
      return;
    }
    try {
      const result = parseLiveTelemetryPayload(manualText, nodes);
      if (result.updates.length === 0) {
        setManualError('No matching node IDs or department titles found on the current canvas.');
        return;
      }
      onApplyManualSnapshot(result.updates);
      setManualSuccessCount(result.updates.length);
    } catch (err) {
      setManualError(err instanceof Error ? err.message : 'Invalid telemetry payload format.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="live-telemetry-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
    >
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
              <Radio className={`w-5 h-5 ${isStreaming ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="live-telemetry-modal-title" className="text-base font-bold text-slate-100">
                  Live Telemetry & ERP Digital Twin
                </h2>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {isPro ? 'PRO LIVE STREAM ACTIVE' : 'FREE PREVIEW + PRO URL'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Stream real-time RPS, queue backlogs, and latencies from Logo ERP, SAP, REST APIs, or Prometheus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close live telemetry modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex border-b border-slate-800 px-4 bg-dark-950/40 overflow-x-auto">
          <button
            role="tab"
            aria-selected={activeTab === 'stream'}
            onClick={() => setActiveTab('stream')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'stream'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Stream & Polling</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'snapshot'}
            onClick={() => setActiveTab('snapshot')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'snapshot'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Paste Live Snapshot (JSON / CSV)</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'agent'}
            onClick={() => setActiveTab('agent')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors shrink-0 ${
              activeTab === 'agent'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Logo ERP / SQL Bridge Script</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'stream' && (
            <>
              {/* 1. Interactive Free Live Demo Stream Card */}
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                      <Radio className="w-4 h-4 text-emerald-400" />
                      <span>1-Click Live Digital Twin Simulator (Free Interactive Preview)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Streams live fluctuating work-order RPS, latency spikes, and department bottlenecks directly onto your current canvas every 2.5 seconds.
                    </p>
                  </div>
                  {isStreaming && streamMode === 'demo' ? (
                    <button
                      onClick={onStopStream}
                      className="h-8 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Stop Live Stream</span>
                    </button>
                  ) : (
                    <button
                      onClick={onStartDemoStream}
                      className="h-8 px-3.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-md shadow-emerald-950"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Start Live Demo Stream</span>
                    </button>
                  )}
                </div>

                {/* Live Telemetry Feed Log */}
                {recentUpdates.length > 0 && (
                  <div className="p-3 rounded-lg bg-dark-950/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>LIVE TELEMETRY FEED ({recentUpdates.length} NODES SYNCED)</span>
                      {lastTickTime && <span className="text-emerald-400">LAST TICK: {lastTickTime}</span>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pt-1">
                      {recentUpdates.map(u => (
                        <div
                          key={u.nodeId}
                          className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/90 border border-slate-800/80 text-[11px] font-mono"
                        >
                          <span className="text-slate-200 truncate max-w-[140px]">{u.matchedTitle}</span>
                          <span
                            className={
                              u.status === 'degraded'
                                ? 'text-amber-400 font-semibold'
                                : u.status === 'down'
                                  ? 'text-rose-400 font-semibold'
                                  : 'text-cyan-300'
                            }
                          >
                            {u.throughputRps ?? '-'} RPS · {u.latencyMs ?? '-'}ms
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Custom Production Endpoint / ERP Bridge URL (PRO Feature) */}
              <div className="p-4 rounded-xl border border-slate-800 bg-dark-950/70 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-100">
                      Connect Custom Production Endpoint (ERP / REST JSON / Prometheus / CSV)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                    PRO FEATURE
                  </span>
                </div>

                {!liveEntitlement.allowed && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs text-amber-200">{liveEntitlement.reason}</span>
                    </div>
                    {onOpenPricing && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenPricing();
                        }}
                        className="h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-colors"
                      >
                        Unlock Pro ($19/mo)
                      </button>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="sm:col-span-3">
                    <label className="text-[11px] text-slate-400 block mb-1">
                      Live Metrics Endpoint URL (JSON, CSV, or Prometheus)
                    </label>
                    <input
                      type="url"
                      value={endpointUrl}
                      onChange={e => onSetEndpointUrl(e.target.value)}
                      placeholder="http://localhost:4040/metrics or https://api.company.com/erp/metrics"
                      className="w-full select-text h-9 px-3 rounded-lg bg-dark-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Poll Interval</label>
                    <select
                      value={pollIntervalSec}
                      onChange={e => onSetPollIntervalSec(Number(e.target.value))}
                      className="w-full h-9 px-2.5 rounded-lg bg-dark-900 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value={2}>Every 2s</option>
                      <option value={5}>Every 5s</option>
                      <option value={10}>Every 10s</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Matches canvas nodes automatically by ID or Department/Service title.
                  </span>
                  {isStreaming && streamMode === 'url' ? (
                    <button
                      onClick={onStopStream}
                      className="h-8 px-3.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Square className="w-3.5 h-3.5" />
                      <span>Disconnect URL Stream</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (!liveEntitlement.allowed) {
                          onClose();
                          onOpenPricing?.();
                          return;
                        }
                        onStartUrlStream();
                      }}
                      className="h-8 px-3.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {!liveEntitlement.allowed ? <Lock className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      <span>Connect Live URL</span>
                    </button>
                  )}
                </div>

                {streamError && (
                  <div className="text-xs font-mono text-rose-400 bg-rose-950/30 border border-rose-800/40 rounded-lg p-2">
                    {streamError}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'snapshot' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Paste a real-time JSON payload, an ERP CSV status export (<code className="text-cyan-300 font-mono">Departman;RPS;Sure_ms;Hata_Orani;Durum</code>), or Prometheus text metrics to immediately update the live canvas nodes:
              </p>
              <textarea
                rows={9}
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                className="w-full select-text rounded-xl border border-slate-800 bg-dark-950 p-3 font-mono text-[11px] text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <div>
                  {manualError && <span className="text-xs text-rose-400 font-mono">{manualError}</span>}
                  {manualSuccessCount !== null && (
                    <span className="text-xs text-emerald-400 font-mono">
                      Updated {manualSuccessCount} live nodes on the canvas!
                    </span>
                  )}
                </div>
                <button
                  onClick={handleApplySnapshot}
                  className="h-8 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors"
                >
                  Apply Live Metrics to Canvas
                </button>
              </div>
            </div>
          )}

          {activeTab === 'agent' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">
                  Run this lightweight Node.js bridge script (<code className="text-cyan-300 font-mono">logo-erp-bridge.mjs</code>) on your machine to stream live Logo Tiger / Go ERP (MS SQL) or backend metrics to <code className="text-cyan-300 font-mono">http://localhost:4040/metrics</code>:
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(SAMPLE_LOGO_ERP_BRIDGE_SCRIPT);
                    setCopiedAgent(true);
                    setTimeout(() => setCopiedAgent(false), 2000);
                  }}
                  className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  {copiedAgent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedAgent ? 'Copied!' : 'Copy Bridge Script'}</span>
                </button>
              </div>
              <pre className="p-3.5 rounded-xl bg-dark-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 leading-relaxed whitespace-pre select-text">
                {SAMPLE_LOGO_ERP_BRIDGE_SCRIPT}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
