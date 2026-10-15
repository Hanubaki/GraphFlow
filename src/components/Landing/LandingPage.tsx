import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Cpu,
  Zap,
  ArrowRight,
  Check,
  Github,
  User as UserIcon,
  Globe,
  Network,
  Layers,
  Database,
  Mail,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  useSurgeSimulation,
  consumerLagSeconds,
  drainEtaSeconds,
  gatewayP99Ms,
  surgePhase,
  CONSUMER_CAPACITY,
  BASE_RATE,
  SURGE_RATE,
  TICK_SECONDS,
  type SurgePhase,
  type SurgeState,
} from './surgeModel';
import { DEMO_CANVAS, DEMO_EDGES, DEMO_NODES, demoEdgePath } from './demoGraph';
import { generateDockerCompose, generateKubernetesManifests, generateMarkdownDoc, generateTerraform } from '../../utils/export';
import { generateShareUrl } from '../../services/projectStorage';
import { TEMPLATES } from '../../constants/templates';
import { analyzeTopologyDiagnostics } from '../../utils/simulationPhysics';
import { ArchitectureTemplate } from '../../types/graph';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenPricing: () => void;
  onOpenAuth?: () => void;
  onSelectBlueprint?: (template: ArchitectureTemplate) => void;
}

const GITHUB_URL = 'https://github.com/Hanubaki/GraphFlow';
const CONTACT_MAILTO = 'mailto:berkeakdemir5855@gmail.com?subject=GraphFlow%20Engineering%20Team%20Access%20Request';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/* Shared type and control styles ------------------------------------ */

const display = 'font-semibold tracking-[-0.035em] [font-stretch:112%] text-slate-50';
const ring =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950';
const btnPrimary = `inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg bg-slate-50 hover:bg-white text-slate-950 text-sm font-medium transition-colors ${ring}`;
const btnSecondary = `inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-200 text-sm font-medium transition-colors ${ring}`;

const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
};

/* ------------------------------------------------------------------ */
/* Studio frame: the live demo, drawn like the real canvas             */
/* ------------------------------------------------------------------ */

const NODE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Network,
  Zap,
  Layers,
  Cpu,
  Database,
};

/** Live rate (msg/s) carried by each demo edge. */
const edgeRate = (edgeId: string, s: SurgeState): number => {
  switch (edgeId) {
    case 'e1':
    case 'e3':
      return s.producerRate;
    case 'e2':
      return s.producerRate * 1.6;
    default:
      return s.consumerRate;
  }
};

const EdgePackets: React.FC<{ d: string; rate: number; length: number; reduced: boolean }> = ({ d, rate, length, reduced }) => {
  const speed = (60 + rate * 0.06) * (reduced ? 0.3 : 1); // px per second
  const dur = Math.max(0.4, Math.round((length / speed) * 10) / 10);
  const count = Math.max(1, Math.round(length / 48));
  return (
    <g key={dur}>
      {Array.from({ length: count }, (_, i) => (
        <circle key={i} r="2.5" fill="#e1e3e6">
          <animateMotion dur={`${dur}s`} begin={`-${((dur / count) * i).toFixed(2)}s`} repeatCount="indefinite" path={d} />
        </circle>
      ))}
    </g>
  );
};

const nodeMetrics = (id: string, s: SurgeState): [string, string] => {
  const p99 = gatewayP99Ms(s);
  switch (id) {
    case 'storefront':
      return [`${fmt(s.producerRate)}/s`, `${p99 + 9} ms`];
    case 'api-gateway':
      return [`${fmt(s.producerRate)}/s`, `p99 ${p99} ms`];
    case 'session-cache':
      return [`${fmt(s.producerRate * 1.6)}/s`, '2 ms'];
    case 'orders-created':
      return [`${fmt(s.depth)} queued`, `${consumerLagSeconds(s).toFixed(1)} s lag`];
    case 'order-worker':
      return [`${fmt(s.consumerRate)}/s`, `${Math.round((s.consumerRate / CONSUMER_CAPACITY) * 100)}%`];
    default:
      return [`${fmt(s.consumerRate)} w/s`, '12 ms'];
  }
};

const nodeDegraded = (id: string, s: SurgeState): boolean => {
  if (id === 'api-gateway') return surgePhase(s) === 'surging';
  if (id === 'orders-created') return consumerLagSeconds(s) > 1;
  if (id === 'order-worker') return s.consumerRate >= CONSUMER_CAPACITY * 0.99;
  return false;
};

/** Backlog over the last 30 s. */
const LagChart: React.FC<{ history: number[]; active: boolean }> = ({ history, active }) => {
  const w = 300;
  const h = 72;
  const max = Math.max(10000, ...history);
  const pts = history.map((d, i) => `${((i / (history.length - 1)) * w).toFixed(2)},${(h - 2 - (d / max) * (h - 8)).toFixed(2)}`);
  const line = `M${pts.join(' L')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-[72px] block" aria-hidden="true">
      <line x1="0" x2={w} y1={h - 2} y2={h - 2} stroke="#24262a" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {active && <path d={`${line} L${w},${h} L0,${h} Z`} fill="rgba(251,191,36,0.08)" />}
      <path d={line} fill="none" strokeWidth="1.5" vectorEffect="non-scaling-stroke" stroke={active ? '#fcd34d' : '#4e5158'} />
    </svg>
  );
};

const phaseCopy = (phase: SurgePhase, s: SurgeState): string => {
  if (phase === 'surging') {
    return `Producers are ${fmt(SURGE_RATE - CONSUMER_CAPACITY)} msg/s ahead of the consumer. The topic is backing up.`;
  }
  if (phase === 'draining') {
    return `Surge over. The worker is clearing the backlog at ${fmt(CONSUMER_CAPACITY - BASE_RATE)} msg/s.`;
  }
  if (s.lastDrainSeconds !== null) {
    return `Last surge peaked at ${fmt(s.peakDepth)} messages and took ${s.lastDrainSeconds.toFixed(1)} s to drain.`;
  }
  return `${fmt(BASE_RATE)} msg/s in, capacity for ${fmt(CONSUMER_CAPACITY)}. Inject a surge and watch orders.created.`;
};

const StudioFrame: React.FC = () => {
  const { state, triggerSurge } = useSurgeSimulation();
  const reduced = usePrefersReducedMotion();
  const frameRef = useRef<HTMLDivElement>(null);
  const userTriggered = useRef(false);

  // Play one surge the first time the frame is actually on screen.
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let timer: number | undefined;
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(e => e.isIntersecting)) {
          observer.disconnect();
          timer = window.setTimeout(() => {
            if (!userTriggered.current) triggerSurge();
          }, 1200);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [triggerSurge]);

  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => {
      const next = Math.min(1, entry.contentRect.width / (DEMO_CANVAS.width + 32));
      setScale(prev => (Math.abs(prev - next) < 0.005 ? prev : next));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const edges = useMemo(
    () =>
      DEMO_EDGES.map(e => {
        const d = demoEdgePath(e);
        const nums = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
        const length = Math.hypot(nums[6] - nums[0], nums[7] - nums[1]) * 1.15;
        return { ...e, d, length };
      }),
    [],
  );

  const phase = surgePhase(state);
  const surging = phase === 'surging';
  const eta = drainEtaSeconds(state);
  const secondsLeft = Math.ceil(state.surgeTicksRemaining * TICK_SECONDS);
  const backlogActive = phase !== 'steady' || state.history.some(d => d > 0);

  const status =
    phase === 'surging'
      ? `Surge · ${secondsLeft} s left`
      : phase === 'draining'
        ? `Draining${eta !== null ? ` · ~${eta.toFixed(0)} s` : ''}`
        : 'Running';

  return (
    <div ref={frameRef} className="rounded-xl border border-slate-800 bg-slate-950 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)] overflow-hidden">
      {/* Window chrome */}
      <div className="h-11 px-3 md:px-4 flex items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-2 min-w-0 text-[13px]">
          <span className="w-5 h-5 rounded bg-cyan-500 grid place-items-center shrink-0">
            <Cpu className="w-3 h-3 text-slate-950" aria-hidden="true" />
          </span>
          <span className="text-slate-400 truncate">checkout</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-100 truncate">production</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-2 text-[12px] text-slate-300">
            <span className={`w-1.5 h-1.5 rounded-full ${phase === 'steady' ? 'bg-emerald-400' : 'bg-amber-400'}`} aria-hidden="true" />
            <span className="font-mono tabular-nums">{status}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              userTriggered.current = true;
              triggerSurge();
            }}
            disabled={surging}
            className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-[12px] font-medium text-slate-100 transition-colors disabled:cursor-not-allowed disabled:border-amber-500/40 disabled:text-amber-200 disabled:bg-amber-950/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{surging ? 'Surging' : 'Inject surge'}</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_288px]">
        {/* Canvas */}
        <div ref={canvasWrapRef} className="relative overflow-hidden bg-grid-dots">
          <div
            className="relative mx-auto"
            style={{ width: (DEMO_CANVAS.width + 32) * scale, height: (DEMO_CANVAS.height + 32) * scale }}
          >
            <div
              className="absolute left-0 top-0 origin-top-left"
              style={{
                width: DEMO_CANVAS.width,
                height: DEMO_CANVAS.height,
                margin: 16 * scale,
                transform: scale < 1 ? `scale(${scale})` : undefined,
              }}
            >
              <svg
                className="absolute inset-0"
                width={DEMO_CANVAS.width}
                height={DEMO_CANVAS.height}
                viewBox={`0 0 ${DEMO_CANVAS.width} ${DEMO_CANVAS.height}`}
                aria-hidden="true"
              >
                {edges.map(e => (
                  <path key={e.id} d={e.d} fill="none" stroke="#35373c" strokeWidth="1.5" />
                ))}
                {edges.map(e => (
                  <EdgePackets key={e.id} d={e.d} length={e.length} rate={edgeRate(e.id, state)} reduced={reduced} />
                ))}
              </svg>

              {DEMO_NODES.map(n => {
                const Icon = NODE_ICONS[n.iconName] ?? Cpu;
                const degraded = nodeDegraded(n.id, state);
                const selected = n.id === 'orders-created';
                const [a, b] = nodeMetrics(n.id, state);
                return (
                  <div
                    key={n.id}
                    className={`absolute rounded-lg border bg-dark-900 overflow-hidden transition-colors duration-300 ${
                      selected
                        ? 'border-cyan-400/60 ring-1 ring-cyan-400/40'
                        : degraded
                          ? 'border-amber-500/50'
                          : 'border-slate-800'
                    }`}
                    style={{ left: n.x, top: n.y, width: n.width, height: n.height }}
                  >
                    <div className="h-[3px]" style={{ backgroundColor: n.color }} aria-hidden="true" />
                    <div className="px-2.5 pt-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-md border border-slate-800 bg-dark-950 grid place-items-center shrink-0"
                          style={{ color: n.color }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-[12px] font-semibold leading-tight text-slate-50 truncate">{n.title}</div>
                          <div className="text-[11px] leading-tight text-slate-400 truncate">{n.subtitle}</div>
                        </div>
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${degraded ? 'bg-amber-400' : 'bg-emerald-400'}`}
                          title={degraded ? 'Degraded' : 'Healthy'}
                        />
                      </div>
                      <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] tabular-nums text-slate-300">
                        <span>{a}</span>
                        <span className={degraded ? 'text-amber-300' : ''}>{b}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspector */}
        <aside className="border-t lg:border-t-0 lg:border-l border-slate-800 p-5 flex flex-col gap-5" aria-label="Inspector">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md border border-slate-800 bg-dark-900 grid place-items-center text-[#f59e0b]">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-50">orders.created</div>
              <div className="text-[12px] text-slate-400">Kafka topic, 6 partitions</div>
            </div>
          </div>

          <dl className="text-[13px] divide-y divide-slate-800/80 border-y border-slate-800/80">
            {[
              ['Queued', fmt(state.depth)],
              ['Consumer lag', `${consumerLagSeconds(state).toFixed(1)} s`],
              ['In', `${fmt(state.producerRate)} msg/s`],
              ['Out', `${fmt(state.consumerRate)} msg/s`],
              [
                phase === 'draining' ? 'Drain ETA' : 'Last drain',
                phase === 'draining'
                  ? eta !== null
                    ? `${eta.toFixed(1)} s`
                    : '—'
                  : state.lastDrainSeconds !== null
                    ? `${state.lastDrainSeconds.toFixed(1)} s`
                    : '—',
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-2">
                <dt className="text-slate-400">{k}</dt>
                <dd className="font-mono tabular-nums text-slate-100">{v}</dd>
              </div>
            ))}
          </dl>

          <div>
            <div className="flex items-baseline justify-between text-[12px] text-slate-400 mb-2">
              <span>Backlog, last 30 s</span>
              <span className="font-mono tabular-nums text-slate-300">peak {fmt(state.peakDepth)}</span>
            </div>
            <LagChart history={state.history} active={backlogActive} />
          </div>

          <p className="text-[13px] leading-relaxed text-slate-300" aria-live="polite">
            {phaseCopy(phase, state)}
          </p>
        </aside>
      </div>

      {/* Telemetry strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-800 border-t border-slate-800">
        {[
          ['Inbound', `${fmt(state.producerRate)} msg/s`],
          ['Gateway p99', `${gatewayP99Ms(state)} ms`],
          ['Consumer load', `${Math.round((state.consumerRate / CONSUMER_CAPACITY) * 100)}%`],
          ['Last drain', state.lastDrainSeconds !== null ? `${state.lastDrainSeconds.toFixed(1)} s` : '—'],
        ].map(([k, v]) => (
          <div key={k} className="bg-slate-950 px-4 md:px-5 py-3.5">
            <div className="text-[12px] text-slate-400">{k}</div>
            <div className="mt-0.5 font-mono text-base tabular-nums text-slate-50">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Artifacts                                                           */
/* ------------------------------------------------------------------ */

const FAULT_ROWS: Array<{ service: string; signal: string; before: string; after: string; state: 'ok' | 'warn' }> = [
  { service: 'orders-db', signal: 'p99 latency', before: '12 ms', after: '192 ms', state: 'warn' },
  { service: 'order-worker', signal: 'processed', before: '1,500/s', after: '410/s', state: 'warn' },
  { service: 'orders.created', signal: 'queued', before: '0', after: '18,400', state: 'warn' },
  { service: 'api-gateway', signal: 'p99 latency', before: '18 ms', after: '21 ms', state: 'ok' },
  { service: 'storefront', signal: 'errors', before: '0.0%', after: '0.0%', state: 'ok' },
];

const FaultPanel: React.FC = () => (
  <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 md:px-5 h-11 border-b border-slate-800 text-[13px]">
      <span className="text-slate-200">
        Fault: <span className="font-mono text-slate-50">orders-db</span> latency +180 ms
      </span>
      <span className="text-[12px] text-slate-400">Example run</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-slate-400">
            <th className="font-normal px-4 md:px-5 py-2.5">Service</th>
            <th className="hidden sm:table-cell font-normal px-4 py-2.5">Signal</th>
            <th className="font-normal px-4 py-2.5 text-right">Before</th>
            <th className="font-normal px-4 md:px-5 py-2.5 text-right">During</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/80 border-t border-slate-800/80">
          {FAULT_ROWS.map(r => (
            <tr key={r.service}>
              <td className="px-4 md:px-5 py-2.5">
                <span className="flex items-center gap-2 font-mono text-slate-100">
                  <span className={`w-1.5 h-1.5 rounded-full ${r.state === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`} aria-hidden="true" />
                  {r.service}
                </span>
                <span className="sm:hidden block pl-3.5 text-[12px] text-slate-400">{r.signal}</span>
              </td>
              <td className="hidden sm:table-cell px-4 py-2.5 text-slate-400">{r.signal}</td>
              <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-300">{r.before}</td>
              <td className={`px-4 md:px-5 py-2.5 text-right font-mono tabular-nums ${r.state === 'warn' ? 'text-amber-300' : 'text-slate-100'}`}>
                {r.after}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="px-4 md:px-5 py-3 border-t border-slate-800 text-[13px] text-slate-300">
      The queue absorbs the slow database: checkout stays fast while the backlog grows. Now you know what to alert on.
    </p>
  </div>
);

type ExportTab = 'terraform' | 'kubernetes' | 'compose' | 'mermaid';

const CodeLine: React.FC<{ text: string }> = ({ text }) => {
  const trimmed = text.trimStart();
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) return <span className="text-slate-400">{text}</span>;
  return <span className="text-slate-200">{text}</span>;
};

const ExportViewer: React.FC = () => {
  const [tab, setTab] = useState<ExportTab>('compose');
  const files = useMemo(() => {
    const doc = generateMarkdownDoc(DEMO_NODES, DEMO_EDGES, 'checkout');
    const mermaid = doc.match(/```mermaid\n([\s\S]*?)```/)?.[1] ?? '';
    return {
      compose: { name: 'docker-compose.yml', body: generateDockerCompose(DEMO_NODES, DEMO_EDGES, 'checkout') },
      terraform: { name: 'main.tf', body: generateTerraform(DEMO_NODES, DEMO_EDGES, 'checkout') },
      kubernetes: { name: 'k8s-manifests.yaml', body: generateKubernetesManifests(DEMO_NODES, DEMO_EDGES, 'checkout') },
      mermaid: { name: 'architecture.md', body: mermaid },
    } satisfies Record<ExportTab, { name: string; body: string }>;
  }, []);
  const lines = files[tab].body.replace(/\n+$/, '').split('\n');
  const tabs: Array<{ id: ExportTab; label: string; pro?: boolean }> = [
    { id: 'compose', label: 'Docker Compose' },
    { id: 'mermaid', label: 'Mermaid' },
    { id: 'terraform', label: 'Terraform', pro: true },
    { id: 'kubernetes', label: 'Kubernetes (K8s)', pro: true },
  ];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-2 h-11 border-b border-slate-800">
        <div role="tablist" aria-label="Export format" className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`h-7 px-2.5 rounded-md text-[13px] whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 ${
                tab === t.id ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {t.label}
              {t.pro && <span className="ml-1.5 text-[11px] text-slate-400">Pro</span>}
            </button>
          ))}
        </div>
        <span className="hidden sm:block pr-2 font-mono text-[12px] text-slate-400">{files[tab].name}</span>
      </div>
      <pre className="m-0 max-h-[360px] overflow-auto py-4 font-mono text-[12px] leading-[1.7]">
        {lines.map((l, i) => (
          <div key={i} className="flex">
            <span className="select-none w-12 shrink-0 pr-4 text-right text-slate-600 tabular-nums">{i + 1}</span>
            <code className="whitespace-pre pr-6">
              <CodeLine text={l || ' '} />
            </code>
          </div>
        ))}
      </pre>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Control Room Blueprint Backdrop (Railway / Unkey / Linear style)    */
/* ------------------------------------------------------------------ */

const ControlRoomBackdrop: React.FC<{ reduced: boolean }> = ({ reduced }) => (
  <div aria-hidden="true" className="pointer-events-none select-none">
    {/* Full-page structural vertical blueprint guide rails */}
    <div className="fixed inset-0 z-0 flex justify-center">
      <div className="w-full max-w-[1440px] h-full border-x border-slate-800/20 hidden xl:flex justify-center">
        <div className="w-full max-w-6xl h-full border-x border-slate-800/45" />
      </div>
      <div className="w-full max-w-6xl h-full border-x border-slate-800/45 xl:hidden" />
    </div>

    {/* Hero & Studio ceiling surface light + masked architectural blueprint & schematic traces */}
    <div className="absolute top-0 inset-x-0 h-[920px] z-0 overflow-hidden [mask-image:radial-gradient(ellipse_90%_72%_at_50%_26%,#000_42%,transparent_100%)]">
      {/* Subtle top-down control room surface light (zero blur orbs) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 42% at 50% -6%, rgba(247, 248, 248, 0.05), rgba(34, 211, 238, 0.022) 48%, transparent 82%)',
        }}
      />

      <svg className="w-full h-full block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* 24px minor coordinate grid */}
          <pattern id="gf-minor-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.024)" strokeWidth="1" />
          </pattern>
          {/* 120px major blueprint grid with precision + registration crosshairs */}
          <pattern id="gf-major-grid" width="120" height="120" patternUnits="userSpaceOnUse">
            <rect width="120" height="120" fill="url(#gf-minor-grid)" />
            <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth="1" />
            <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#35373c" strokeWidth="1" />
            <path d="M 117 0 L 123 0 M 120 -3 L 120 3" stroke="#35373c" strokeWidth="1" />
            <path d="M -3 120 L 3 120 M 0 117 L 0 123" stroke="#35373c" strokeWidth="1" />
          </pattern>
        </defs>

        {/* Tiled Blueprint Coordinate Grid */}
        <rect width="100%" height="100%" fill="url(#gf-major-grid)" />

        {/* Ambient Schematic Topology Traces in upper-right & outer background */}
        <g className="opacity-70">
          {/* Trace 1: Ingress -> Gateway -> Bus */}
          <path
            id="gf-bg-trace-1"
            d="M 760 120 L 960 120 C 1020 120, 1020 240, 1080 240 L 1320 240"
            fill="none"
            stroke="#24262a"
            strokeWidth="1.25"
            strokeDasharray="4 4"
          />
          {/* Trace 2: Secondary replica path */}
          <path
            id="gf-bg-trace-2"
            d="M 960 120 C 1020 120, 1020 360, 1080 360 L 1440 360"
            fill="none"
            stroke="#24262a"
            strokeWidth="1.25"
          />
          {/* Trace 3: Left margin ingress trace */}
          <path
            id="gf-bg-trace-3"
            d="M 0 240 L 180 240 C 220 240, 220 120, 260 120 L 480 120"
            fill="none"
            stroke="#24262a"
            strokeWidth="1.25"
            strokeDasharray="3 5"
          />

          {/* Schematic junction nodes on the 120px grid */}
          {[
            [760, 120],
            [960, 120],
            [1080, 240],
            [1320, 240],
            [1080, 360],
            [180, 240],
            [260, 120],
          ].map(([cx, cy], idx) => (
            <g key={idx} transform={`translate(${cx}, ${cy})`}>
              <rect x="-4" y="-4" width="8" height="8" rx="2" fill="#0f1012" stroke="#35373c" strokeWidth="1" />
              <circle r="1.5" fill={idx === 1 ? '#22d3ee' : '#6f737b'} />
            </g>
          ))}

          {/* Quiet animated packets along the schematic background traces */}
          {!reduced && (
            <>
              <circle r="2" fill="#22d3ee" opacity="0.55">
                <animateMotion dur="9s" repeatCount="indefinite" path="M 760 120 L 960 120 C 1020 120, 1020 240, 1080 240 L 1320 240" />
              </circle>
              <circle r="2" fill="#e1e3e6" opacity="0.35">
                <animateMotion dur="11s" begin="-4s" repeatCount="indefinite" path="M 960 120 C 1020 120, 1020 360, 1080 360 L 1440 360" />
              </circle>
              <circle r="1.75" fill="#e1e3e6" opacity="0.3">
                <animateMotion dur="10s" begin="-2.5s" repeatCount="indefinite" path="M 0 240 L 180 240 C 220 240, 220 120, 260 120 L 480 120" />
              </circle>
            </>
          )}
        </g>
      </svg>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenPricing, onOpenAuth, onSelectBlueprint }) => {
  const { user } = useAuth();
  const reduced = usePrefersReducedMotion();
  const shareUrl = useMemo(() => generateShareUrl(DEMO_NODES, DEMO_EDGES), []);

  return (
    <div className="relative min-h-screen w-full bg-dark-950 text-slate-200 font-sans antialiased overflow-x-hidden">
      <ControlRoomBackdrop reduced={reduced} />

      {/* Navigation */}
      <nav className="sticky top-0 z-30 border-b border-slate-800/70 bg-dark-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-14 px-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <a href="#top" className="flex items-center gap-2" aria-label="GraphFlow home">
              <span className="w-6 h-6 rounded-md bg-cyan-500 grid place-items-center">
                <Cpu className="w-3.5 h-3.5 text-slate-950" aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.01em] text-slate-50">GraphFlow</span>
            </a>
            <div className="hidden md:flex items-center gap-6 text-[13px] text-slate-400">
              <a href="#features" className="hover:text-slate-50 transition-colors">Features</a>
              <a href="#blueprints" className="hover:text-slate-50 transition-colors">Blueprints</a>
              <a href="#export" className="hover:text-slate-50 transition-colors">Export</a>
              <a href="#pricing" className="hover:text-slate-50 transition-colors">Pricing</a>
              <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-slate-50 transition-colors">GitHub</a>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={onOpenAuth}
                className={`inline-flex items-center gap-2 h-8 px-2.5 rounded-lg text-[13px] text-slate-300 hover:text-slate-50 hover:bg-slate-900 transition-colors ${ring}`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-100 grid place-items-center text-[11px] font-semibold">
                  {user.email?.[0]?.toUpperCase() || <UserIcon className="w-3 h-3" />}
                </span>
                <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className={`hidden sm:inline-flex items-center h-8 px-3 rounded-lg text-[13px] text-slate-300 hover:text-slate-50 transition-colors ${ring}`}
              >
                Sign in
              </button>
            )}
            <button
              onClick={onEnterApp}
              className={`inline-flex items-center h-8 px-3.5 rounded-lg bg-slate-50 hover:bg-white text-slate-950 text-[13px] font-medium transition-colors ${ring}`}
            >
              Open studio
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header id="top" className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 pt-20 md:pt-28">
        <h1 className={`${display} max-w-[13ch] text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.75rem]`}>
          Architecture diagrams that actually run.
        </h1>
        <div className="mt-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <p className="max-w-[46ch] text-[17px] leading-relaxed text-slate-400">
            Draw your services, queues, and databases—or import <code className="font-mono text-slate-300 text-[15px]">docker-compose.yml</code>—then push traffic through them. See where latency builds, which queue backs up, and how long recovery takes.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={onEnterApp} className={btnPrimary}>
              <span>Open the studio</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={btnSecondary}>
              <Github className="w-4 h-4" aria-hidden="true" />
              <span>View source</span>
            </a>
          </div>
        </div>
      </header>

      {/* Product */}
      <section aria-label="Live simulation" className="relative z-10 mt-14 md:mt-20">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/3 bottom-0 bg-gradient-to-b from-transparent via-white/[0.025] to-transparent"
        />
        <div className="relative max-w-6xl mx-auto px-3 md:px-8">
          <StudioFrame />
          <p className="mt-4 px-2 md:px-0 text-[13px] text-slate-400">
            Live, in your browser. Free and open source under MIT, nothing to install.
          </p>
        </div>
      </section>

      {/* Statement */}
      <section className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 py-28 md:py-40">
        <p className="max-w-[36ch] text-[1.75rem] md:text-[2.5rem] leading-[1.15] tracking-[-0.025em] font-medium text-slate-500">
          <span className="text-slate-50">A diagram shows how a system should work.</span> GraphFlow shows how it
          behaves: the queue that backs up, the dependency that drags everything down, the minutes it takes to recover.
        </p>
      </section>

      {/* Feature: fault injection */}
      <section id="features" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div aria-hidden="true" className="pointer-events-none max-w-6xl mx-auto relative">
          <span className="absolute -top-[4px] -left-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
          <span className="absolute -top-[4px] -right-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-6 md:gap-16">
            <h2 className={`${display} text-4xl md:text-5xl leading-[1.05]`}>Break it on purpose</h2>
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-slate-400 md:pt-2">
              Slow down a database, raise a service’s error rate, or throw a spike at the edge. Failures travel through
              the graph, so you see which services take the hit and which ones the design protects.
            </p>
          </div>
          <div className="mt-12 md:mt-16">
            <FaultPanel />
          </div>
        </div>
      </section>

      {/* Feature: export */}
      <section id="export" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div aria-hidden="true" className="pointer-events-none max-w-6xl mx-auto relative">
          <span className="absolute -top-[4px] -left-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
          <span className="absolute -top-[4px] -right-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-6 md:gap-16">
            <h2 className={`${display} text-4xl md:text-5xl leading-[1.05]`}>Export & reverse-import IaC</h2>
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-slate-400 md:pt-2">
              These are the real files GraphFlow generates for the checkout system above. Docker Compose, Mermaid, and
              SVG/PNG diagrams are free; AWS Terraform and Kubernetes HPA manifests come with Pro.
            </p>
          </div>
          <div className="mt-12 md:mt-16">
            <ExportViewer />
          </div>
        </div>
      </section>

      {/* Feature: Public Production Architecture Blueprints Gallery */}
      <section id="blueprints" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div aria-hidden="true" className="pointer-events-none max-w-6xl mx-auto relative">
          <span className="absolute -top-[4px] -left-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
          <span className="absolute -top-[4px] -right-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-6 md:gap-16 mb-12 md:mb-16">
            <h2 className={`${display} text-4xl md:text-5xl leading-[1.05]`}>Production system blueprints</h2>
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-slate-400 md:pt-2">
              Inspect battle-tested distributed architectures from FinTech, AI RAG, and global streaming. Fork any
              blueprint directly into the live 60 FPS simulator to stress-test bottlenecks, SLA, and cloud cost.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map(template => {
              const diag = analyzeTopologyDiagnostics(template.nodes, template.edges);
              return (
                <article
                  key={template.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/90 hover:border-slate-700 transition-colors p-5 flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                        {template.difficulty}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {template.nodes.length} nodes · {template.edges.length} links
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold text-slate-50 leading-snug mb-2">
                      {template.name}
                    </h3>
                    <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                      {template.description}
                    </p>

                    <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-dark-900 border border-slate-800/80 font-mono text-[11px] mb-3">
                      <div>
                        <div className="text-slate-500 text-[10px]">SLA</div>
                        <div className="text-emerald-400 font-semibold">{diag.compositeSlaPercent}%</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">p99 Tail</div>
                        <div className="text-slate-200 font-semibold">{diag.p99LatencyMs}ms</div>
                      </div>
                      <div>
                        <div className="text-slate-500 text-[10px]">Est. AWS</div>
                        <div className="text-cyan-300 font-semibold">~${diag.estimatedMonthlyCostUsd}/m</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {template.tags.map(tag => (
                        <span
                          key={tag}
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900/80 border border-slate-800 text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectBlueprint) {
                        onSelectBlueprint(template);
                      } else {
                        onEnterApp();
                      }
                    }}
                    className={`w-full h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-100 text-[13px] font-medium inline-flex items-center justify-between transition-colors ${ring}`}
                  >
                    <span>Simulate & fork blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature pair */}
      <section className="relative z-10 border-t border-slate-800/70">
        <div aria-hidden="true" className="pointer-events-none max-w-6xl mx-auto relative">
          <span className="absolute -top-[4px] -left-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
          <span className="absolute -top-[4px] -right-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 grid md:grid-cols-2 md:divide-x divide-slate-800/70">
          <div className="py-20 md:py-28 md:pr-12 space-y-4">
            <h3 className={`${display} text-2xl md:text-[1.75rem] leading-tight`}>
              Start from a sentence
              <span className="ml-2 align-middle text-[12px] font-medium tracking-normal [font-stretch:100%] text-slate-400 border border-slate-700 rounded px-1.5 py-0.5">
                Pro
              </span>
            </h3>
            <p className="text-[15px] leading-relaxed text-slate-400 max-w-[44ch]">
              Describe the system in plain English. GraphFlow lays out the services, queues, and stores with protocols and
              latencies filled in, then you edit it like any other diagram.
            </p>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-[13px]">
              <p className="text-slate-100">“Checkout with a Redis session cache, Kafka for order events, and a Postgres primary.”</p>
              <ul className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[12px] text-slate-300">
                {DEMO_NODES.map(n => (
                  <li key={n.id} className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-sm shrink-0" style={{ backgroundColor: n.color }} aria-hidden="true" />
                    <span className="truncate">{n.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="py-20 md:py-28 md:pl-12 space-y-4 border-t md:border-t-0 border-slate-800/70">
            <h3 className={`${display} text-2xl md:text-[1.75rem] leading-tight`}>Share a link, not a screenshot</h3>
            <p className="text-[15px] leading-relaxed text-slate-400 max-w-[44ch]">
              The whole graph is encoded in the URL. Paste it into a pull request or a design doc, and whoever opens it
              gets the same running simulation. No account needed.
            </p>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="font-mono text-[12px] leading-relaxed text-slate-300 break-all line-clamp-3">{shareUrl}</p>
              <a
                href={shareUrl}
                className={`mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-50 hover:text-white ${ring} rounded`}
              >
                <span>Open this graph in the studio</span>
                <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div aria-hidden="true" className="pointer-events-none max-w-6xl mx-auto relative">
          <span className="absolute -top-[4px] -left-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
          <span className="absolute -top-[4px] -right-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
        </div>
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-32">
          <div className="grid md:grid-cols-2 gap-6 md:gap-16 mb-12 md:mb-16">
            <h2 className={`${display} text-4xl md:text-5xl leading-[1.05]`}>Pricing</h2>
            <p className="max-w-[46ch] text-[17px] leading-relaxed text-slate-400 md:pt-2">
              The simulator, templates, sharing, and Mermaid and Docker exports are free. Pro adds AI generation, cloud
              projects, and Terraform.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-px bg-slate-800 rounded-xl overflow-hidden border border-slate-800">
            {/* Community */}
            <div className="bg-dark-950 p-6 md:p-8 flex flex-col">
              <h3 className="text-[15px] font-semibold text-slate-50">Community</h3>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className={`${display} text-4xl tabular-nums`}>$0</span>
              </p>
              <p className="mt-1 text-[13px] text-slate-400">Free forever</p>
              <ul className="mt-8 space-y-3 text-[14px] text-slate-300 flex-1">
                {['Live traffic simulation', 'Starter templates', 'JSON, Mermaid and Docker Compose export', 'Share by link'].map(item => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onEnterApp} className={`mt-10 ${btnSecondary}`}>
                Start in the browser
              </button>
            </div>

            {/* Pro */}
            <div className="bg-dark-900 p-6 md:p-8 flex flex-col">
              <h3 className="text-[15px] font-semibold text-slate-50">Pro</h3>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className={`${display} text-4xl tabular-nums`}>$12</span>
                <span className="text-[13px] text-slate-400">/ month</span>
              </p>
              <p className="mt-1 text-[13px] text-slate-400">or $99 / year</p>
              <ul className="mt-8 space-y-3 text-[14px] text-slate-200 flex-1">
                {['Everything in Community', 'AI architecture generator', 'Unlimited cloud projects', 'Terraform export for AWS'].map(item => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 text-slate-300 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a
                href="https://graphflow.lemonsqueezy.com/checkout/buy/171c3132-5464-46eb-a519-b95c1e4bca8a?embed=1"
                target="_blank"
                rel="noopener noreferrer"
                className={`lemonsqueezy-button mt-10 ${btnPrimary}`}
              >
                <span>Upgrade to Pro</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            {/* Team */}
            <div className="bg-dark-950 p-6 md:p-8 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[15px] font-semibold text-slate-50">Engineering Team</h3>
                <span className="text-[12px] text-slate-400">Coming soon</span>
              </div>
              <p className="mt-4 flex items-baseline gap-1.5">
                <span className={`${display} text-4xl tabular-nums`}>$39</span>
                <span className="text-[13px] text-slate-400">/ month</span>
              </p>
              <p className="mt-1 text-[13px] text-slate-400">Up to 10 seats</p>
              <ul className="mt-8 space-y-3 text-[14px] text-slate-300 flex-1">
                {['Everything in Pro', 'Live multiplayer editing', 'Embeds for Notion and docs'].map(item => (
                  <li key={item} className="flex gap-2.5">
                    <Check className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <a href={CONTACT_MAILTO} className={`mt-10 ${btnSecondary}`}>
                <Mail className="w-4 h-4 text-slate-400" aria-hidden="true" />
                <span>Ask about early access</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="relative z-10 border-t border-slate-800/70 overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none max-w-6xl mx-auto relative">
          <span className="absolute -top-[4px] -left-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
          <span className="absolute -top-[4px] -right-[4px] w-[7px] h-[7px] text-slate-600 leading-none select-none">+</span>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_75%_80%_at_50%_100%,#000_20%,transparent_100%)]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8 py-28 md:py-36">
          <h2 className={`${display} max-w-[17ch] text-4xl md:text-6xl leading-[1.03]`}>
            Find the bottleneck before production does.
          </h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={onEnterApp} className={btnPrimary}>
              <span>Open the studio</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className={btnSecondary}>
              <Github className="w-4 h-4" aria-hidden="true" />
              <span>Star on GitHub</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/70">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[13px] text-slate-400">
          <div className="flex items-center gap-2.5">
            <span className="w-5 h-5 rounded bg-cyan-500 grid place-items-center">
              <Cpu className="w-3 h-3 text-slate-950" aria-hidden="true" />
            </span>
            <span className="text-slate-200 font-medium">GraphFlow</span>
            <span>© 2026 · MIT licensed</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onEnterApp} className="hover:text-slate-50 transition-colors">Studio</button>
            <button onClick={onOpenPricing} className="hover:text-slate-50 transition-colors">Pricing</button>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-slate-50 transition-colors">GitHub</a>
            <a href="mailto:berkeakdemir5855@gmail.com" className="hover:text-slate-50 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
