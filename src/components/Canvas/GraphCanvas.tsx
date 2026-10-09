import React, { useState, useRef, useCallback } from 'react';
import { GraphNode, GraphEdge, DataPacket } from '../../types/graph';
import { CatalogItem } from '../../constants/nodeCatalog';
import { GridBackground } from './GridBackground';
import { NodeComponent } from './NodeComponent';
import { ConnectionLine } from './ConnectionLine';
import { createBezierPath } from '../../utils/geometry';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  packets: DataPacket[];
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
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  packets,
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number; mouseX: number; mouseY: number }>({
    x: 0,
    y: 0,
    mouseX: 0,
    mouseY: 0,
  });

  // State for in-progress connection line
  const [connectingState, setConnectingState] = useState<{
    sourceNodeId: string;
    startPos: { x: number; y: number };
    currentPos: { x: number; y: number };
  } | null>(null);

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.mouseX;
      const dy = e.clientY - panStartRef.current.mouseY;
      setPan({
        x: panStartRef.current.x + dx,
        y: panStartRef.current.y + dy,
      });
    }

    if (connectingState && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - pan.x) / zoom;
      const worldY = (e.clientY - rect.top - pan.y) / zoom;
      setConnectingState(prev => (prev ? { ...prev, currentPos: { x: worldX, y: worldY } } : null));
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (connectingState) setConnectingState(null);
  };

  // Wheel zoom centered on cursor
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.3, zoom * zoomFactor));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Adjust pan so mouse point remains stationary
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Start connecting from node output port
  const handleStartConnect = useCallback((nodeId: string, startPos: { x: number; y: number }) => {
    setConnectingState({
      sourceNodeId: nodeId,
      startPos,
      currentPos: { ...startPos },
    });
  }, []);

  // Complete connection on node input port
  const handleEndConnect = useCallback((targetNodeId: string) => {
    if (!connectingState) return;
    if (connectingState.sourceNodeId !== targetNodeId) {
      const newEdge: GraphEdge = {
        id: `e-${Date.now()}`,
        fromNodeId: connectingState.sourceNodeId,
        toNodeId: targetNodeId,
        protocol: 'HTTP/REST',
        latencyMs: 15,
        errorRate: 0,
      };
      onAddEdge(newEdge);
    }
    setConnectingState(null);
  }, [connectingState, onAddEdge]);

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
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full h-full overflow-hidden bg-dark-950 canvas-background ${
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
        className="absolute inset-0 pointer-events-none"
      >
        {/* SVG Layer for Connections & Animated Packets */}
        <svg className="absolute inset-0 w-[50000px] h-[50000px] overflow-visible pointer-events-none">
          <defs>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Render all existing edges */}
          {edges.map(edge => {
            const fromNode = nodes.find(n => n.id === edge.fromNodeId);
            const toNode = nodes.find(n => n.id === edge.toNodeId);
            if (!fromNode || !toNode) return null;

            return (
              <ConnectionLine
                key={edge.id}
                edge={edge}
                fromNode={fromNode}
                toNode={toNode}
                isSelected={selectedEdgeId === edge.id}
                packets={packets}
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
                onSelect={onSelectNode}
                onMove={onMoveNode}
                onStartConnect={handleStartConnect}
                onEndConnect={handleEndConnect}
                onDelete={onDeleteNode}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
