import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../constants/templates';
import { calculateAutoCenter } from '../utils/viewportMath';
import fs from 'fs';
import path from 'path';

describe('Test-Driven Verification: Auto-Centering Math & Responsive Viewport', () => {
  const defaultNodes = TEMPLATES[0].nodes;

  it('returns null when nodes array is empty', () => {
    const result = calculateAutoCenter([], 1920, 1080);
    expect(result).toBeNull();
  });

  it('guarantees rightmost nodes are never clipped on a 1366x768 laptop display', () => {
    const result = calculateAutoCenter(defaultNodes, 1366, 768);
    expect(result).not.toBeNull();
    if (!result) return;

    const availableWidth = Math.max(400, 1366 - 256 - 320); // 790px
    const minX = Math.min(...defaultNodes.map(n => n.x));
    const maxX = Math.max(...defaultNodes.map(n => n.x + n.width));

    const rightmostScreenX = result.pan.x + maxX * result.zoom;
    const leftmostScreenX = result.pan.x + minX * result.zoom;

    // Both leftmost and rightmost points must be strictly within available canvas bounds
    expect(leftmostScreenX).toBeGreaterThanOrEqual(0);
    expect(rightmostScreenX).toBeLessThanOrEqual(availableWidth);
    expect(result.zoom).toBeLessThan(1.0);
    expect(result.zoom).toBeGreaterThanOrEqual(0.45);
  });

  it('preserves near-native ~0.96x zoom and centers graph on a 1920x1080 desktop display', () => {
    const result = calculateAutoCenter(defaultNodes, 1920, 1080);
    expect(result).not.toBeNull();
    if (!result) return;

    const availableWidth = Math.max(400, 1920 - 256 - 320); // 1344px
    const minX = Math.min(...defaultNodes.map(n => n.x));
    const maxX = Math.max(...defaultNodes.map(n => n.x + n.width));

    expect(result.zoom).toBeCloseTo(0.965, 2);

    const rightmostScreenX = result.pan.x + maxX * result.zoom;
    const leftmostScreenX = result.pan.x + minX * result.zoom;

    // Margins on both sides
    expect(leftmostScreenX).toBeGreaterThanOrEqual(40);
    expect(rightmostScreenX).toBeLessThan(availableWidth);
  });

  it('verifies vite.config.ts defines code-split manualChunks for webperf optimization', () => {
    const configPath = path.resolve(__dirname, '../../vite.config.ts');
    const content = fs.readFileSync(configPath, 'utf-8');

    expect(content).toContain('vendor-react');
    expect(content).toContain('vendor-supabase');
    expect(content).toContain('vendor-icons');
    expect(content).toContain('manualChunks');
  });

  it('verifies TopBar telemetry is scoped to 2xl screens to prevent horizontal overflow', () => {
    const topBarPath = path.resolve(__dirname, '../components/Toolbar/TopBar.tsx');
    const content = fs.readFileSync(topBarPath, 'utf-8');

    expect(content).toContain('hidden 2xl:flex items-center gap-2 font-mono text-xs');
  });

  it('verifies LandingPage hero teaser uses responsive 4-column grid', () => {
    const landingPath = path.resolve(__dirname, '../components/Landing/LandingPage.tsx');
    const content = fs.readFileSync(landingPath, 'utf-8');

    expect(content).toContain('grid grid-cols-2 lg:grid-cols-4');
  });
});
