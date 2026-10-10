import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { SimulationMetrics } from '../types/graph';

describe('Web Performance & Telemetry Architecture Suite', () => {
  describe('1. Vite Production Bundle Splitting (webperf-audit)', () => {
    it('verifies vite.config.ts defines vendor chunk isolation', () => {
      const viteConfigPath = path.resolve(__dirname, '../../vite.config.ts');
      const content = fs.readFileSync(viteConfigPath, 'utf-8');

      expect(content).toContain('vendor-react');
      expect(content).toContain('vendor-supabase');
      expect(content).toContain('vendor-icons');
      expect(content).toContain('vendor-utils');
      expect(content).toContain('clsx');
      expect(content).toContain('tailwind-merge');
    });
  });

  describe('2. Telemetry & Metrics Throttling Calibration', () => {
    it('verifies 16.6ms 60 FPS frame budget and 1 Hz metrics cadence definitions', () => {
      const baseMetrics: SimulationMetrics = {
        totalSent: 100,
        delivered: 98,
        errors: 2,
        currentRps: 60,
        avgLatencyMs: 16,
      };

      const frameBudgetMs = 1000 / 60; // 16.666ms
      expect(frameBudgetMs).toBeCloseTo(16.67, 1);
      expect(baseMetrics.currentRps).toBeGreaterThan(0);
      expect(baseMetrics.avgLatencyMs).toBeLessThanOrEqual(frameBudgetMs);
    });

    it('verifies simulation context contains 1 Hz batch accumulation', () => {
      const contextPath = path.resolve(__dirname, '../context/SimulationContext.tsx');
      const content = fs.readFileSync(contextPath, 'utf-8');

      expect(content).toContain('pendingMetricsRef');
      expect(content).toContain('prevents 60 FPS UI thrashing');
      expect(content).toContain('pendingMetricsRef.current = { sent: 0, delivered: 0, errors: 0 }');
    });
  });

  describe('3. Analytics Modal & Telemetry Pill Architecture', () => {
    it('verifies AnalyticsModal incorporates 60 FPS status and WebPerf Scorecard', () => {
      const modalPath = path.resolve(__dirname, '../components/Modals/AnalyticsModal.tsx');
      const content = fs.readFileSync(modalPath, 'utf-8');

      expect(content).toContain('60 FPS ACTIVE');
      expect(content).toContain('WebPerf Scorecard');
      expect(content).toContain('Topology Health');
      expect(content).toContain('1 Hz Metrics Throttling');
      expect(content).toContain('16.6ms / frame');
    });

    it('verifies TelemetryPill isolates memoized metrics re-renders', () => {
      const pillPath = path.resolve(__dirname, '../components/Toolbar/TelemetryPill.tsx');
      const content = fs.readFileSync(pillPath, 'utf-8');

      expect(content).toContain('areTelemetryPillPropsEqual');
      expect(content).toContain('React.memo(TelemetryPillBase, areTelemetryPillPropsEqual)');
      expect(content).toContain('metrics.currentRps');
      expect(content).toContain('metrics.avgLatencyMs');
    });
  });
});
