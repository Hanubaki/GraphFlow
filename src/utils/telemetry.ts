/**
 * Privacy-first Product Analytics & Telemetry Engine.
 * Enforces Object-Action taxonomy without PII leakage.
 */

export type TelemetryEventName =
  | 'Node Created'
  | 'Node Removed'
  | 'Simulation Toggled'
  | 'Simulation Spike Injected'
  | 'Architecture Exported'
  | 'Architecture Imported'
  | 'Preset Loaded'
  | 'Modal Opened'
  | 'Checkout Clicked';

export interface TelemetryPayload {
  name: TelemetryEventName;
  properties: Record<string, string | number | boolean>;
  timestamp: number;
}

type TelemetrySubscriber = (event: TelemetryPayload) => void;

class TelemetryService {
  private subscribers: Set<TelemetrySubscriber> = new Set();
  private eventHistory: TelemetryPayload[] = [];
  private readonly maxHistory = 50;

  /**
   * Tracks an analytical event following the Object-Action standard.
   */
  public track(name: TelemetryEventName, properties: Record<string, string | number | boolean> = {}): void {
    // Privacy safeguard: strip any accidentally passed PII
    const sanitizedProps = this.sanitizeProperties(properties);

    const payload: TelemetryPayload = {
      name,
      properties: sanitizedProps,
      timestamp: Date.now(),
    };

    // Buffer in recent in-memory log
    this.eventHistory.push(payload);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Notify registered subscribers non-blockingly
    this.subscribers.forEach(sub => {
      try {
        sub(payload);
      } catch (err) {
        console.warn('[Telemetry] Subscriber execution error:', err);
      }
    });

    // Optional beacon dispatch if endpoint configured
    if (typeof window !== 'undefined' && (window as any).__GRAPHFLOW_TELEMETRY_URL__) {
      try {
        const beaconUrl = (window as any).__GRAPHFLOW_TELEMETRY_URL__;
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon?.(beaconUrl, blob);
      } catch {
        // Silently tolerate beacon failure to never disrupt UI
      }
    }
  }

  /**
   * Subscribes a listener to analytical event dispatches.
   */
  public subscribe(subscriber: TelemetrySubscriber): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Returns recent recorded events in memory.
   */
  public getHistory(): readonly TelemetryPayload[] {
    return [...this.eventHistory];
  }

  /**
   * Clears event history buffer (useful for test isolation).
   */
  public clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * Enforces zero PII by scrubbing potential sensitive keys.
   */
  private sanitizeProperties(props: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    const forbiddenKeys = ['email', 'password', 'token', 'secret', 'apiKey', 'creditCard', 'auth'];
    const clean: Record<string, string | number | boolean> = {};

    for (const [key, value] of Object.entries(props)) {
      const lowerKey = key.toLowerCase();
      const hasSensitiveKey = forbiddenKeys.some(f => lowerKey.includes(f));
      if (!hasSensitiveKey) {
        clean[key] = value;
      }
    }

    return clean;
  }
}

export const telemetry = new TelemetryService();
