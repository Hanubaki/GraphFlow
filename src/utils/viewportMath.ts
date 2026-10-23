import { GraphNode } from '../types/graph';

export interface AutoCenterResult {
  zoom: number;
  pan: { x: number; y: number };
}

/**
 * Calculates optimal bounding box zoom and pan offsets to center graph nodes within viewport.
 * Automatically adapts to mobile viewports (< 768px) where the right inspector is hidden
 * and the left component palette is collapsed to 56px.
 */
export function calculateAutoCenter(
  nodes: GraphNode[],
  windowWidth: number,
  windowHeight: number
): AutoCenterResult | null {
  if (nodes.length === 0) return null;

  const isMobile = windowWidth < 768;
  const leftSidebarOffset = isMobile ? 56 : 0;
  const availableWidth = isMobile
    ? Math.max(240, windowWidth - 56)
    : Math.max(400, windowWidth - 256 - 320);
  const availableHeight = isMobile
    ? Math.max(240, windowHeight - 108)
    : Math.max(300, windowHeight - 56);

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));

  const graphWidth = Math.max(400, maxX - minX);
  const graphHeight = Math.max(300, maxY - minY);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const padding = isMobile ? 32 : 80;
  const minZoom = isMobile ? 0.22 : 0.45;
  const scaleX = (availableWidth - padding) / graphWidth;
  const scaleY = (availableHeight - padding) / graphHeight;
  const targetScale = Math.min(1.0, Math.max(minZoom, Math.min(scaleX, scaleY)));

  const targetPanX = Math.round(leftSidebarOffset + (availableWidth / 2) - (centerX * targetScale));
  const targetPanY = Math.round((availableHeight / 2) - (centerY * targetScale));

  return {
    zoom: targetScale,
    pan: { x: targetPanX, y: targetPanY },
  };
}
