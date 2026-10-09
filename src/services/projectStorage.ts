import { GraphNode, GraphEdge } from '../types/graph';

export interface SavedProject {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const STORAGE_KEY = 'graphflow_saved_projects';

export function getSavedProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProject(
  title: string,
  nodes: GraphNode[],
  edges: GraphEdge[],
  description = ''
): SavedProject {
  const projects = getSavedProjects();
  const newProject: SavedProject = {
    id: `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: title.trim() || 'Untitled Architecture',
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes,
    edges,
  };

  const updated = [newProject, ...projects];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newProject;
}

export function deleteSavedProject(id: string): void {
  const projects = getSavedProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

/**
 * Encodes project state into a shareable URL hash string
 */
export function generateShareUrl(nodes: GraphNode[], edges: GraphEdge[]): string {
  const payload = {
    n: nodes.map(n => ({
      id: n.id,
      t: n.type,
      title: n.title,
      sub: n.subtitle,
      x: n.x,
      y: n.y,
      lat: n.latencyMs,
      err: n.errorRate,
      rps: n.throughputRps,
      c: n.color,
      i: n.iconName,
      s: n.status,
    })),
    e: edges.map(e => ({
      id: e.id,
      f: e.fromNodeId,
      to: e.toNodeId,
      p: e.protocol,
      l: e.label,
      lat: e.latencyMs,
    }))
  };

  const jsonStr = JSON.stringify(payload);
  const base64 = btoa(encodeURIComponent(jsonStr));
  return `${window.location.origin}${window.location.pathname}#share=${base64}`;
}

/**
 * Decodes shared project state from URL hash
 */
export function parseShareUrl(): { nodes: GraphNode[]; edges: GraphEdge[] } | null {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.includes('#share=')) return null;

    const base64 = hash.replace('#share=', '');
    const jsonStr = decodeURIComponent(atob(base64));
    const payload = JSON.parse(jsonStr);

    if (!payload || !Array.isArray(payload.n) || !Array.isArray(payload.e)) return null;

    const nodes: GraphNode[] = payload.n.map((n: any) => ({
      id: n.id,
      type: n.t,
      title: n.title,
      subtitle: n.sub,
      x: n.x,
      y: n.y,
      width: 190,
      height: 90,
      status: n.s || 'healthy',
      latencyMs: n.lat || 20,
      errorRate: n.err || 0,
      throughputRps: n.rps || 500,
      color: n.c || '#818cf8',
      iconName: n.i || 'Server',
    }));

    const edges: GraphEdge[] = payload.e.map((e: any) => ({
      id: e.id,
      fromNodeId: e.f,
      toNodeId: e.to,
      protocol: e.p || 'HTTP/REST',
      latencyMs: e.lat || 10,
      errorRate: 0,
      label: e.l,
    }));

    return { nodes, edges };
  } catch {
    return null;
  }
}
