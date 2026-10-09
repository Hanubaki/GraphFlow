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
 * Encodes project state into an embeddable widget URL
 */
export function generateEmbedUrl(nodes: GraphNode[], edges: GraphEdge[]): string {
  const shareUrl = generateShareUrl(nodes, edges);
  return shareUrl.replace('#share=', '#embed=');
}

/**
 * Generates an iframe embed HTML snippet for Notion/blogs/docs
 */
export function generateIframeSnippet(embedUrl: string, height = 480): string {
  return `<iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" style="border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden;" allow="autoplay" loading="lazy"></iframe>`;
}

/**
 * Decodes shared or embedded project state from URL hash
 */
export function parseShareUrl(): { nodes: GraphNode[]; edges: GraphEdge[]; isEmbed?: boolean } | null {
  try {
    const hash = window.location.hash;
    const isEmbed = hash.includes('#embed=');
    const isShare = hash.includes('#share=');
    if (!hash || (!isEmbed && !isShare)) return null;

    const key = isEmbed ? '#embed=' : '#share=';
    const base64Part = hash.split(key)[1]?.split('&')[0];
    if (!base64Part) return null;

    const jsonStr = decodeURIComponent(atob(base64Part));
    const payload = JSON.parse(jsonStr);

    if (!payload || !Array.isArray(payload.n) || !Array.isArray(payload.e)) return null;

    const nodes: GraphNode[] = payload.n
      .filter((n: any) => n && typeof n.id === 'string')
      .map((n: any) => ({
        id: String(n.id).slice(0, 64),
        type: n.t || 'service',
        title: typeof n.title === 'string' ? n.title.slice(0, 50) : 'Service',
        subtitle: typeof n.sub === 'string' ? n.sub.slice(0, 50) : '',
        x: Number.isFinite(n.x) ? Math.max(0, Math.min(5000, n.x)) : 100,
        y: Number.isFinite(n.y) ? Math.max(0, Math.min(5000, n.y)) : 100,
        width: 190,
        height: 90,
        status: (['healthy', 'degraded', 'down'] as const).includes(n.s) ? n.s : 'healthy',
        latencyMs: Number.isFinite(n.lat) ? Math.max(1, Math.min(5000, n.lat)) : 20,
        errorRate: Number.isFinite(n.err) ? Math.max(0, Math.min(100, n.err)) : 0,
        throughputRps: Number.isFinite(n.rps) ? Math.max(0, Math.min(50000, n.rps)) : 500,
        color: typeof n.c === 'string' && n.c.startsWith('#') ? n.c : '#818cf8',
        iconName: typeof n.i === 'string' ? n.i : 'Server',
      }));

    const validNodeIds = new Set(nodes.map(n => n.id));

    const edges: GraphEdge[] = payload.e
      .filter((e: any) => e && validNodeIds.has(e.f) && validNodeIds.has(e.to))
      .map((e: any) => ({
        id: typeof e.id === 'string' ? e.id.slice(0, 64) : `edge-${Math.random().toString(36).slice(2, 8)}`,
        fromNodeId: e.f,
        toNodeId: e.to,
        protocol: e.p || 'HTTP/REST',
        latencyMs: Number.isFinite(e.lat) ? Math.max(1, Math.min(5000, e.lat)) : 10,
        errorRate: 0,
        label: typeof e.l === 'string' ? e.l.slice(0, 30) : undefined,
      }));

    return { nodes, edges, isEmbed };
  } catch {
    return null;
  }
}
