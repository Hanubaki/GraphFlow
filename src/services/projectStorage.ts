import { GraphNode, GraphEdge } from '../types/graph';
import { sanitizeArchitectureImport } from '../utils/securitySanitizer';
import { parseInfrastructureToTopology } from '../utils/importTopology';

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
 * Encodes project state into a shareable URL hash string.
 * Uses a clean human-readable slug (#share=Node_A~Node_B~Node_C) for imported topologies
 * and Base64 for custom studio topologies.
 */
export function generateShareUrl(nodes: GraphNode[], edges: GraphEdge[]): string {
  const isImportedTopology =
    nodes.length >= 2 &&
    nodes.every(n => /^(d\d+|drawio-|excal-|mmd-|erp-)/.test(n.id));

  if (isImportedTopology) {
    const cleanSlug = nodes
      .map(n =>
        n.title
          .replace(/[()[\]{}]/g, '')
          .trim()
          .replace(/\s+/g, '_')
      )
      .join('~');
    return `${window.location.origin}${window.location.pathname}#share=${cleanSlug}`;
  }

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
    })),
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

    // 1. Human-readable slug format (#share=Node_A~Node_B~Node_C)
    if (base64Part.includes('~')) {
      const titles = base64Part
        .split('~')
        .map(part => decodeURIComponent(part).replace(/_/g, ' ').trim())
        .filter(Boolean);
      if (titles.length >= 2) {
        const csvLines: string[] = [];
        for (let i = 0; i < titles.length - 1; i++) {
          csvLines.push(`${titles[i]};${titles[i + 1]}`);
        }
        const imported = parseInfrastructureToTopology(csvLines.join('\n'), 'share.csv');
        if (imported.nodes.length > 0) {
          return { nodes: imported.nodes, edges: imported.edges, isEmbed };
        }
      }
    }

    const jsonStr = decodeURIComponent(atob(base64Part));
    const payload = JSON.parse(jsonStr);
    const { nodes, edges } = sanitizeArchitectureImport(payload);
    if (nodes.length === 0) return null;

    return { nodes, edges, isEmbed };
  } catch {
    return null;
  }
}
