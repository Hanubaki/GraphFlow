import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { GraphNode, GraphEdge, DataPacket } from '../../types/graph';
import { CatalogItem } from '../../constants/nodeCatalog';
import { GridBackground } from './GridBackground';
import { NodeComponent } from './NodeComponent';
import { ConnectionLine } from './ConnectionLine';
import { PeerCursorLayer } from './PeerCursorLayer';
import { createBezierPath } from '../../utils/geometry';
import { useSimulationPackets, useSimulationControls } from '../../context/SimulationContext';
import { useMultiplayer } from '../../context/MultiplayerContext';
import { Maximize2, Sliders, Zap } from 'lucide-react';

const EMPTY_PACKETS: DataPacket[] = [];

interface ConnectingState {
  sourceNodeId: string;
  startPos: { x: number; y: number };
  currentPos: { x: number; y: number };
}

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  packets?: DataPacket[];
  pan: { x: number; y: number };
  zoom: number;
  setPan: (pan: { x: number; y: number }) => void;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  onSelectNode: (id: string | null) => void;
  onSelectEdge: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onDeleteNode: (id: string) => void;
  onDeleteEdge: (id: string) => void;
  onAddEdge: (edge: GraphEdge) => void;
  onAddNodeAt: (typeItem: CatalogItem, x: number, y: number) => void;
  onUpdateNode?: (id: string, updates: Partial<GraphNode>) => void;
  onDuplicateNode?: (id: string) => void;
  onResetZoom?: () => void;
  isMobileInspectorOpen?: boolean;
  onToggleMobileInspector?: () => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  packets: propPackets,
  pan,
  zoom,
  setPan,
  setZoom,
  onSelectNode,
  onSelectEdge,
  onMoveNode,
  onDeleteNode,
  onDeleteEdge,
  onAddEdge,
  onAddNodeAt,
  onUpdateNode,
  onDuplicateNode,
  onResetZoom,
  isMobileInspectorOpen = false,
  onToggleMobileInspector,
}) => {
  const contextPackets = useSimulationPackets();
  const packets = propPackets ?? contextPackets;
  const { peers, broadcastCursor, clearCursor, updateSelection } = useMultiplayer();

  let simControls = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    simControls = useSimulationControls();
  } catch {
    // Standalone test outside SimulationProvider
  }
  const trafficLoadMultiplier = simControls?.trafficLoadMultiplier ?? 1;
  const isSpikeMode = simControls?.isSpikeMode ?? false;
  const metrics = simControls?.metrics;

  // O(1) node lookup map (recomputes only when nodes array changes, not on packet ticks)
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    for (const n of nodes) {
      map.set(n.id, n);
    }
    return map;
  }, [nodes]);

  const lastInboundUpdateRef = useRef<number>(0);
  const cachedInboundMapRef = useRef<Map<string, number>>(new Map());

  // O(P) single-pass packet grouping by edgeId + 4 Hz throttled inboundCountByNode
  // Prevents NodeComponent DOM trees from re-rendering at 30-60 FPS while keeping SVG PacketDots silky-smooth
  const { packetsByEdge, inboundCountByNode } = useMemo(() => {
    const edgeMap = new Map<string, DataPacket[]>();
    for (const pkt of packets) {
      const list = edgeMap.get(pkt.edgeId);
      if (list) {
        list.push(pkt);
      } else {
        edgeMap.set(pkt.edgeId, [pkt]);
      }
    }

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (packets.length === 0) {
      if (cachedInboundMapRef.current.size > 0) {
        cachedInboundMapRef.current = new Map();
      }
    } else if (now - lastInboundUpdateRef.current >= 240 || cachedInboundMapRef.current.size === 0) {
      lastInboundUpdateRef.current = now;
      const nodeCountMap = new Map<string, number>();
      for (const pkt of packets) {
        nodeCountMap.set(pkt.toNodeId, (nodeCountMap.get(pkt.toNodeId) ?? 0) + 1);
      }
      cachedInboundMapRef.current = nodeCountMap;
    }

    return { packetsByEdge: edgeMap, inboundCountByNode: cachedInboundMapRef.current };
  }, [packets]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [connectingState, setConnectingState] = useState<ConnectingState | null>(null);
  const panStartRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number }>({
    x: 0,
    y: 0,
    mouseX: 0,
    mouseY: 0,
  });

  // Synchronize peer selected node state
  useEffect(() => {
    updateSelection(selectedNodeId);
  }, [selectedNodeId, updateSelection]);

  // Touch gesture refs
  const touchPanRef = useRef<{ startX: number; startY: number; initialPanX: number; initialPanY: number } | null>(null);
  const touchPinchRef = useRef<{ initialDistance: number; initialZoom: number; midpoint: { x: number; y: number }; initialPan: { x: number; y: number } } | null>(null);

  // Helper functions for multi-touch mathematics
  const getTouchDistance = (t1: React.Touch, t2: React.Touch): number => {
    const dx = t2.clientX - t1.clientX;
    const dy = t2.clientY - t1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchMidpoint = (t1: React.Touch, t2: React.Touch, rect: DOMRect) => {
    return {
      x: (t1.clientX + t2.clientX) / 2 - rect.left,
      y: (t1.clientY + t2.clientY) / 2 - rect.top,
    };
  };

  // Canvas pan with mouse drag
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan on background left click or middle click
    if (e.target !== containerRef.current && !(e.target as HTMLElement).classList.contains('canvas-background')) {
      return;
    }

    onSelectNode(null);
    onSelectEdge(null);

    setIsPanning(true);
    panStartRef.current = {
      x: pan.x,
      y: pan.y,
      mouseX: e.clientX,
      mouseY: e.clientY,
    };
  };

  const lastCursorBroadcastRef = useRef<number>(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;

      const now = performance.now();
      if (now - lastCursorBroadcastRef.current >= 33) {
        lastCursorBroadcastRef.current = now;
        broadcastCursor(worldX, worldY);
      }

      if (connectingState) {
        setConnectingState(prev => (prev ? { ...prev, currentPos: { x: worldX, y: worldY } } : null));
      }
    }
  };

  const handleMouseLeave = () => {
    clearCursor();
    if (isPanning) setIsPanning(false);
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (connectingState) setConnectingState(null);
  };

  const connectingStateRef = useRef(connectingState);
  connectingStateRef.current = connectingState;

  // Start connecting from node output port
  const handleStartConnect = useCallback((nodeId: string, startPos: { x: number; y: number }) => {
    setConnectingState({
      sourceNodeId: nodeId,
      startPos,
      currentPos: { ...startPos },
    });
  }, []);

  // Complete connection on node input port (stable reference: does not change on mouse move)
  const handleEndConnect = useCallback((targetNodeId: string) => {
    const current = connectingStateRef.current;
    if (!current) return;
    if (current.sourceNodeId !== targetNodeId) {
      const newEdge: GraphEdge = {
        id: `e-${Date.now()}`,
        fromNodeId: current.sourceNodeId,
        toNodeId: targetNodeId,
        protocol: 'HTTP/REST',
        latencyMs: 15,
        errorRate: 0,
      };
      onAddEdge(newEdge);
    }
    setConnectingState(null);
  }, [onAddEdge]);

  // Mobile multi-touch gesture handlers: pinch-to-zoom, two-finger/single-finger pan, and touch port connecting
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (e.touches.length === 2) {
      // Two-finger pinch-to-zoom & pan initialization
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const distance = getTouchDistance(t1, t2);
      const midpoint = getTouchMidpoint(t1, t2, rect);

      touchPinchRef.current = {
        initialDistance: Math.max(10, distance),
        initialZoom: zoom,
        midpoint,
        initialPan: { ...pan },
      };
      touchPanRef.current = null;
      setIsPanning(true);
      return;
    }

    if (e.touches.length === 1) {
      // Single-finger canvas pan on background
      const target = e.target as HTMLElement;
      if (e.target !== containerRef.current && !target.classList.contains('canvas-background')) {
        return;
      }

      onSelectNode(null);
      onSelectEdge(null);

      const touch = e.touches[0];
      touchPanRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      };
      touchPinchRef.current = null;
      setIsPanning(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // Update in-progress wire connection when dragging from an output port on touch devices
    if (connectingStateRef.current && e.touches.length === 1) {
      const touch = e.touches[0];
      const worldX = (touch.clientX - rect.left - pan.x) / zoom;
      const worldY = (touch.clientY - rect.top - pan.y) / zoom;
      setConnectingState(prev => (prev ? { ...prev, currentPos: { x: worldX, y: worldY } } : null));
      return;
    }

    // Two-finger pinch-to-zoom & two-finger pan
    if (e.touches.length === 2 && touchPinchRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = getTouchDistance(t1, t2);
      const currentMid = getTouchMidpoint(t1, t2, rect);

      const { initialDistance, initialZoom, midpoint: initMid, initialPan } = touchPinchRef.current;
      const scale = currentDist / initialDistance;
      const targetZoom = Math.min(2.5, Math.max(0.22, initialZoom * scale));

      // Focal point zoom into midpoint with translation delta
      const dx = currentMid.x - initMid.x;
      const dy = currentMid.y - initMid.y;

      const newPanX = currentMid.x - (initMid.x - initialPan.x) * (targetZoom / initialZoom) + dx;
      const newPanY = currentMid.y - (initMid.y - initialPan.y) * (targetZoom / initialZoom) + dy;

      setZoom(targetZoom);
      setPan({ x: newPanX, y: newPanY });
      return;
    }

    // Single-finger canvas pan
    if (e.touches.length === 1 && touchPanRef.current) {
      const touch = e.touches[0];
      const dx = touch.clientX - touchPanRef.current.startX;
      const dy = touch.clientY - touchPanRef.current.startY;
      setPan({
        x: touchPanRef.current.initialPanX + dx,
        y: touchPanRef.current.initialPanY + dy,
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    // Complete touch-dragged wire connection via bounding-box hit test (since touchend targets origin element)
    if (connectingStateRef.current && containerRef.current && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (touch.clientX - rect.left - pan.x) / zoom;
      const worldY = (touch.clientY - rect.top - pan.y) / zoom;
      const current = connectingStateRef.current;

      const hitTarget = nodes.find(
        n =>
          n.id !== current.sourceNodeId &&
          worldX >= n.x - 24 &&
          worldX <= n.x + n.width + 24 &&
          worldY >= n.y - 20 &&
          worldY <= n.y + n.height + 20
      );

      if (hitTarget) {
        handleEndConnect(hitTarget.id);
      } else {
        setConnectingState(null);
      }
    }

    if (e.touches.length === 0) {
      touchPanRef.current = null;
      touchPinchRef.current = null;
      setIsPanning(false);
    } else if (e.touches.length === 1 && touchPinchRef.current) {
      // Transition from two-finger pinch to single-finger pan
      const touch = e.touches[0];
      touchPanRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        initialPanX: pan.x,
        initialPanY: pan.y,
      };
      touchPinchRef.current = null;
    }
  };

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.22, zoom * zoomFactor));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Adjust pan so mouse point remains stationary
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Handle Drag & Drop of new nodes from catalog
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const rawData = e.dataTransfer.getData('application/graphflow-item');
    if (!rawData || !containerRef.current) return;

    const item = JSON.parse(rawData);
    const rect = containerRef.current.getBoundingClientRect();
    const worldX = Math.round((e.clientX - rect.left - pan.x) / zoom) - 95;
    const worldY = Math.round((e.clientY - rect.top - pan.y) / zoom) - 45;

    onAddNodeAt(item, Math.max(20, worldX), Math.max(20, worldY));
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-full overflow-hidden bg-dark-950 canvas-background touch-none ${
        isPanning ? 'cursor-grabbing' : 'cursor-default'
      }`}
    >
      <GridBackground pan={pan} zoom={zoom} />

      {/* World Transform Container */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 pointer-events-none will-change-transform"
      >
        {/* Remote Collaborator Cursors */}
        <PeerCursorLayer peers={peers} />

        {/* SVG Layer for Connections & Animated Packets (w-full h-full with overflow-visible avoids 50000px GPU backing store allocation on mobile) */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Render all existing edges with O(1) node lookup and pre-grouped edge packets */}
          {edges.map(edge => {
            const fromNode = nodeMap.get(edge.fromNodeId);
            const toNode = nodeMap.get(edge.toNodeId);
            if (!fromNode || !toNode) return null;

            return (
              <ConnectionLine
                key={edge.id}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                isSelected={selectedEdgeId === edge.id}
                packets={packetsByEdge.get(edge.id) ?? EMPTY_PACKETS}
                onSelect={onSelectEdge}
                onDelete={onDeleteEdge}
              />
            );
          })}

          {/* Render In-Progress Connection Line */}
          {connectingState && (
            <path
              d={createBezierPath(connectingState.startPos, connectingState.currentPos)}
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2.5"
              strokeDasharray="6 6"
              className="animate-flow-dash filter drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]"
            />
          )}
        </svg>

        {/* HTML Layer for Interactive Nodes */}
        <div className="absolute inset-0 pointer-events-none">
          {nodes.map(node => (
            <div key={node.id} className="pointer-events-auto">
              <NodeComponent
                node={node}
                isSelected={selectedNodeId === node.id}
                zoom={zoom}
                activeInboundCount={inboundCountByNode.get(node.id) ?? 0}
                trafficLoadMultiplier={trafficLoadMultiplier}
                isSpikeMode={isSpikeMode}
                onSelect={onSelectNode}
                onMove={onMoveNode}
                onStartConnect={handleStartConnect}
                onEndConnect={handleEndConnect}
                onDelete={onDeleteNode}
                onUpdate={onUpdateNode}
                onDuplicate={onDuplicateNode}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Floating Simulation Telemetry & Viewport HUD Bar (Visible on phones < 768px) */}
      <div
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        className="md:hidden absolute left-16 right-2 bottom-2.5 z-20 flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-dark-900/95 border border-slate-800 shadow-xl font-mono text-[11px]"
      >
        {/* Live RPS & Latency */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center gap-1 text-cyan-400 font-bold tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {metrics?.currentRps ?? 0}
            <span className="text-[10px] text-slate-400 font-normal">RPS</span>
          </span>
          <span className="text-slate-700">·</span>
          <span
            className={`tabular-nums font-semibold ${
              (metrics?.avgLatencyMs ?? 0) > 120 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {metrics?.avgLatencyMs ?? 24}ms
          </span>
        </div>

        {/* Mobile Traffic Load Quick Cycle + Fit + Inspector Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {simControls && (
            <button
              type="button"
              onClick={() => {
                const nextLoad =
                  trafficLoadMultiplier < 2 ? 2 : trafficLoadMultiplier < 5 ? 5 : 1;
                simControls.setTrafficLoadMultiplier(nextLoad);
              }}
              className={`h-7 px-2 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 transition-colors ${
                trafficLoadMultiplier >= 5
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : trafficLoadMultiplier >= 2
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-dark-950 border-slate-800 text-cyan-300'
              }`}
              title="Tap to cycle Traffic Load (1x / 2x / 5x)"
            >
              <Zap className="w-3 h-3" />
              <span>{trafficLoadMultiplier}x</span>
            </button>
          )}

          {onResetZoom && (
            <button
              type="button"
              onClick={onResetZoom}
              className="h-7 px-2 rounded-lg border border-slate-800 bg-dark-950 text-slate-200 hover:text-white text-[10px] font-semibold inline-flex items-center gap-1"
              title="Fit architecture to mobile screen"
              aria-label="Fit architecture to screen"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>Fit</span>
            </button>
          )}

          {onToggleMobileInspector && (
            <button
              type="button"
              onClick={onToggleMobileInspector}
              className={`h-7 px-2 rounded-lg border text-[10px] font-semibold inline-flex items-center gap-1 transition-colors ${
                isMobileInspectorOpen
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'border-slate-800 bg-dark-950 text-slate-200'
              }`}
              title="Toggle System & Node Inspector Sheet"
              aria-label="Toggle Inspector Panel"
            >
              <Sliders className="w-3 h-3 text-cyan-400" />
              <span>Inspect</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
