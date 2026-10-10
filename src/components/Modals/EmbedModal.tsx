import React, { useState } from 'react';
import { GraphNode, GraphEdge } from '../../types/graph';
import { generateEmbedUrl, generateIframeSnippet } from '../../services/projectStorage';
import {
  Code2,
  Copy,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const EmbedModal: React.FC<EmbedModalProps> = ({
  isOpen,
  onClose,
  nodes,
  edges,
}) => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedHeight, setSelectedHeight] = useState<number>(480);

  if (!isOpen) return null;

  const embedUrl = generateEmbedUrl(nodes, edges);
  const iframeSnippet = generateIframeSnippet(embedUrl, selectedHeight);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(iframeSnippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(embedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 select-none">
      <div className="bg-dark-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Embed Live Simulation</h2>
                <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50">
                  VIRAL WIDGET
                </span>
              </div>
              <p className="text-xs text-slate-400">Embed an interactive 60 FPS simulator in Notion, docs, or blogs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Height Selector Segmented Control */}
          <div className="flex items-center justify-between bg-dark-950 p-2 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Widget Frame Height</span>
            </span>
            <div className="flex items-center gap-1 bg-dark-900 p-1 rounded-lg border border-slate-800">
              {[400, 480, 600].map(h => (
                <button
                  key={h}
                  onClick={() => setSelectedHeight(h)}
                  className={`h-7 px-3 rounded-md font-mono text-xs font-semibold transition-all ${
                    selectedHeight === h
                      ? 'bg-cyan-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {h}px
                </button>
              ))}
            </div>
          </div>

          {/* Iframe HTML Code Block */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>HTML &lt;iframe&gt; Code</span>
              <span className="text-[11px] text-slate-500 font-mono">Ready to paste into websites</span>
            </div>
            <div className="relative group">
              <textarea
                readOnly
                value={iframeSnippet}
                rows={3}
                className="w-full bg-dark-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-cyan-300/90 focus:outline-none resize-none selection:bg-cyan-500/30"
              />
              <button
                onClick={handleCopySnippet}
                className="absolute top-2 right-2 h-7 px-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all shadow-md shadow-cyan-950"
              >
                {copiedSnippet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Iframe</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span>Direct Embed URL</span>
              <span className="text-[11px] text-slate-500 font-mono">Use for Notion / Embed blocks</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={embedUrl}
                className="flex-1 bg-dark-950 border border-slate-800 rounded-xl px-3 h-9 font-mono text-[11px] text-slate-300 focus:outline-none selection:bg-cyan-500/30"
              />
              <button
                onClick={handleCopyLink}
                className="h-9 px-3 rounded-xl border border-slate-700 bg-dark-900 hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tips Box */}
          <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-200/90 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Viral Growth Tip</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              Embedded simulations display a live 60 FPS interactive view with a sleek{' '}
              <strong className="text-slate-200">"Powered by GraphFlow"</strong> badge.
              Anyone who clicks the badge is automatically brought to your site with the exact same architecture ready to simulate!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-dark-950/60">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
          >
            <span>Open live preview in new tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="h-8 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
