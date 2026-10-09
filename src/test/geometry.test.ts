import { describe, it, expect } from 'vitest';
import { getNodeOutputPort, getNodeInputPort, createBezierPath, getBezierPoint } from '../utils/geometry';
import { GraphNode } from '../types/graph';

describe('Geometry Engine', () => {
  const mockNode: GraphNode = {
    id: 'test-node',
    type: 'service',
    title: 'Test Service',
    subtitle: 'Microservice',
    x: 100,
    y: 200,
    width: 200,
    height: 100,
    status: 'healthy',
    latencyMs: 20,
    errorRate: 0,
    throughputRps: 500,
    color: '#a855f7',
    iconName: 'Server',
  };

  it('calculates output port at right center of node', () => {
    const port = getNodeOutputPort(mockNode);
    expect(port.x).toBe(300); // 100 + 200
    expect(port.y).toBe(250); // 200 + 50
  });

  it('calculates input port at left center of node', () => {
    const port = getNodeInputPort(mockNode);
    expect(port.x).toBe(100);
    expect(port.y).toBe(250);
  });

  it('creates valid SVG cubic bezier curve command', () => {
    const source = { x: 100, y: 100 };
    const target = { x: 400, y: 200 };
    const path = createBezierPath(source, target);
    expect(path).toMatch(/^M 100 100 C \d+ 100, \d+ 200, 400 200$/);
  });

  it('evaluates cubic bezier point at t=0 to be source point', () => {
    const source = { x: 50, y: 50 };
    const target = { x: 250, y: 250 };
    const pt = getBezierPoint(source, target, 0);
    expect(Math.round(pt.x)).toBe(50);
    expect(Math.round(pt.y)).toBe(50);
  });

  it('evaluates cubic bezier point at t=1 to be target point', () => {
    const source = { x: 50, y: 50 };
    const target = { x: 250, y: 250 };
    const pt = getBezierPoint(source, target, 1);
    expect(Math.round(pt.x)).toBe(250);
    expect(Math.round(pt.y)).toBe(250);
  });

  it('evaluates cubic bezier midpoint smoothly between bounds', () => {
    const source = { x: 0, y: 0 };
    const target = { x: 200, y: 200 };
    const pt = getBezierPoint(source, target, 0.5);
    expect(pt.x).toBeGreaterThan(0);
    expect(pt.x).toBeLessThan(200);
    expect(pt.y).toBeGreaterThan(0);
    expect(pt.y).toBeLessThan(200);
  });
});
