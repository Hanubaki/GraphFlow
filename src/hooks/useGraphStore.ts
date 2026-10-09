import { useState, useCallback, useRef, useEffect } from 'react';
import { GraphNode, GraphEdge, ArchitectureTemplate } from '../types/graph';
import { TEMPLATES } from '../constants/templates';
import { soundFx } from '../utils/sound';

interface HistorySnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function useGraphStore() {
  // Default to E-Commerce template on initial load for immediate wow factor
  const initialTemplate = TEMPLATES[0];

  const [nodes, setNodes] = useState<GraphNode[]>(initialTemplate.nodes);
  const [edges, setEdges] = useState<GraphEdge[]>(initialTemplate.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Canvas viewport coordinates & zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  // Undo / Redo history
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);
  const [historyChangeCount, setHistoryChangeCount] = useState<number>(0);

  // Snapshot before executing an action that mutates nodes/edges
  const recordSnapshot = useCallback((currentNodes: GraphNode[], currentEdges: GraphEdge[]) => {
    undoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(currentNodes)),
      edges: JSON.parse(JSON.stringify(currentEdges)),
    });
    // Cap undo stack at 30 items
    if (undoStackRef.current.length > 30) {
      undoStackRef.current.shift();
    }
    // Clear redo stack on new action
    redoStackRef.current = [];
    setHistoryChangeCount(c => c + 1);
  }, []);

  const addNode = useCallback((node: GraphNode) => {
    setNodes(prevNodes => {
      recordSnapshot(prevNodes, edges);
      return [...prevNodes, node];
    });
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    soundFx.playClick();
  }, [edges, recordSnapshot]);

  const updateNode = useCallback((id: string, updates: Partial<GraphNode>) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, ...updates } : n)));
  }, []);

  const moveNode = useCallback((id: string, x: number, y: number) => {
    setNodes(prev => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
  }, []);

  const removeNode = useCallback((id: string) => {
    setNodes(prevNodes => {
      recordSnapshot(prevNodes, edges);
      return prevNodes.filter(n => n.id !== id);
    });
    // Remove all connected edges
    setEdges(prevEdges => prevEdges.filter(e => e.fromNodeId !== id && e.toNodeId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
    soundFx.playClick();
  }, [edges, recordSnapshot, selectedNodeId]);

  const addEdge = useCallback((edge: GraphEdge) => {
    // Prevent duplicate edges between same nodes
    setEdges(prevEdges => {
      const exists = prevEdges.some(
        e => e.fromNodeId === edge.fromNodeId && e.toNodeId === edge.toNodeId
      );
      if (exists) return prevEdges;
      recordSnapshot(nodes, prevEdges);
      soundFx.playConnect();
      return [...prevEdges, edge];
    });
  }, [nodes, recordSnapshot]);

  const updateEdge = useCallback((id: string, updates: Partial<GraphEdge>) => {
    setEdges(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));
  }, []);

  const removeEdge = useCallback((id: string) => {
    setEdges(prevEdges => {
      recordSnapshot(nodes, prevEdges);
      return prevEdges.filter(e => e.id !== id);
    });
    if (selectedEdgeId === id) setSelectedEdgeId(null);
    soundFx.playClick();
  }, [nodes, recordSnapshot, selectedEdgeId]);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) setSelectedEdgeId(null);
  }, []);

  const selectEdge = useCallback((id: string | null) => {
    setSelectedEdgeId(id);
    if (id) setSelectedNodeId(null);
  }, []);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop()!;
    redoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHistoryChangeCount(c => c + 1);
    soundFx.playClick();
  }, [nodes, edges]);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHistoryChangeCount(c => c + 1);
    soundFx.playClick();
  }, [nodes, edges]);

  const loadTemplate = useCallback((template: ArchitectureTemplate) => {
    recordSnapshot(nodes, edges);
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    soundFx.playConnect();
  }, [nodes, edges, recordSnapshot]);

  const clearGraph = useCallback(() => {
    recordSnapshot(nodes, edges);
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    soundFx.playClick();
  }, [nodes, edges, recordSnapshot]);

  // Global keyboard shortcuts (Ctrl+Z, Ctrl+Y, Delete, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNodeId, selectedEdgeId, removeNode, removeEdge]);

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    selectedNode: nodes.find(n => n.id === selectedNodeId) || null,
    selectedEdge: edges.find(e => e.id === selectedEdgeId) || null,
    pan,
    zoom,
    setPan,
    setZoom,
    addNode,
    updateNode,
    moveNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
    selectNode,
    selectEdge,
    undo,
    redo,
    canUndo: undoStackRef.current.length > 0,
    canRedo: redoStackRef.current.length > 0,
    historyChangeCount,
    loadTemplate,
    clearGraph,
    setNodes,
    setEdges,
  };
}
