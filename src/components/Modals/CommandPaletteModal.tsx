import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Terminal,
  ShieldCheck,
  LayoutGrid,
  Share2,
  Sparkles,
  LayoutTemplate,
  FolderKanban,
  Maximize2,
  Trash2,
  Plus,
  Cpu,
  CornerDownLeft,
  HelpCircle,
} from 'lucide-react';
import { NODE_CATALOG, CatalogItem } from '../../constants/nodeCatalog';
import { GraphNode } from '../../types/graph';

interface CommandPaletteModalProps {
  isOpen: boolean;
  nodes: GraphNode[];
  onClose: () => void;
  onAddNode: (item: CatalogItem) => void;
  onSelectNode: (id: string) => void;
  onAutoHarden: () => void;
  onAutoLayout: () => void;
  onAutoCenter: () => void;
  onOpenExport: () => void;
  onOpenAiGenerator: () => void;
  onOpenTemplates: () => void;
  onOpenProjects: () => void;
  onOpenTour: () => void;
  onClearGraph: () => void;
}

interface CommandItem {
  id: string;
  category: 'SRE & Studio Actions' | 'Spawn Infrastructure Node' | 'Focus Canvas Node';
  title: string;
  subtitle: string;
  badge?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  nodes,
  onClose,
  onAddNode,
  onSelectNode,
  onAutoHarden,
  onAutoLayout,
  onAutoCenter,
  onOpenExport,
  onOpenAiGenerator,
  onOpenTemplates,
  onOpenProjects,
  onOpenTour,
  onClearGraph,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
    }
  }, [isOpen]);

  const commands = useMemo<CommandItem[]>(() => {
    const actionItems: CommandItem[] = [
      {
        id: 'act-harden',
        category: 'SRE & Studio Actions',
        title: 'Auto-Harden Topology (SRE)',
        subtitle: 'Scale single-point-of-failure nodes to 2x replicas and enable circuit breakers',
        badge: 'SRE Action',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
        action: () => {
          onAutoHarden();
          onClose();
        },
      },
      {
        id: 'act-layout',
        category: 'SRE & Studio Actions',
        title: 'Auto-Align DAG Topology Layout',
        subtitle: 'Organize all canvas nodes into clean left-to-right architectural tiers',
        badge: 'Layout',
        icon: <LayoutGrid className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onAutoLayout();
          onClose();
        },
      },
      {
        id: 'act-export',
        category: 'SRE & Studio Actions',
        title: 'Export Code / Mermaid PR / Grafana k6 / Import IaC',
        subtitle: 'Generate Terraform, Kubernetes, Docker Compose, Mermaid PR bundle, or k6 load tests',
        badge: 'IaC & CI',
        icon: <Share2 className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenExport();
        },
      },
      {
        id: 'act-aigen',
        category: 'SRE & Studio Actions',
        title: 'AI Prompt-to-Architecture Synthesizer',
        subtitle: 'Generate a complete system topology from natural language requirements',
        badge: 'AI Gen',
        icon: <Sparkles className="w-4 h-4 text-cyan-300" />,
        action: () => {
          onClose();
          onOpenAiGenerator();
        },
      },
      {
        id: 'act-presets',
        category: 'SRE & Studio Actions',
        title: 'Browse Production Architecture Presets',
        subtitle: 'Load reference patterns (Stripe Payment Engine, Uber Geo-Dispatch, RAG Pipeline)',
        badge: 'Presets',
        icon: <LayoutTemplate className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenTemplates();
        },
      },
      {
        id: 'act-center',
        category: 'SRE & Studio Actions',
        title: 'Auto-Center & Fit Viewport',
        subtitle: 'Reset zoom and pan to fit all architecture nodes on screen',
        badge: 'Viewport',
        icon: <Maximize2 className="w-4 h-4 text-slate-300" />,
        action: () => {
          onAutoCenter();
          onClose();
        },
      },
      {
        id: 'act-projects',
        category: 'SRE & Studio Actions',
        title: 'Saved Projects & Cloud Snapshots',
        subtitle: 'Save current topology or load a saved architecture snapshot',
        badge: 'Storage',
        icon: <FolderKanban className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenProjects();
        },
      },
      {
        id: 'act-tour',
        category: 'SRE & Studio Actions',
        title: 'Launch Interactive Studio Guide',
        subtitle: 'Walk through simulation controls, presets, and SRE inspector tools',
        badge: 'Guide',
        icon: <HelpCircle className="w-4 h-4 text-cyan-400" />,
        action: () => {
          onClose();
          onOpenTour();
        },
      },
      {
        id: 'act-clear',
        category: 'SRE & Studio Actions',
        title: 'Clear Entire Canvas',
        subtitle: 'Remove all nodes and edges from the active workspace',
        badge: 'Reset',
        icon: <Trash2 className="w-4 h-4 text-rose-400" />,
        action: () => {
          onClearGraph();
          onClose();
        },
      },
    ];

    const spawnItems: CommandItem[] = NODE_CATALOG.map((item, idx) => ({
      id: `spawn-${item.type}-${idx}`,
      category: 'Spawn Infrastructure Node',
      title: `Add ${item.title}`,
      subtitle: `${item.subtitle} (${item.defaultLatencyMs}ms base latency • ${item.defaultThroughput} RPS)`,
      badge: item.category.toUpperCase(),
      icon: <Plus className="w-4 h-4 text-cyan-400" />,
      action: () => {
        onAddNode(item);
        onClose();
      },
    }));

    const focusItems: CommandItem[] = nodes.map(n => ({
      id: `focus-${n.id}`,
      category: 'Focus Canvas Node',
      title: `Inspect: ${n.title}`,
      subtitle: `${n.type} • ${n.latencyMs}ms • ${n.throughputRps} RPS`,
      badge: 'Inspect',
      icon: <Cpu className="w-4 h-4 text-amber-400" />,
      action: () => {
        onSelectNode(n.id);
        onClose();
      },
    }));

    return [...actionItems, ...spawnItems, ...focusItems];
  }, [
    nodes,
    onAutoHarden,
    onAutoLayout,
    onAutoCenter,
    onOpenExport,
    onOpenAiGenerator,
    onOpenTemplates,
    onOpenProjects,
    onOpenTour,
    onClearGraph,
    onAddNode,
    onSelectNode,
    onClose,
  ]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands.slice(0, 18);
    return commands.filter(
      cmd =>
        cmd.title.toLowerCase().includes(q) ||
        cmd.subtitle.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q) ||
        (cmd.badge && cmd.badge.toLowerCase().includes(q))
    );
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev =>
          filteredCommands.length > 0
            ? (prev - 1 + filteredCommands.length) % filteredCommands.length
            : 0
        );
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].action();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-dark-900 border border-slate-700/90 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-black/90 flex flex-col"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Engineer Command Palette"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-dark-950/90">
          <Terminal className="w-4 h-4 text-cyan-400 shrink-0" />
          <Search className="w-4 h-4 text-slate-400 shrink-0 -ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command, spawn a node (e.g. 'Add Redis', 'Auto-Harden', 'Mermaid', 'k6')..."
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none font-mono"
          />
          <kbd className="px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-900 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Command Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-slate-800/40">
          {filteredCommands.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 font-mono">
              No matching commands or infrastructure components found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={cmd.action}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/70 border border-cyan-500/40 text-white'
                        : 'hover:bg-slate-800/60 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-cyan-900/50 border-cyan-500/40'
                            : 'bg-dark-950 border-slate-800'
                        }`}
                      >
                        {cmd.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-100 truncate flex items-center gap-2">
                          <span>{cmd.title}</span>
                          <span className="text-[10px] font-mono text-slate-400 font-normal">
                            [{cmd.category}]
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {cmd.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {cmd.badge && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700/80 text-cyan-300">
                          {cmd.badge}
                        </span>
                      )}
                      {isSelected && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Shortcut Legend */}
        <div className="px-4 py-2.5 border-t border-slate-800 bg-dark-950/90 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-slate-200">↑↓</strong> Navigate
            </span>
            <span>
              <strong className="text-slate-200">↵</strong> Execute
            </span>
            <span>
              <strong className="text-slate-200">Ctrl+K</strong> Toggle Palette
            </span>
          </div>
          <span className="text-cyan-400 font-semibold">
            {filteredCommands.length} commands ready
          </span>
        </div>
      </div>
    </div>
  );
};
