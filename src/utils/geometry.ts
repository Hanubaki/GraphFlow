import { GraphNode } from '../types/graph';

export interface Point {
  x: number;
  y: number;
}

/**
 * Calculates output port position (right center of node)
 */
export function getNodeOutputPort(node: GraphNode): Point {
  return {
    x: node.x + node.width,
    y: node.y + node.height / 2,
  };
}

/**
 * Calculates input port position (left center of node)
 */
export function getNodeInputPort(node: GraphNode): Point {
  return {
    x: node.x,
    y: node.y + node.height / 2,
  };
}

/**
 * Generates an organic cubic bezier path string between two points
 */
export function createBezierPath(source: Point, target: Point): string {
  const dx = Math.abs(target.x - source.x);
  const dy = Math.abs(target.y - source.y);
  
  // Adaptive control point offset
  const minOffset = 50;
  const curvature = Math.max(minOffset, dx * 0.5);
  
  let cp1x = source.x + curvature;
  let cp1y = source.y;
  let cp2x = target.x - curvature;
  let cp2y = target.y;

  // Handle case where target is to the left of source
  if (target.x < source.x) {
    const loopOffset = Math.max(60, dy * 0.4);
    cp1x = source.x + loopOffset;
    cp2x = target.x - loopOffset;
  }

  return `M ${source.x} ${source.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${target.x} ${target.y}`;
}

/**
 * Evaluates a point along a cubic bezier curve at parameter t (0 <= t <= 1)
 */
export function getBezierPoint(source: Point, target: Point, t: number): Point {
  const dx = Math.abs(target.x - source.x);
  const minOffset = 50;
  const curvature = Math.max(minOffset, dx * 0.5);

  let cp1x = source.x + curvature;
  let cp1y = source.y;
  let cp2x = target.x - curvature;
  let cp2y = target.y;

  if (target.x < source.x) {
    const loopOffset = Math.max(60, Math.abs(target.y - source.y) * 0.4);
    cp1x = source.x + loopOffset;
    cp2x = target.x - loopOffset;
  }

  // De Casteljau's cubic bezier evaluation: B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  const x = uuu * source.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * target.x;
  const y = uuu * source.y + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * target.y;

  return { x, y };
}
