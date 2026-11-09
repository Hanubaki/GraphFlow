import { GraphNode } from '../types/graph';

export interface AutoCenterResult {
  zoom: number;
  pan: { x: number; y: number };
}

const NARROW_CANVAS_PX = 600;
/** Space reserved for the floating mobile HUD bar at the bottom of the canvas. */
const MOBILE_HUD_PX = 52;
/** Below this zoom node text is unreadable on a phone, so Fit stops shrinking and anchors to the graph start. */
const MOBILE_READABLE_MIN_ZOOM = 0.5;

/**
 * Fits nodes into the measured canvas container (pan is container-relative, so no sidebar offset).
 * On narrow canvases it keeps text readable: wide graphs stay at a readable zoom and are anchored
 * to their left/top edge so the user can pan, instead of being shrunk to ~0.2x.
 */
function fitToCanvas(nodes: GraphNode[], width: number, height: number): AutoCenterResult {
  const narrow = width < NARROW_CANVAS_PX;
  const availableWidth = width;
  const availableHeight = narrow ? Math.max(200, height - MOBILE_HUD_PX) : height;
  const padding = narrow ? 24 : 80;
  const minZoom = narrow ? MOBILE_READABLE_MIN_ZOOM : 0.45;

  const minX = Math.min(...nodes.map(n => n.x));
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const minY = Math.min(...nodes.map(n => n.y));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));
  const graphWidth = Math.max(1, maxX - minX);
  const graphHeight = Math.max(1, maxY - minY);

  const fit = Math.min((availableWidth - padding) / graphWidth, (availableHeight - padding) / graphHeight);
  const zoom = Math.min(1.0, Math.max(minZoom, fit));

  const scaledW = graphWidth * zoom;
  const scaledH = graphHeight * zoom;
  const x = scaledW <= availableWidth - padding
    ? (availableWidth - scaledW) / 2 - minX * zoom
    : padding / 2 - minX * zoom;
  const y = scaledH <= availableHeight - padding
    ? (availableHeight - scaledH) / 2 - minY * zoom
    : padding / 2 - minY * zoom;

  return { zoom, pan: { x: Math.round(x), y: Math.round(y) } };
}

/**
 * Calculates optimal bounding box zoom and pan offsets to center graph nodes within viewport.
 * Automatically adapts to mobile viewports (< 768px) where the right inspector is hidden
 * and the left component palette is collapsed to 56px.
 */
export function calculateAutoCenter(
  nodes: GraphNode[],
  windowWidth: number,
  windowHeight: number,
  canvasSize?: { width: number; height: number }
): AutoCenterResult | null {
  if (nodes.length === 0) return null;

  if (canvasSize && canvasSize.width > 0 && canvasSize.height > 0) {
    return fitToCanvas(nodes, canvasSize.width, canvasSize.height);
  }

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
