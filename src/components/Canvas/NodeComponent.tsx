import React, { useState, useRef, useCallback } from 'react';
import { GraphNode } from '../../types/graph';
import { NodeIcon } from '../Common/NodeIcon';

interface NodeComponentProps {
  node: GraphNode;
  isSelected: boolean;
  zoom: number;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onStartConnect: (nodeId: string, startPos: { x: number; y: number }) => void;
  onEndConnect: (nodeId: string) => void;
  onDelete: (id: string) => void;
}

const NodeComponentBase: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  zoom,
  onSelect,
  onMove,
  onStartConnect,
  onEndConnect,
  onDelete,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    nodeX: node.x,
    nodeY: node.y,
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag on left click and avoid port triggers
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(node.id);

    dragStartPos.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - dragStartPos.current.mouseX) / zoom;
      const dy = (moveEvent.clientY - dragStartPos.current.mouseY) / zoom;
      onMove(node.id, Math.round(dragStartPos.current.nodeX + dx), Math.round(dragStartPos.current.nodeY + dy));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [node.id, node.x, node.y, onMove, onSelect, zoom]);

  const handleOutputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const portX = node.x + node.width;
    const portY = node.y + node.height / 2;
    onStartConnect(node.id, { x: portX, y: portY });
  }, [node.id, node.x, node.y, node.width, node.height, onStartConnect]);

  const handleInputPortMouseUp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEndConnect(node.id);
  }, [node.id, onEndConnect]);

  // Status indicator colors
  const statusConfig = {
    healthy: { dot: 'bg-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.6)]', label: 'HEALTHY' },
    degraded: { dot: 'bg-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.6)]', label: 'DEGRADED' },
    down: { dot: 'bg-rose-500', glow: 'shadow-[0_0_8px_rgba(244,63,94,0.6)]', label: 'DOWN' },
  }[node.status];

  return (
    <div
      style={{
        transform: `translate(${node.x}px, ${node.y}px)`,
        width: `${node.width}px`,
        height: `${node.height}px`,
      }}
      onMouseDown={handleMouseDown}
      className={`absolute select-none cursor-grab group transition-shadow duration-150 rounded-xl border backdrop-blur-md bg-dark-900/90 ${
        isSelected
          ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] ring-1 ring-cyan-400'
          : 'border-slate-800 hover:border-slate-700 shadow-lg shadow-black/40'
      } ${isDragging ? 'cursor-grabbing opacity-90 scale-[1.01]' : ''}`}
    >
      {/* Accent top stripe */}
      <div
        className="h-1.5 w-full rounded-t-xl transition-colors"
        style={{ backgroundColor: node.color }}
      />

      <div className="p-2.5 flex flex-col justify-between h-[calc(100%-6px)]">
        {/* Header row */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="p-1.5 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${node.color}20`, color: node.color }}
            >
              <NodeIcon name={node.iconName} className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-100 truncate tracking-wide">
                {node.title}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {node.subtitle}
              </div>
            </div>
          </div>

          {/* Status Dot */}
          <div className="flex items-center gap-1 shrink-0" title={`Status: ${statusConfig.label}`}>
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} ${statusConfig.glow}`} />
          </div>
        </div>

        {/* Metrics Footer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="text-[9px] text-slate-400">LAT</span> {node.latencyMs}ms
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="text-[9px] text-slate-400">RPS</span> {node.throughputRps}
          </span>
        </div>
      </div>

      {/* Input Port (Left Handle) */}
      <div
        onMouseUp={handleInputPortMouseUp}
        title="Connect input here"
        className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-900 border-2 border-slate-600 hover:border-cyan-400 hover:bg-cyan-500/20 hover:scale-125 transition-all flex items-center justify-center cursor-crosshair z-10"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-cyan-300" />
      </div>

      {/* Output Port (Right Handle) */}
      <div
        onMouseDown={handleOutputPortMouseDown}
        title="Drag to connect output"
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-900 border-2 border-slate-600 hover:border-cyan-400 hover:bg-cyan-500/20 hover:scale-125 transition-all flex items-center justify-center cursor-crosshair z-10"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      </div>

      {/* Quick Delete Floating Action (visible on hover) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(node.id);
        }}
        className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md z-20"
        title="Delete Component"
      >
        ×
      </button>
    </div>
  );
};

export const NodeComponent = React.memo(NodeComponentBase);
