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
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  const dragStartPos = useRef<{ mouseX: number; mouseY: number; nodeX: number; nodeY: number }>({
    mouseX: 0,
    mouseY: 0,
    nodeX: node.x,
    nodeY: node.y,
  });

  // Mouse Drag Handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
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
      const currentZoom = zoomRef.current;
      const dx = (moveEvent.clientX - dragStartPos.current.mouseX) / currentZoom;
      const dy = (moveEvent.clientY - dragStartPos.current.mouseY) / currentZoom;
      onMove(node.id, Math.round(dragStartPos.current.nodeX + dx), Math.round(dragStartPos.current.nodeY + dy));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [node.id, node.x, node.y, onMove, onSelect]);

  // Mobile Touch Drag Handler
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    onSelect(node.id);

    const touch = e.touches[0];
    dragStartPos.current = {
      mouseX: touch.clientX,
      mouseY: touch.clientY,
      nodeX: node.x,
      nodeY: node.y,
    };
    setIsDragging(true);

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length !== 1) return;
      const currentTouch = moveEvent.touches[0];
      const currentZoom = zoomRef.current;
      const dx = (currentTouch.clientX - dragStartPos.current.mouseX) / currentZoom;
      const dy = (currentTouch.clientY - dragStartPos.current.mouseY) / currentZoom;
      onMove(node.id, Math.round(dragStartPos.current.nodeX + dx), Math.round(dragStartPos.current.nodeY + dy));
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);
  }, [node.id, node.x, node.y, onMove, onSelect]);

  const handleOutputPortMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const portX = node.x + node.width;
    const portY = node.y + node.height / 2;
    onStartConnect(node.id, { x: portX, y: portY });
  }, [node.id, node.x, node.y, node.width, node.height, onStartConnect]);

  const handleOutputPortTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    const portX = node.x + node.width;
    const portY = node.y + node.height / 2;
    onStartConnect(node.id, { x: portX, y: portY });
  }, [node.id, node.x, node.y, node.width, node.height, onStartConnect]);

  const handleInputPortMouseUp = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
      tabIndex={0}
      role="button"
      aria-label={`${node.title} (${node.subtitle}), status: ${node.status}, latency: ${node.latencyMs}ms`}
      aria-selected={isSelected}
      onFocus={() => onSelect(node.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(node.id);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          onDelete(node.id);
        }
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      className={`absolute select-none cursor-grab group transition-shadow duration-150 rounded-xl border backdrop-blur-md bg-dark-900/90 touch-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
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
              <div className="text-[11px] text-slate-400 truncate">
                {node.subtitle}
              </div>
            </div>
          </div>

          {/* Status & Circuit Breaker Badge */}
          <div className="flex items-center gap-1.5 shrink-0" title={`Status: ${statusConfig.label}`}>
            {node.circuitBreaker === 'open' && (
              <span className="px-1 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                CB OPEN
              </span>
            )}
            {node.circuitBreaker === 'half-open' && (
              <span className="px-1 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                CB PROBE
              </span>
            )}
            <span className={`w-2 h-2 rounded-full ${statusConfig.dot} ${statusConfig.glow}`} />
          </div>
        </div>

        {/* Metrics Footer */}
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 text-slate-300">
            <span className="text-[11px] text-slate-400">LAT</span> {node.latencyMs}ms
          </span>
          <span className="flex items-center gap-1 text-slate-300">
            <span className="text-[11px] text-slate-400">RPS</span> {node.throughputRps}
          </span>
        </div>
      </div>

      {/* Input Port (Left Handle) - 44px padded hit area */}
      <div
        onMouseUp={handleInputPortMouseUp}
        onTouchEnd={handleInputPortMouseUp}
        title="Connect input here"
        className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-900 border-2 border-slate-600 hover:border-cyan-400 hover:bg-cyan-500/20 hover:scale-125 transition-all flex items-center justify-center cursor-crosshair z-10 after:absolute after:-inset-3 after:content-['']"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-cyan-300" />
      </div>

      {/* Output Port (Right Handle) - 44px padded hit area */}
      <div
        onMouseDown={handleOutputPortMouseDown}
        onTouchStart={handleOutputPortTouchStart}
        title="Drag to connect output"
        className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-dark-900 border-2 border-slate-600 hover:border-cyan-400 hover:bg-cyan-500/20 hover:scale-125 transition-all flex items-center justify-center cursor-crosshair z-10 after:absolute after:-inset-3 after:content-['']"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      </div>

      {/* Quick Delete Floating Action (visible on hover or tap) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(node.id);
        }}
        className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-md z-20 after:absolute after:-inset-2 after:content-['']"
        title="Delete Component"
      >
        ×
      </button>
    </div>
  );
};

// Strict custom memo comparison: nodes only re-render if visual attributes or selection change
function areNodePropsEqual(prev: NodeComponentProps, next: NodeComponentProps): boolean {
  return (
    prev.isSelected === next.isSelected &&
    prev.node.x === next.node.x &&
    prev.node.y === next.node.y &&
    prev.node.width === next.node.width &&
    prev.node.height === next.node.height &&
    prev.node.status === next.node.status &&
    prev.node.circuitBreaker === next.node.circuitBreaker &&
    prev.node.latencyMs === next.node.latencyMs &&
    prev.node.errorRate === next.node.errorRate &&
    prev.node.throughputRps === next.node.throughputRps &&
    prev.node.title === next.node.title &&
    prev.node.subtitle === next.node.subtitle &&
    prev.node.color === next.node.color &&
    prev.node.iconName === next.node.iconName
  );
}

export const NodeComponent = React.memo(NodeComponentBase, areNodePropsEqual);
