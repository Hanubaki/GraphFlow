import React, { useEffect, useState } from 'react';
import { NODE_CATALOG, CatalogItem } from '../../constants/nodeCatalog';
import { NodeIcon } from '../Common/NodeIcon';
import { useAuth } from '../../context/AuthContext';
import { ChevronLeft, ChevronRight, Lock, Plus, Search, Sparkles } from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (item: CatalogItem) => void;
  onOpenAuth?: () => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode, onOpenAuth }) => {
  const { user } = useAuth();
  const isUnlocked = Boolean(user);
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches === true
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Phones: the palette is a drawer opened from a floating button instead of a permanent rail
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches === true
  );
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const handleAdd = (item: CatalogItem) => {
    onAddNode(item);
    if (isMobile) setIsCollapsed(true);
  };

  const freeCount = NODE_CATALOG.filter(i => !i.requiresAuth).length;
  const totalCount = NODE_CATALOG.length;

  const filteredCatalog = NODE_CATALOG.filter(
    item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(filteredCatalog.map(item => item.category)));

  const handleDragStart = (e: React.DragEvent, item: CatalogItem) => {
    e.dataTransfer.setData('application/graphflow-item', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'copy';
  };

  if (isMobile && isCollapsed) {
    return (
      <button
        data-tour="palette"
        onClick={() => setIsCollapsed(false)}
        className="absolute left-2 top-2 z-30 h-11 px-3.5 rounded-full bg-cyan-500 text-slate-950 text-xs font-bold shadow-lg shadow-black/40 inline-flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
        aria-label="Add components"
      >
        <Plus className="w-4 h-4" />
        <span>Add</span>
      </button>
    );
  }

  return (
    <>
    {isMobile && (
      <div className="absolute inset-0 z-30 bg-black/50" onClick={() => setIsCollapsed(true)} aria-hidden="true" />
    )}
    <div
      data-tour="palette"
      className={`relative z-20 flex flex-col h-full bg-dark-900/95 border-r border-slate-800 backdrop-blur-xl ${
        isCollapsed ? 'w-14' : 'w-72'
      } ${isMobile ? '!absolute inset-y-0 left-0 !z-40 shadow-2xl !w-[min(18rem,85vw)]' : ''}`}
    >
      {/* Collapse Toggle Pin */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-dark-800 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center shadow-lg hover:bg-slate-700 z-30 transition-transform"
        title={isCollapsed ? 'Expand Palette' : 'Collapse Palette'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Header */}
      <div className="p-3.5 border-b border-slate-800">
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Component Palette
              </span>
              {isUnlocked || freeCount === totalCount ? (
                <span className="text-[10px] text-emerald-300 font-mono bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  {totalCount}/{totalCount} Unlocked
                </span>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="text-[10px] text-cyan-300 font-mono bg-cyan-950/70 hover:bg-cyan-900/70 px-1.5 py-0.5 rounded border border-cyan-700/50 transition-colors"
                  title="Sign in with email (Free) to unlock all 16 components"
                >
                  {freeCount}/{totalCount} Free • Unlock
                </button>
              )}
            </div>
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search 16 components..."
                className="w-full bg-dark-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <span className="text-xs font-bold text-cyan-400">CP</span>
          </div>
        )}
      </div>

      {/* Catalog Items List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
        {categories.map(category => (
          <div key={category} className="space-y-1.5">
            {!isCollapsed && (
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                {category}
              </div>
            )}
            <div className="space-y-1">
              {filteredCatalog
                .filter(item => item.category === category)
                .map(item => {
                  const isLockedForGuest = Boolean(item.requiresAuth && !isUnlocked);
                  return (
                    <div
                      key={item.title}
                      draggable
                      onDragStart={e => handleDragStart(e, item)}
                      onClick={() => handleAdd(item)}
                      className={`group relative flex items-center gap-2.5 p-2 rounded-lg border transition-colors select-none ${
                        isLockedForGuest
                          ? 'border-slate-800/70 bg-dark-950/40 hover:bg-slate-900/80 hover:border-cyan-500/40 cursor-pointer'
                          : 'border-slate-800/80 bg-dark-950/60 hover:bg-slate-800/60 hover:border-slate-700 cursor-grab active:cursor-grabbing'
                      } ${isCollapsed ? 'justify-center p-2' : ''}`}
                      title={
                        isCollapsed
                          ? `${item.title} - ${item.subtitle}${isLockedForGuest ? ' (Sign in with email to unlock - Free)' : ''}`
                          : isLockedForGuest
                            ? 'Click to unlock with free email sign-in'
                            : undefined
                      }
                    >
                      {/* Icon */}
                      <div
                        className={`p-1.5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 relative ${
                          isLockedForGuest ? 'opacity-75 group-hover:opacity-100' : ''
                        }`}
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        <NodeIcon name={item.iconName} className="w-4 h-4" />
                        {isCollapsed && isLockedForGuest && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-dark-950 border border-cyan-500/50 flex items-center justify-center">
                            <Lock className="w-2 h-2 text-cyan-400" />
                          </span>
                        )}
                      </div>

                      {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-xs font-medium truncate transition-colors ${
                                isLockedForGuest
                                  ? 'text-slate-300 group-hover:text-cyan-300'
                                  : 'text-slate-200 group-hover:text-cyan-300'
                              }`}
                            >
                              {item.title}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.subtitle}
                          </div>
                        </div>
                      )}

                      {!isCollapsed && (
                        isLockedForGuest ? (
                          <span
                            className="px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/50 text-[9px] font-mono font-semibold text-cyan-300 inline-flex items-center gap-1 shrink-0"
                            title="Sign in with email (Free) to unlock"
                          >
                            <Lock className="w-2.5 h-2.5" />
                            <span>Free</span>
                          </span>
                        ) : (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleAdd(item);
                            }}
                            className="opacity-0 group-hover:opacity-100 w-6 h-6 text-slate-400 hover:text-white rounded-md bg-slate-800/80 hover:bg-cyan-600 flex items-center justify-center transition-[background-color,color,opacity] shrink-0"
                            title="Add to Canvas"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Free Email Unlock Banner for Guests */}
      {!isCollapsed && !isUnlocked && freeCount < totalCount && (
        <div className="p-2.5 border-t border-slate-800 bg-dark-950/90">
          <div className="p-2.5 rounded-xl border border-cyan-500/30 bg-cyan-950/20 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-100 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Unlock All {totalCount} Nodes</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300">100% Free</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Sign in with your email to unlock AWS Lambda, LLM/RAG, Cloudflare WAF, ClickHouse, DLQ &amp; S3 nodes.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="w-full py-1.5 px-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3 h-3" />
              <span>Sign In with Email (Free)</span>
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
};
