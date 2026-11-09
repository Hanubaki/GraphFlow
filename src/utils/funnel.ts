/**
 * Anonymous funnel measurement.
 *
 * Funnel: Session Started -> Studio Opened -> Studio Engaged -> Pricing Opened -> Checkout Clicked
 * (plus Signup Prompt Clicked). Events come from the existing telemetry bus and are written to the
 * Supabase `funnel_events` table (insert-only for the anon role, see supabase/schema.sql).
 *
 * Privacy: no PII. A random per-tab session id, device class, entry type, referrer hostname and utm_source.
 * Nothing is sent from localhost / LAN hosts or outside production builds.
 */
import { telemetry, TelemetryPayload } from './telemetry';
import { isSupabaseConfigured } from '../services/supabase';

export type FunnelEntry = 'landing' | 'template_link' | 'share_link' | 'embed';

const SINK_EVENTS = new Set<string>([
  'Session Started',
  'Studio Opened',
  'Studio Engaged',
  'Pricing Opened',
  'Checkout Clicked',
  'Signup Prompt Shown',
  'Signup Prompt Clicked',
  'Preset Loaded',
  'Architecture Exported',
]);

/** Telemetry events that count as real use of the studio (first one per session emits "Studio Engaged"). */
const ENGAGEMENT_EVENTS = new Set<string>([
  'Node Created',
  'Node Removed',
  'Simulation Toggled',
  'Simulation Spike Injected',
  'Architecture Imported',
  'Architecture Exported',
]);

export function detectEntry(loc: { search: string; hash: string }): FunnelEntry {
  if (loc.hash.includes('#embed=')) return 'embed';
  if (loc.hash.includes('#share=')) return 'share_link';
  const q = new URLSearchParams(loc.search);
  if (q.get('template') || q.get('blueprint')) return 'template_link';
  return 'landing';
}

export interface FunnelContext {
  sid: string;
  device: 'mobile' | 'desktop';
  entry: FunnelEntry;
  ref: string;
  utm: string;
}

function safeStorage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

let cachedContext: FunnelContext | null = null;

/** Computed once per tab session so the entry/referrer survive the URL clean-up and reloads. */
export function getFunnelContext(): FunnelContext {
  if (cachedContext) return cachedContext;
  const store = safeStorage();
  try {
    const saved = store?.getItem('gf_funnel_ctx');
    if (saved) {
      cachedContext = JSON.parse(saved) as FunnelContext;
      return cachedContext;
    }
  } catch {
    // fall through and rebuild
  }

  let refHost = '';
  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host !== window.location.hostname) refHost = host.slice(0, 80);
    }
  } catch {
    // ignore malformed referrer
  }
  const utm = (new URLSearchParams(window.location.search).get('utm_source') || '').slice(0, 40);
  const mobile =
    window.matchMedia?.('(max-width: 767px)').matches === true ||
    window.matchMedia?.('(pointer: coarse)').matches === true;

  cachedContext = {
    sid: randomId(),
    device: mobile ? 'mobile' : 'desktop',
    entry: detectEntry(window.location),
    ref: refHost,
    utm,
  };
  try {
    store?.setItem('gf_funnel_ctx', JSON.stringify(cachedContext));
  } catch {
    // storage unavailable: context stays in memory for this page load
  }
  return cachedContext;
}

function isInternalHost(host: string): boolean {
  return (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.startsWith('127.') ||
    host.startsWith('192.168.') ||
    host.startsWith('10.') ||
    host === '[::1]'
  );
}

let engagedEmitted = false;

/** Marks the session as engaged once (first real interaction). Safe to call repeatedly. */
export function markEngaged(action: string): void {
  if (engagedEmitted) return;
  engagedEmitted = true;
  telemetry.track('Studio Engaged', { action });
}

function postEvent(payload: TelemetryPayload): void {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) return;
  const ctx = getFunnelContext();
  try {
    void fetch(`${url}/rest/v1/funnel_events`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        sid: ctx.sid,
        event: payload.name,
        device: ctx.device,
        entry: ctx.entry,
        ref: ctx.ref,
        utm: ctx.utm,
        props: payload.properties,
      }),
    }).catch(() => {
      // Analytics must never disrupt the UI
    });
  } catch {
    // ignore
  }
}

let started = false;

/** Subscribes the Supabase sink to the telemetry bus. No-op outside production, on internal hosts or when Supabase is not configured. */
export function startFunnel(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  const ctx = getFunnelContext();

  telemetry.subscribe(event => {
    if (ENGAGEMENT_EVENTS.has(event.name)) markEngaged(event.name);
  });

  const sinkEnabled = import.meta.env.PROD && isSupabaseConfigured && !isInternalHost(window.location.hostname);
  if (sinkEnabled) {
    telemetry.subscribe(event => {
      if (SINK_EVENTS.has(event.name)) postEvent(event);
    });
  }

  // Tracked last so the sink above already receives it
  telemetry.track('Session Started', { entry: ctx.entry });
}
