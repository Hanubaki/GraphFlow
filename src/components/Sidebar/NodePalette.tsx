import React, { useState } from 'react';
import { NODE_CATALOG, CatalogItem } from '../../constants/nodeCatalog';
import { NodeIcon } from '../Common/NodeIcon';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';

interface NodePaletteProps {
  onAddNode: (item: CatalogItem) => void;
}

export const NodePalette: React.FC<NodePaletteProps> = ({ onAddNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(max-width: 767px)').matches === true
  );
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <div
      className={`relative z-20 flex flex-col h-full bg-dark-900/95 border-r border-slate-800 backdrop-blur-xl transition-all duration-300 ${
        isCollapsed ? 'w-14' : 'w-72'
      }`}
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
              <span className="text-[11px] text-cyan-400 font-mono bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                Drag or Click
              </span>
            </div>
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search components..."
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
                .map(item => (
                  <div
                    key={item.title}
                    draggable
                    onDragStart={e => handleDragStart(e, item)}
                    onClick={() => onAddNode(item)}
                    className={`group relative flex items-center gap-2.5 p-2 rounded-lg border border-slate-800/80 bg-dark-950/60 hover:bg-slate-800/60 hover:border-slate-700 cursor-grab active:cursor-grabbing transition-all select-none ${
                      isCollapsed ? 'justify-center p-2' : ''
                    }`}
                    title={isCollapsed ? `${item.title} - ${item.subtitle}` : undefined}
                  >
                    {/* Icon */}
                    <div
                      className="p-1.5 rounded-md flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${item.color}20`, color: item.color }}
                    >
                      <NodeIcon name={item.iconName} className="w-4 h-4" />
                    </div>

                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.subtitle}
                        </div>
                      </div>
                    )}

                    {!isCollapsed && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddNode(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 text-slate-400 hover:text-white rounded-md bg-slate-800/80 hover:bg-cyan-600 flex items-center justify-center transition-all shrink-0"
                        title="Add to Canvas"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
