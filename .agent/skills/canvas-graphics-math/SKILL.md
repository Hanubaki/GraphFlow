---
name: canvas-graphics-math
description: >-
  Pure mathematical formulas, cubic and quadratic bezier calculus, tangent vectors, De Casteljau evaluation,
  bounding box intersections, matrix transforms, and SVG path generation. Use when implementing canvas interactions,
  coordinate mapping, animations, or vector geometries.
---

# Canvas Geometry & Graphics Mathematics Runbook

High-performance mathematical foundations for interactive graphs, animated connections, and 2D canvas engines.

## 1. Cubic Bezier Evaluation (De Casteljau / Direct Form)

Given start point $P_0$, control points $P_1, P_2$, and end point $P_3$, the coordinate at parameter $t \in [0, 1]$ is:

$$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3$$

```typescript
export function evaluateCubicBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}
```

## 2. Tangent & Normal Angle Calculation

To orient moving packets, arrows, or particle markers along a curve, calculate the derivative $B'(t)$:

$$B'(t) = 3(1-t)^2 (P_1 - P_0) + 6(1-t)t (P_2 - P_1) + 3t^2 (P_3 - P_2)$$

Angle in radians: $\theta = \operatorname{atan2}(B'_y(t), B'_x(t))$.

## 3. Screen-to-World Coordinate Transformations

When converting mouse client coordinates to an infinite panning and zooming canvas:

$$\text{world}_X = \frac{\text{client}_X - \text{canvasRect}_X - \text{pan}_X}{\text{zoom}}$$
$$\text{world}_Y = \frac{\text{client}_Y - \text{canvasRect}_Y - \text{pan}_Y}{\text{zoom}}$$

Always clamp zoom levels to realistic bounds (e.g. $0.2 \le \text{zoom} \le 3.0$).
