import { GraphNode } from '../types/graph';

export interface AutoCenterResult {
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Calculates optimal bounding box zoom and pan offsets to center graph nodes within viewport.
 */
export function calculateAutoCenter(
  nodes: GraphNode[],
  windowWidth: number,
  windowHeight: number
): AutoCenterResult | null {
  if (nodes.length === 0) return null;

  const availableWidth = Math.max(400, windowWidth - 256 - 320);
  const availableHeight = Math.max(300, windowHeight - 56);

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));

  const graphWidth = Math.max(400, maxX - minX);
  const graphHeight = Math.max(300, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const scaleX = (availableWidth - 80) / graphWidth;
  const scaleY = (availableHeight - 80) / graphHeight;
  const targetScale = Math.min(1.0, Math.max(0.45, Math.min(scaleX, scaleY)));

  const targetPanX = Math.round((availableWidth / 2) - (centerX * targetScale));
  const targetPanY = Math.round((availableHeight / 2) - (centerY * targetScale));

  return {
    zoom: targetScale,
    pan: { x: targetPanX, y: targetPanY },
  };
}
