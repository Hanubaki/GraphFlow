import { useState, useCallback, useRef, useEffect } from 'react';
import { GraphNode, GraphEdge, ArchitectureTemplate } from '../types/graph';
import { TEMPLATES } from '../constants/templates';
import { a11yAnnouncer } from '../utils/a11yAnnouncer';
import { findAdjacentNodeInDirection, getNextNodeInCycle } from '../utils/a11ySpatial';
import { applyDownstreamFailureCascade } from '../utils/simulationPhysics';

export const CANVAS_AUTOSAVE_KEY = 'graphflow_autosave_canvas_v1';

export interface AutosavedCanvasPayload {
  nodes: GraphNode[];
  edges: GraphEdge[];
  updatedAt: number;
  hasUserChanges?: boolean;
  lastUrlTemplateId?: string | null;
}

export function loadAutosavedCanvas(): AutosavedCanvasPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CANVAS_AUTOSAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AutosavedCanvasPayload;
    if (Array.isArray(parsed?.nodes) && parsed.nodes.length > 0 && Array.isArray(parsed?.edges)) {
      return parsed;
    }
  } catch {
    // Ignore malformed storage
  }
  return null;
}

export function saveAutosavedCanvas(payload: AutosavedCanvasPayload): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CANVAS_AUTOSAVE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors
  }
}

interface HistorySnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type GraphActionSound = 'click' | 'connect';

export interface GraphStoreOptions {
  onSound?: (sound: GraphActionSound) => void;
}

export function useGraphStore(options?: GraphStoreOptions) {
  // Restore autosaved canvas if available; otherwise default to E-Commerce template
  const initialTemplate = TEMPLATES[0];
  const initialAutosave = useRef<AutosavedCanvasPayload | null>(loadAutosavedCanvas());

  const [nodes, setNodes] = useState<GraphNode[]>(
    () => initialAutosave.current?.nodes ?? initialTemplate.nodes
  );
  const [edges, setEdges] = useState<GraphEdge[]>(
    () => initialAutosave.current?.edges ?? initialTemplate.edges
  );
  const hasUserChangesRef = useRef<boolean>(Boolean(initialAutosave.current?.hasUserChanges));
  const lastUrlTemplateIdRef = useRef<string | null>(
    initialAutosave.current?.lastUrlTemplateId ?? null
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  // Canvas viewport coordinates & zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  // Undo / Redo history
  const undoStackRef = useRef<HistorySnapshot[]>([]);
  const redoStackRef = useRef<HistorySnapshot[]>([]);
  const [historyChangeCount, setHistoryChangeCount] = useState<number>(0);

  // Latest state & options refs so callbacks stay referentially stable across renders
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const nodesRef = useRef<GraphNode[]>(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef<GraphEdge[]>(edges);
  edgesRef.current = edges;

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
    hasUserChangesRef.current = true;
    setNodes(prevNodes => {
      recordSnapshot(prevNodes, edgesRef.current);
      const next = [...prevNodes, node];
      nodesRef.current = next;
      return next;
    });
    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    optionsRef.current?.onSound?.('click');
  }, [recordSnapshot]);

  const updateNode = useCallback((id: string, updates: Partial<GraphNode>) => {
    if (updates.status !== undefined) {
      hasUserChangesRef.current = true;
    }
    setNodes(prev => {
      if (updates.status !== undefined) {
        recordSnapshot(prev, edgesRef.current);
      }
      const next = applyDownstreamFailureCascade(prev, edgesRef.current, id, updates);
      nodesRef.current = next;
      return next;
    });
  }, [recordSnapshot]);

  const moveNode = useCallback((id: string, x: number, y: number, snap = true) => {
    const snappedX = snap ? Math.round(x / 10) * 10 : x;
    const snappedY = snap ? Math.round(y / 10) * 10 : y;
    setNodes(prev => {
      const next = prev.map(n => (n.id === id ? { ...n, x: snappedX, y: snappedY } : n));
      nodesRef.current = next;
      return next;
    });
  }, []);

  const duplicateNode = useCallback((id: string) => {
    const source = nodesRef.current.find(n => n.id === id);
    if (!source) return null;

    const copy: GraphNode = {
      ...source,
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${source.title} (Copy)`,
      x: source.x + 30,
      y: source.y + 30,
    };

    setNodes(prevNodes => {
      recordSnapshot(prevNodes, edgesRef.current);
      const next = [...prevNodes, copy];
      nodesRef.current = next;
      return next;
    });
    setSelectedNodeId(copy.id);
    setSelectedEdgeId(null);
    optionsRef.current?.onSound?.('click');
    a11yAnnouncer.announce(`Duplicated component ${source.title}`);
    return copy;
  }, [recordSnapshot]);

  const removeNode = useCallback((id: string) => {
    setNodes(prevNodes => {
      recordSnapshot(prevNodes, edgesRef.current);
      const next = prevNodes.filter(n => n.id !== id);
      nodesRef.current = next;
      return next;
    });
    // Remove all connected edges
    setEdges(prevEdges => {
      const next = prevEdges.filter(e => e.fromNodeId !== id && e.toNodeId !== id);
      edgesRef.current = next;
      return next;
    });
    setSelectedNodeId(prev => (prev === id ? null : prev));
    optionsRef.current?.onSound?.('click');
  }, [recordSnapshot]);

  const addEdge = useCallback((edge: GraphEdge) => {
    // Prevent duplicate edges between same nodes
    setEdges(prevEdges => {
      const exists = prevEdges.some(
        e => e.fromNodeId === edge.fromNodeId && e.toNodeId === edge.toNodeId
      );
      if (exists) return prevEdges;
      recordSnapshot(nodesRef.current, prevEdges);
      optionsRef.current?.onSound?.('connect');
      const next = [...prevEdges, edge];
      edgesRef.current = next;
      return next;
    });
  }, [recordSnapshot]);

  const updateEdge = useCallback((id: string, updates: Partial<GraphEdge>) => {
    setEdges(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...updates } : e));
      edgesRef.current = next;
      return next;
    });
  }, []);

  const removeEdge = useCallback((id: string) => {
    setEdges(prevEdges => {
      recordSnapshot(nodesRef.current, prevEdges);
      const next = prevEdges.filter(e => e.id !== id);
      edgesRef.current = next;
      return next;
    });
    setSelectedEdgeId(prev => (prev === id ? null : prev));
    optionsRef.current?.onSound?.('click');
  }, [recordSnapshot]);

  const selectNode = useCallback((id: string | null) => {
    setSelectedNodeId(id);
    if (id) {
      setSelectedEdgeId(null);
      const found = nodesRef.current.find(n => n.id === id);
      if (found) {
        a11yAnnouncer.announceNodeSelected(found.title, found.subtitle);
      }
    }
  }, []);

  const selectEdge = useCallback((id: string | null) => {
    setSelectedEdgeId(id);
    if (id) {
      setSelectedNodeId(null);
      a11yAnnouncer.announce('Selected pipeline connection');
    }
  }, []);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const previous = undoStackRef.current.pop()!;
    redoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    });
    nodesRef.current = previous.nodes;
    edgesRef.current = previous.edges;
    setNodes(previous.nodes);
    setEdges(previous.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHistoryChangeCount(c => c + 1);
    optionsRef.current?.onSound?.('click');
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current.pop()!;
    undoStackRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodesRef.current)),
      edges: JSON.parse(JSON.stringify(edgesRef.current)),
    });
    nodesRef.current = next.nodes;
    edgesRef.current = next.edges;
    setNodes(next.nodes);
    setEdges(next.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHistoryChangeCount(c => c + 1);
    optionsRef.current?.onSound?.('click');
  }, []);

  const loadTemplate = useCallback((template: ArchitectureTemplate, isUrlBoot = false) => {
    if (!isUrlBoot && nodesRef.current.length > 0) {
      recordSnapshot(nodesRef.current, edgesRef.current);
    }
    if (isUrlBoot) {
      lastUrlTemplateIdRef.current = template.id;
      hasUserChangesRef.current = false;
    } else {
      hasUserChangesRef.current = true;
    }
    nodesRef.current = template.nodes;
    edgesRef.current = template.edges;
    setNodes(template.nodes);
    setEdges(template.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
    optionsRef.current?.onSound?.('connect');
  }, [recordSnapshot]);

  const replaceGraph = useCallback(
    (
      nextNodes: GraphNode[],
      nextEdges?: GraphEdge[],
      opts?: { recordHistory?: boolean; mode?: 'replace' | 'merge' }
    ) => {
      const shouldRecord = opts?.recordHistory !== false;
      const mode = opts?.mode ?? 'replace';

      if (shouldRecord && nodesRef.current.length > 0) {
        recordSnapshot(nodesRef.current, edgesRef.current);
      }

      hasUserChangesRef.current = true;

      if (mode === 'merge' && nodesRef.current.length > 0) {
        const existingIds = new Set(nodesRef.current.map(n => n.id));
        const maxBottomY = Math.max(...nodesRef.current.map(n => n.y + n.height), 100);
        const minIncomingY = nextNodes.length > 0 ? Math.min(...nextNodes.map(n => n.y)) : 0;
        const offsetY = Math.round((maxBottomY - minIncomingY + 120) / 10) * 10;

        const idRemap = new Map<string, string>();
        const mergedNodes: GraphNode[] = [
          ...nodesRef.current,
          ...nextNodes.map((n, idx) => {
            const newId = existingIds.has(n.id) ? `${n.id}-m${Date.now()}-${idx}` : n.id;
            idRemap.set(n.id, newId);
            return {
              ...n,
              id: newId,
              y: n.y + offsetY,
            };
          }),
        ];

        const mergedEdges: GraphEdge[] = [
          ...edgesRef.current,
          ...(nextEdges ?? []).map((e, idx) => ({
            ...e,
            id: `${e.id}-m${Date.now()}-${idx}`,
            fromNodeId: idRemap.get(e.fromNodeId) ?? e.fromNodeId,
            toNodeId: idRemap.get(e.toNodeId) ?? e.toNodeId,
          })),
        ];

        nodesRef.current = mergedNodes;
        edgesRef.current = mergedEdges;
        setNodes(mergedNodes);
        setEdges(mergedEdges);
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        return { nodes: mergedNodes, edges: mergedEdges };
      }

      nodesRef.current = nextNodes;
      setNodes(nextNodes);
      if (nextEdges !== undefined) {
        edgesRef.current = nextEdges;
        setEdges(nextEdges);
      }
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
      return { nodes: nextNodes, edges: nextEdges ?? edgesRef.current };
    },
    [recordSnapshot]
  );

  const clearGraph = useCallback(() => {
    hasUserChangesRef.current = true;
    recordSnapshot(nodesRef.current, edgesRef.current);
    nodesRef.current = [];
    edgesRef.current = [];
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    optionsRef.current?.onSound?.('click');
  }, [recordSnapshot]);

  // Persist active canvas topology to localStorage so reloads never lose user work
  useEffect(() => {
    if (nodes.length === 0) return;
    saveAutosavedCanvas({
      nodes,
      edges,
      updatedAt: Date.now(),
      hasUserChanges: hasUserChangesRef.current,
      lastUrlTemplateId: lastUrlTemplateIdRef.current,
    });
  }, [nodes, edges]);

  // Global keyboard shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+D, Delete, Esc, Tab, Arrow Navigation, Shift+Arrow Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing inside input / textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          redo();
          a11yAnnouncer.announce('Redo last action');
        } else {
          undo();
          a11yAnnouncer.announce('Undo last action');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        redo();
        a11yAnnouncer.announce('Redo last action');
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (selectedNodeId) {
          e.preventDefault();
          duplicateNode(selectedNodeId);
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          const found = nodes.find(n => n.id === selectedNodeId);
          removeNode(selectedNodeId);
          a11yAnnouncer.announce(`Deleted component ${found?.title || selectedNodeId}`);
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
          a11yAnnouncer.announce('Deleted pipeline connection');
        }
      } else if (e.key === 'Escape') {
        setSelectedNodeId(null);
        setSelectedEdgeId(null);
        a11yAnnouncer.announce('Deselected all components');
      } else if (e.key === 'Tab') {
        // Accessible Tab cycling between components on canvas
        e.preventDefault();
        const nextNode = getNextNodeInCycle(nodes, selectedNodeId, e.shiftKey);
        if (nextNode) {
          setSelectedNodeId(nextNode.id);
          setSelectedEdgeId(null);
          a11yAnnouncer.announceNodeSelected(nextNode.title, nextNode.subtitle);
        }
      } else if (selectedNodeId && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        const currentNode = nodes.find(n => n.id === selectedNodeId);
        if (!currentNode) return;

        if (e.shiftKey) {
          // Shift + Arrow: Nudge node position on canvas with grid step
          e.preventDefault();
          const NUDGE_STEP = 20;
          let newX = currentNode.x;
          let newY = currentNode.y;
          if (e.key === 'ArrowLeft') newX = Math.max(0, currentNode.x - NUDGE_STEP);
          if (e.key === 'ArrowRight') newX = currentNode.x + NUDGE_STEP;
          if (e.key === 'ArrowUp') newY = Math.max(0, currentNode.y - NUDGE_STEP);
          if (e.key === 'ArrowDown') newY = currentNode.y + NUDGE_STEP;

          moveNode(currentNode.id, newX, newY);
          a11yAnnouncer.announceNodeMoved(currentNode.title, newX, newY);
        } else {
          // Plain Arrow: Spatial navigation to adjacent node in vector direction
          e.preventDefault();
          const dirMap: Record<string, 'left' | 'right' | 'up' | 'down'> = {
            ArrowLeft: 'left',
            ArrowRight: 'right',
            ArrowUp: 'up',
            ArrowDown: 'down',
          };
          const adjacent = findAdjacentNodeInDirection(currentNode, nodes, dirMap[e.key]);
          if (adjacent) {
            setSelectedNodeId(adjacent.id);
            setSelectedEdgeId(null);
            a11yAnnouncer.announceNodeSelected(adjacent.title, adjacent.subtitle);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, selectedNodeId, selectedEdgeId, removeNode, removeEdge, nodes, moveNode, duplicateNode]);

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
    duplicateNode,
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
    replaceGraph,
    clearGraph,
    setNodes,
    setEdges,
  };
}
