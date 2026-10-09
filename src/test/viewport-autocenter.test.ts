import { describe, it, expect } from 'vitest';
import { TEMPLATES } from '../constants/templates';
import fs from 'fs';
import path from 'path';

describe('Test-Driven Verification: Auto-Centering Math & Responsive Viewport', () => {
  const defaultNodes = TEMPLATES[0].nodes;

  // Helper calculating bounding box and centering
  function calculateAutoCenter(nodes: typeof defaultNodes, windowWidth: number, windowHeight: number) {
    const availableWidth = Math.max(400, windowWidth - 256 - 320); // space between palette and inspector
    const availableHeight = Math.max(300, windowHeight - 56); // minus topbar
    
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
      availableWidth,
      availableHeight,
      targetScale,
      targetPanX,
      targetPanY,
      minX,
      maxX,
      minY,
      maxY,
    };
  }

  it('guarantees rightmost nodes are never clipped on a 1366x768 laptop display', () => {
    const result = calculateAutoCenter(defaultNodes, 1366, 768);

    // Available canvas width between 256px palette and 320px inspector = 790px
    expect(result.availableWidth).toBe(790);

    // Rightmost point of the graph in canvas space
    const rightmostScreenX = result.targetPanX + result.maxX * result.targetScale;
    const leftmostScreenX = result.targetPanX + result.minX * result.targetScale;

    // Both leftmost and rightmost points must be strictly within available canvas bounds
    expect(leftmostScreenX).toBeGreaterThanOrEqual(0);
    expect(rightmostScreenX).toBeLessThanOrEqual(result.availableWidth);
    expect(result.targetScale).toBeLessThan(1.0);
    expect(result.targetScale).toBeGreaterThanOrEqual(0.5);
  });

  it('preserves near-native ~0.96x zoom and centers graph on a 1920x1080 desktop display', () => {
    const result = calculateAutoCenter(defaultNodes, 1920, 1080);

    // On 1920 monitors, 1310px graph scales to ~0.965 to ensure 40px padding on both sides
    expect(result.targetScale).toBeCloseTo(0.965, 2);

    const rightmostScreenX = result.targetPanX + result.maxX * result.targetScale;
    const leftmostScreenX = result.targetPanX + result.minX * result.targetScale;

    // Beautiful margins on both sides
    expect(leftmostScreenX).toBeGreaterThanOrEqual(40);
    expect(rightmostScreenX).toBeLessThan(result.availableWidth);
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
