import { GraphNode } from '../types/graph';

export interface Point {
  x: number;
  y: number;
}

export interface BezierControlPoints {
  p0: Point;
  p1: Point;
  p2: Point;
  p3: Point;
}

export interface Vector2D {
  dx: number;
  dy: number;
  angleRad: number;
  angleDeg: number;
  magnitude: number;
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
 * Computes optimal cubic bezier control points between two connection anchors.
 * Handles standard forward routing, tight proximity, and backward loop-backs.
 */
export function computeBezierControlPoints(source: Point, target: Point): BezierControlPoints {
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  // Standard forward routing (target is to the right of source)
  if (target.x >= source.x) {
    const curvature = Math.max(50, absDx * 0.5);
    return {
      p0: source,
      p1: { x: source.x + curvature, y: source.y },
      p2: { x: target.x - curvature, y: target.y },
      p3: target,
    };
  }

  // Backward feedback edge (target is to the left of source)
  // Apply horizontal loop-around with adaptive vertical deflection to avoid self-collapsing wire
  const horizontalOffset = Math.max(60, absDx * 0.4);
  const verticalDeflection = absDy < 30 ? 50 : Math.sign(dy || 1) * Math.max(30, absDy * 0.2);

  return {
    p0: source,
    p1: { x: source.x + horizontalOffset, y: source.y + verticalDeflection },
    p2: { x: target.x - horizontalOffset, y: target.y - verticalDeflection },
    p3: target,
  };
}

/**
 * Generates an SVG cubic bezier path string (M p0 C p1, p2, p3)
 */
export function createBezierPath(source: Point, target: Point): string {
  const { p0, p1, p2, p3 } = computeBezierControlPoints(source, target);
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

/**
 * Pure Bernstein polynomial form of cubic bezier curve:
 * B(t) = (1-t)^3*P0 + 3(1-t)^2*t*P1 + 3(1-t)*t^2*P2 + t^3*P3
 */
export function evaluateCubicBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/**
 * Evaluates a point along a cubic bezier curve at parameter t (0 <= t <= 1)
 */
export function getBezierPoint(source: Point, target: Point, t: number): Point {
  const { p0, p1, p2, p3 } = computeBezierControlPoints(source, target);
  return evaluateCubicBezier(p0, p1, p2, p3, t);
}

/**
 * Computes the tangent derivative vector B'(t) and orientation angle along the curve:
 * B'(t) = 3(1-t)^2(P1 - P0) + 6(1-t)t(P2 - P1) + 3t^2(P3 - P2)
 */
export function getBezierTangent(source: Point, target: Point, t: number): Vector2D {
  const { p0, p1, p2, p3 } = computeBezierControlPoints(source, target);
  const u = 1 - t;

  const c0 = 3 * u * u;
  const c1 = 6 * u * t;
  const c2 = 3 * t * t;

  const dx = c0 * (p1.x - p0.x) + c1 * (p2.x - p1.x) + c2 * (p3.x - p2.x);
  const dy = c0 * (p1.y - p0.y) + c1 * (p2.y - p1.y) + c2 * (p3.y - p2.y);
  const magnitude = Math.sqrt(dx * dx + dy * dy);
  const angleRad = Math.atan2(dy, dx);
  const angleDeg = (angleRad * 180) / Math.PI;

  return {
    dx,
    dy,
    angleRad,
    angleDeg,
    magnitude,
  };
}
