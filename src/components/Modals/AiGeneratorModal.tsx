import React, { useState } from 'react';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { Sparkles, X, Loader2, ArrowRight, Wand2, Key } from 'lucide-react';
import { generateArchitectureWithGemini, synthesizeArchitectureOffline, GeneratedArchitecture } from '../../services/aiGenerator';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyArchitecture: (arch: GeneratedArchitecture) => void;
}

const PRESET_PROMPTS = [
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
}) => {
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusStep, setStatusStep] = useState('');

  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsLoading(true);
    setStatusStep('Analyzing requirements & topologies...');

    try {
      await new Promise(r => setTimeout(r, 400));
      setStatusStep('Synthesizing microservices, caches & databases...');
      await new Promise(r => setTimeout(r, 400));
      setStatusStep('Routing network protocols and latencies...');

      let result: GeneratedArchitecture;
      if (apiKey.trim()) {
        result = await generateArchitectureWithGemini(prompt, apiKey.trim());
      } else {
        result = synthesizeArchitectureOffline(prompt);
      }

      onApplyArchitecture(result);
      onClose();
    } catch (err) {
      console.error(err);
      // Fallback
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none"
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
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Describe your system in plain English; AI will layout and simulate it</p>
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
          {/* Prompt Textarea */}
          <div className="space-y-1.5">
            <label htmlFor="ai-gen-prompt" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-cyan-400" />
              What kind of system do you want to model?
            </label>
            <textarea
              id="ai-gen-prompt"
              rows={3}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. A ride-sharing app with real-time GPS tracking, microservices, Kafka queue, Redis cache, and PostgreSQL database..."
              className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 transition-colors resize-none"
            />
          </div>

          {/* Quick preset suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Quick Suggestions
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
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-[11px] text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>{showApiKeyInput ? 'Hide Gemini API Key' : 'Have a Google Gemini API Key? (Optional)'}</span>
            </button>
            {showApiKeyInput && (
              <div className="mt-2 space-y-1">
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="AIzaSy... (leave blank to use built-in smart engine)"
                  className="w-full bg-dark-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
                <p className="text-[11px] text-slate-400">
                  By default, GraphFlow includes a built-in neural rules synthesizer that runs 100% offline.
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
