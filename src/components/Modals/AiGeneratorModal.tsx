import React, { useState } from 'react';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { Sparkles, X, Loader2, ArrowRight, Wand2, Key, Lock, Check } from 'lucide-react';
import { generateArchitectureWithGemini, synthesizeArchitectureOffline, GeneratedArchitecture } from '../../services/aiGenerator';
import { useAuth } from '../../context/AuthContext';
import { checkFeatureEntitlement, TIER_LIMITS } from '../../services/billing';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyArchitecture: (arch: GeneratedArchitecture) => void;
  onOpenPricing?: () => void;
}

const AI_QUOTA_STORAGE_KEY = 'graphflow_daily_ai_quota_v1';
const GEMINI_API_KEY_STORAGE_KEY = 'graphflow_gemini_api_key_v1';

function getStoredGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(GEMINI_API_KEY_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function saveStoredGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(GEMINI_API_KEY_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

function getDailyAiUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(AI_QUOTA_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    return parsed.date === today ? Number(parsed.count) || 0 : 0;
  } catch {
    return 0;
  }
}

function incrementDailyAiUsageCount(): number {
  const next = getDailyAiUsageCount() + 1;
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(AI_QUOTA_STORAGE_KEY, JSON.stringify({ date: today, count: next }));
  } catch {
    // ignore storage errors
  }
  return next;
}

const PRESET_PROMPTS = [
  'ERP Depo Giriş/Çıkış (Inbound/Outbound), Ar-Ge, Kalite Kontrol, Üretim ve Bakım Departmanları Akışı',
  'E-Commerce with Redis cache, Kafka events, and Stripe checkout',
  'On-demand food delivery with courier live tracking and database',
  'High-scale video streaming platform with CDN and S3 chunks',
  'Real-time WebSocket chat cluster with Redis Pub/Sub',
  'AI RAG pipeline with Vector Database and Gemini LLM',
];

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyArchitecture,
  onOpenPricing,
}) => {
  const { planTier, isPro } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState<string>(() => getStoredGeminiApiKey());
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(() => Boolean(getStoredGeminiApiKey()));
  const [keySavedBadge, setKeySavedBadge] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState('');
  const [usedToday, setUsedToday] = useState<number>(() => getDailyAiUsageCount());

  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const hasCustomKey = Boolean(apiKey.trim());
  const aiEntitlement = checkFeatureEntitlement('ai_generation_unlimited', planTier, usedToday);
  const canGenerate = aiEntitlement.allowed || hasCustomKey;
  const maxFreeDaily = TIER_LIMITS.free.maxDailyAiPrompts;

  const handleSaveApiKey = () => {
    saveStoredGeminiApiKey(apiKey);
    setKeySavedBadge(true);
    setTimeout(() => setKeySavedBadge(false), 2000);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (!canGenerate) {
      onClose();
      onOpenPricing?.();
      return;
    }

    saveStoredGeminiApiKey(apiKey);
    setIsLoading(true);
    setStatusStep('Analyzing requirements, departments & topologies...');

    try {
      await new Promise(r => setTimeout(r, 350));
      setStatusStep('Synthesizing departments, services, queues & databases...');
      await new Promise(r => setTimeout(r, 350));
      setStatusStep('Routing workflow connections and latencies...');

      let result: GeneratedArchitecture;
      if (hasCustomKey) {
        result = await generateArchitectureWithGemini(prompt, apiKey.trim());
      } else {
        result = synthesizeArchitectureOffline(prompt);
      }

      if (!hasCustomKey) {
        setUsedToday(incrementDailyAiUsageCount());
      }
      onApplyArchitecture(result);
      onClose();
    } catch (err) {
      console.error(err);
      if (!hasCustomKey) {
        setUsedToday(incrementDailyAiUsageCount());
      }
      const fallback = synthesizeArchitectureOffline(prompt);
      onApplyArchitecture(fallback);
      onClose();
    } finally {
      setIsLoading(false);
      setStatusStep('');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-gen-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
    >
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-800/40 text-cyan-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="ai-gen-modal-title" className="text-base font-bold text-slate-100">AI Prompt-to-Architecture</h2>
                <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                  {isPro
                    ? 'PRO UNLIMITED'
                    : hasCustomKey
                      ? 'BYOK UNLIMITED (GEMINI 2.5)'
                      : `${Math.max(0, maxFreeDaily - usedToday)}/${maxFreeDaily} FREE TODAY`}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Describe software systems or ERP / factory departments (Ar-Ge, Kalite, Üretim, Depo)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI generator"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {!canGenerate && (
            <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs text-amber-200">
                  {aiEntitlement.reason} (veya aşağıya kendi ücretsiz Google Gemini API anahtarınızı girerek sınırsız kullanın)
                </span>
              </div>
              {onOpenPricing && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenPricing();
                  }}
                  className="h-7 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shrink-0 transition-colors"
                >
                  Upgrade to Pro
                </button>
              )}
            </div>
          )}

          {/* Prompt Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="ai-gen-prompt" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              What kind of system or ERP workflow do you want to model?
            </label>
            <textarea
              id="ai-gen-prompt"
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. ERP Depo Giriş (Inbound), Ar-Ge (BOM), Kalite Kontrol (IQC), Üretim (MES), Bakım (MRO) ve Depo Çıkış (Outbound) iş akışı..."
              className="w-full select-text bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-colors resize-none"
            />
          </div>

          {/* Quick preset suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Suggestions (ERP & Cloud)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => setPrompt(p)}
                  className="text-[11px] text-slate-300 bg-dark-950 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 rounded-lg px-2.5 py-1 text-left transition-colors truncate max-w-full"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Optional Gemini API Key Accordion */}
          <div className="pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>
                {showApiKeyInput
                  ? 'Hide Gemini API Key'
                  : hasCustomKey
                    ? 'Google Gemini API Key Configured (Click to Edit)'
                    : 'Have a Google Gemini API Key? (Optional)'}
              </span>
              {hasCustomKey && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 text-[10px] font-mono">
                  ACTIVE
                </span>
              )}
            </button>
            {showApiKeyInput && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use built-in ERP & Cloud engine)"
                    className="flex-1 select-text bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="h-8 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-cyan-300 flex items-center gap-1 shrink-0 transition-colors"
                  >
                    {keySavedBadge ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save Key</span>
                    )}
                  </button>
                  {hasCustomKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setApiKey('');
                        saveStoredGeminiApiKey('');
                      }}
                      className="h-8 px-2.5 rounded-lg bg-slate-900 hover:bg-rose-950/50 border border-slate-800 text-xs text-slate-400 hover:text-rose-300 shrink-0 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Uses <code className="text-cyan-300 font-mono">gemini-2.5-flash</code> when a key is saved, or runs 100% offline with the built-in Multi-Department ERP & Cloud synthesizer.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-dark-950/60 flex items-center justify-between">
          <div className="text-xs font-mono text-cyan-300 flex items-center gap-2" aria-live="polite">
            {isLoading && (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>{statusStep}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-black/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cyan-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950 group"
            >
              <span>{isLoading ? 'Synthesizing...' : 'Generate Topology'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
