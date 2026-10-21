import { GraphNode, NodeStatus } from '../types/graph';

export interface LiveNodeMetricUpdate {
  nodeId: string;
  matchedTitle: string;
  throughputRps?: number;
  latencyMs?: number;
  errorRate?: number;
  status?: NodeStatus;
  subtitle?: string;
}

export interface ParsedLiveTelemetryResult {
  sourceFormat: 'json' | 'csv' | 'prometheus';
  timestamp: string;
  updates: LiveNodeMetricUpdate[];
}

function normalizeToken(val: string): string {
  return val
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Matches an incoming metric identifier (id, service name, or ERP department name)
 * to a node currently on the GraphFlow canvas.
 */
export function matchNodeByIdOrTitle(key: string, currentNodes: GraphNode[]): GraphNode | null {
  const raw = key.trim();
  if (!raw) return null;

  // 1. Exact ID match
  const exactId = currentNodes.find(n => n.id.toLowerCase() === raw.toLowerCase());
  if (exactId) return exactId;

  // 2. Exact title match
  const exactTitle = currentNodes.find(n => n.title.toLowerCase() === raw.toLowerCase());
  if (exactTitle) return exactTitle;

  // 3. Normalized substring match (e.g. "Kalite Kontrol" matches "Kalite Kontrol (IQC / QA)")
  const normKey = normalizeToken(raw);
  if (normKey.length < 2) return null;

  const subMatch = currentNodes.find(n => {
    const normTitle = normalizeToken(n.title);
    const normId = normalizeToken(n.id);
    return (
      normTitle.includes(normKey) ||
      normKey.includes(normTitle) ||
      normId.includes(normKey)
    );
  });

  return subMatch || null;
}

function inferStatus(
  explicitStatus: unknown,
  latencyMs?: number,
  errorRate?: number
): NodeStatus | undefined {
  if (typeof explicitStatus === 'string') {
    const s = explicitStatus.trim().toLowerCase();
    if (s === 'down' || s === 'offline' || s === 'critical' || s === 'error' || s === 'durdu') {
      return 'down';
    }
    if (s === 'degraded' || s === 'warning' || s === 'slow' || s === 'darbogaz' || s === 'yogun') {
      return 'degraded';
    }
    if (s === 'healthy' || s === 'ok' || s === 'online' || s === 'up' || s === 'aktif') {
      return 'healthy';
    }
  }
  if (errorRate !== undefined && errorRate >= 15) return 'down';
  if ((errorRate !== undefined && errorRate >= 3) || (latencyMs !== undefined && latencyMs >= 250)) {
    return 'degraded';
  }
  if (latencyMs !== undefined || errorRate !== undefined) {
    return 'healthy';
  }
  return undefined;
}

/**
 * Parses a JSON, CSV/ERP table, or Prometheus text payload and maps metrics to current canvas nodes.
 */
export function parseLiveTelemetryPayload(
  rawInput: string | Record<string, any>,
  currentNodes: GraphNode[]
): ParsedLiveTelemetryResult {
  const nowIso = new Date().toISOString();

  // 1. JSON Object or JSON String
  const isObject = typeof rawInput === 'object' && rawInput !== null;
  const trimmed = isObject ? '' : String(rawInput).trim();

  if (isObject || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed = isObject ? rawInput : JSON.parse(trimmed);
    const updates: LiveNodeMetricUpdate[] = [];

    const rawItems: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.nodes)
        ? parsed.nodes
        : Array.isArray(parsed.metrics)
          ? parsed.metrics
          : Array.isArray(parsed.departments)
            ? parsed.departments
            : typeof parsed === 'object'
              ? Object.entries(parsed)
                  .filter(([k]) => !['timestamp', 'source', 'status'].includes(k))
                  .map(([k, v]) => (typeof v === 'object' && v !== null ? { id: k, ...v } : null))
                  .filter(Boolean)
              : [];

    for (const item of rawItems) {
      if (!item || typeof item !== 'object') continue;
      const key = String(item.id || item.name || item.title || item.department || item.service || '');
      const matched = matchNodeByIdOrTitle(key, currentNodes);
      if (!matched) continue;

      const rpsRaw = item.throughputRps ?? item.rps ?? item.activeOrders ?? item.count ?? item.qps;
      const latRaw = item.latencyMs ?? item.latency ?? item.durationMs ?? item.avgWaitMs;
      const errRaw = item.errorRate ?? item.errors ?? item.rejectRate;

      const throughputRps = Number.isFinite(Number(rpsRaw)) ? Math.max(0, Math.round(Number(rpsRaw))) : undefined;
      const latencyMs = Number.isFinite(Number(latRaw)) ? Math.max(1, Math.round(Number(latRaw))) : undefined;
      const errorRate = Number.isFinite(Number(errRaw)) ? Math.max(0, Number(Number(errRaw).toFixed(2))) : undefined;
      const status = inferStatus(item.status, latencyMs, errorRate);

      updates.push({
        nodeId: matched.id,
        matchedTitle: matched.title,
        throughputRps,
        latencyMs,
        errorRate,
        status,
      });
    }

    return {
      sourceFormat: 'json',
      timestamp: (parsed && typeof parsed.timestamp === 'string' && parsed.timestamp) || nowIso,
      updates,
    };
  }

  // 2. Prometheus Text Exposition Format (e.g., metric_name{service="..."} 123)
  if (/^[a-zA-Z_:][a-zA-Z0-9_:]*\{[^}]+\}\s+[0-9.]+/m.test(trimmed)) {
    const byService = new Map<string, { rps?: number; lat?: number; err?: number }>();
    const lines = trimmed.split(/\r?\n/);

    for (const line of lines) {
      const m = line.trim().match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)\{([^}]+)\}\s+([0-9.]+)/);
      if (!m) continue;
      const [, metricName, labelsRaw, valStr] = m;
      const val = Number(valStr);
      if (!Number.isFinite(val)) continue;

      const labelMatch = labelsRaw.match(/(?:service|department|node|job|app)\s*=\s*"([^"]+)"/i);
      if (!labelMatch) continue;
      const svcName = labelMatch[1];
      const entry = byService.get(svcName) || {};

      if (/(rps|requests_per_second|throughput|orders_total|queue_depth)/i.test(metricName)) {
        entry.rps = val;
      } else if (/(latency|duration|wait_ms|response_time)/i.test(metricName)) {
        entry.lat = val;
      } else if (/(error|reject|fail)/i.test(metricName)) {
        entry.err = val;
      }
      byService.set(svcName, entry);
    }

    const updates: LiveNodeMetricUpdate[] = [];
    byService.forEach((vals, svcName) => {
      const matched = matchNodeByIdOrTitle(svcName, currentNodes);
      if (!matched) return;
      updates.push({
        nodeId: matched.id,
        matchedTitle: matched.title,
        throughputRps: vals.rps !== undefined ? Math.round(vals.rps) : undefined,
        latencyMs: vals.lat !== undefined ? Math.max(1, Math.round(vals.lat)) : undefined,
        errorRate: vals.err !== undefined ? Number(vals.err.toFixed(2)) : undefined,
        status: inferStatus(undefined, vals.lat, vals.err),
      });
    });

    return {
      sourceFormat: 'prometheus',
      timestamp: nowIso,
      updates,
    };
  }

  // 3. CSV / ERP Table Format (Departman;Kapasite_RPS;Sure_ms;Hata_Orani;Durum)
  const lines = trimmed
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'));

  if (lines.length > 0) {
    const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
    const updates: LiveNodeMetricUpdate[] = [];

    for (const line of lines) {
      const cols = line.split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ''));
      const key = cols[0] || '';
      if (/^(departman|department|service|servis|adim|step|node|id|name|title)$/i.test(key)) {
        continue;
      }
      const matched = matchNodeByIdOrTitle(key, currentNodes);
      if (!matched) continue;

      const rpsVal = cols[1] ? Number(cols[1].replace(/[^0-9.]/g, '')) : undefined;
      const latVal = cols[2] ? Number(cols[2].replace(/[^0-9.]/g, '')) : undefined;
      const errVal = cols[3] ? Number(cols[3].replace(/[^0-9.]/g, '')) : undefined;
      const statusVal = cols[4];

      updates.push({
        nodeId: matched.id,
        matchedTitle: matched.title,
        throughputRps: rpsVal !== undefined && Number.isFinite(rpsVal) ? Math.round(rpsVal) : undefined,
        latencyMs: latVal !== undefined && Number.isFinite(latVal) ? Math.max(1, Math.round(latVal)) : undefined,
        errorRate: errVal !== undefined && Number.isFinite(errVal) ? Number(errVal.toFixed(2)) : undefined,
        status: inferStatus(statusVal, latVal, errVal),
      });
    }

    return {
      sourceFormat: 'csv',
      timestamp: nowIso,
      updates,
    };
  }

  return {
    sourceFormat: 'json',
    timestamp: nowIso,
    updates: [],
  };
}

/**
 * Generates a realistic live telemetry payload for the current canvas nodes
 * so users can test live streaming and watch bottleneck shifts in real time.
 */
export function generateSimulatedLiveTick(
  currentNodes: GraphNode[],
  tickCount: number
): { payloadJson: string; parsed: ParsedLiveTelemetryResult } {
  const bottleneckIdx = currentNodes.length > 0 ? tickCount % currentNodes.length : -1;

  const nodesPayload = currentNodes.map((n, idx) => {
    const isHotNode = idx === bottleneckIdx && tickCount % 3 === 1;
    const wave = Math.sin((tickCount + idx) * 0.9);
    const baseLat = Math.max(2, n.latencyMs);
    const baseRps = Math.max(80, n.throughputRps);

    const nextLatency = isHotNode
      ? Math.min(480, Math.round(baseLat * 2.2 + 35))
      : Math.max(2, Math.round(baseLat * (0.85 + wave * 0.18)));

    const nextRps = isHotNode
      ? Math.max(60, Math.round(baseRps * 0.65))
      : Math.max(80, Math.round(baseRps * (0.95 + wave * 0.12)));

    const nextError = isHotNode ? 3.4 : 0.1;
    const nextStatus: NodeStatus = isHotNode ? 'degraded' : 'healthy';

    return {
      id: n.title,
      throughputRps: nextRps,
      latencyMs: nextLatency,
      errorRate: nextError,
      status: nextStatus,
    };
  });

  const payloadObj = {
    timestamp: new Date().toISOString(),
    source: 'Live Telemetry Stream (ERP / Cloud Twin)',
    nodes: nodesPayload,
  };

  const payloadJson = JSON.stringify(payloadObj, null, 2);
  const parsed = parseLiveTelemetryPayload(payloadObj, currentNodes);

  return { payloadJson, parsed };
}

export const SAMPLE_LOGO_ERP_BRIDGE_SCRIPT = `// logo-erp-bridge.mjs — Node.js Read-Only Logo ERP / SQL -> GraphFlow Canlı Köprüsü
// Çalıştırma: node logo-erp-bridge.mjs  ->  GraphFlow Live URL: http://localhost:4040/metrics
import http from 'node:http';

// Not: Gerçek MS SQL bağlantısı için 'mssql' paketi ile LG_001_01_ORFICHE / STFICHE / PRODORD sorgulanabilir.
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Logo ERP Tablolarından (LG_001_01_STFICHE, PRODORD, QASGN) Okunan Canlı Metrik Formatı:
  const payload = {
    timestamp: new Date().toISOString(),
    source: 'Logo Tiger 3 ERP (MS SQL Read-Only View)',
    nodes: [
      { id: 'Satın Alma & Tedarikçi', throughputRps: 520, latencyMs: 12, errorRate: 0.1, status: 'healthy' },
      { id: 'Depo Giriş (Inbound)', throughputRps: 980, latencyMs: 18, errorRate: 0.1, status: 'healthy' },
      { id: 'Ar-Ge Departmanı (R&D)', throughputRps: 540, latencyMs: 21, errorRate: 0.1, status: 'healthy' },
      { id: 'Kalite Kontrol (IQC / QA)', throughputRps: 410, latencyMs: 78, errorRate: 2.4, status: 'degraded' },
      { id: 'Üretim Departmanı (MES)', throughputRps: 760, latencyMs: 34, errorRate: 0.2, status: 'healthy' },
      { id: 'Bakım Departmanı (MRO)', throughputRps: 460, latencyMs: 20, errorRate: 0.1, status: 'healthy' },
      { id: 'ERP Merkezi Stok DB', throughputRps: 1050, latencyMs: 15, errorRate: 0.0, status: 'healthy' },
      { id: 'Depo Çıkış (Outbound)', throughputRps: 890, latencyMs: 19, errorRate: 0.1, status: 'healthy' }
    ]
  };

  res.end(JSON.stringify(payload, null, 2));
});

server.listen(4040, () => console.log('GraphFlow Live ERP Bridge running at http://localhost:4040/metrics'));`;
