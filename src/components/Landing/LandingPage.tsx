import React, { useEffect, useRef } from 'react';
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
} from './surgeModel';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenPricing: () => void;
  onOpenAuth?: () => void;
}

const CONTACT_MAILTO = 'mailto:berkeakdemir5855@gmail.com?subject=GraphFlow%20Engineering%20Team%20Access%20Request';

const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/* ------------------------------------------------------------------ */
/* Live demo pieces                                                    */
/* ------------------------------------------------------------------ */

/** Packets moving along an edge. Faster flow = shorter loop. */
const FlowTrack: React.FC<{ rate: number }> = ({ rate }) => {
  const duration = Math.min(2.4, Math.max(0.45, 1200 / Math.max(rate, 1)));
  return (
    <span aria-hidden="true" className="relative h-1 flex-1 overflow-hidden">
      <span className="absolute inset-x-0 top-1/2 h-px bg-slate-700" />
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="absolute inset-0 animate-flow-x"
          style={{ animationDuration: `${duration}s`, animationDelay: `${-(duration / 3) * i}s` }}
        >
          <span className="absolute top-0 left-0 w-1.5 h-1 rounded-full bg-slate-300" />
        </span>
      ))}
    </span>
  );
};

/** A thin meter for real quantities (queue depth, utilization). */
const Meter: React.FC<{ value: number; tone: 'neutral' | 'degraded'; label: string }> = ({ value, tone, label }) => (
  <div
    className="h-1 w-full rounded-full bg-slate-800 overflow-hidden"
    role="meter"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value * 100)}
  >
    <div
      className={`h-full rounded-full ${tone === 'degraded' ? 'bg-amber-400' : 'bg-slate-400'}`}
      style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
    />
  </div>
);

interface DemoNodeProps {
  icon: React.ReactNode;
  kind: string;
  name: string;
  detail: string;
  strip: string;
  degraded: boolean;
  metrics: Array<{ label: string; value: string }>;
  footer: React.ReactNode;
}

/** Mirrors the studio's canvas node: category strip, name, live metrics. */
const DemoNode: React.FC<DemoNodeProps> = ({ icon, kind, name, detail, strip, degraded, metrics, footer }) => (
  <div
    className={`relative overflow-hidden rounded-xl border bg-dark-950 p-3.5 text-left transition-colors duration-300 ${
      degraded ? 'border-amber-500/50' : 'border-slate-800'
    }`}
  >
    <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: strip }} />
    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
      <span className="flex items-center gap-1.5">
        {icon}
        <span>{kind}</span>
      </span>
      <span
        className={`w-2 h-2 rounded-full ${degraded ? 'bg-amber-400' : 'bg-emerald-400'}`}
        title={degraded ? 'Degraded' : 'Healthy'}
      />
    </div>
    <div className="mt-2 text-sm font-semibold text-white truncate">{name}</div>
    <div className="text-[11px] text-slate-400 truncate">{detail}</div>
    <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
      {metrics.map(m => (
        <div key={m.label} className="min-w-0">
          <dt className="text-[11px] text-slate-400 truncate">{m.label}</dt>
          <dd className="font-mono text-xs text-slate-100 tabular-nums truncate">{m.value}</dd>
        </div>
      ))}
    </dl>
    <div className="mt-3 pt-2.5 border-t border-slate-800">{footer}</div>
  </div>
);

const Egress: React.FC<{ protocol: string; rate: number }> = ({ protocol, rate }) => (
  <div className="flex items-center gap-2 text-[11px] text-slate-400">
    <span className="font-mono shrink-0">{protocol}</span>
    <FlowTrack rate={rate} />
  </div>
);

/** Consumer lag over the last 30 s. */
const LagChart: React.FC<{ history: number[]; phase: SurgePhase }> = ({ history, phase }) => {
  const w = 300;
  const h = 64;
  const max = Math.max(10000, ...history);
  const points = history.map((d, i) => `${((i / (history.length - 1)) * w).toFixed(2)},${(h - 2 - (d / max) * (h - 6)).toFixed(2)}`);
  const line = `M${points.join(' L')}`;
  const area = `${line} L${w},${h} L0,${h} Z`;
  const active = phase !== 'steady' || history.some(d => d > 0);

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-16 block" aria-hidden="true">
      <line x1="0" x2={w} y1={h - 2} y2={h - 2} className="stroke-slate-800" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={area} className={active ? 'fill-amber-400/10' : 'fill-transparent'} />
      <path
        d={line}
        fill="none"
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className={active ? 'stroke-amber-300' : 'stroke-slate-600'}
      />
    </svg>
  );
};

const phaseCopy = (phase: SurgePhase, lastDrainSeconds: number | null, peakDepth: number): string => {
  if (phase === 'surging') {
    return `Producers are outpacing the consumer by ${fmt(SURGE_RATE - CONSUMER_CAPACITY)} msg/s. The topic is backing up.`;
  }
  if (phase === 'draining') {
    return `Surge over. The consumer is working through the backlog at ${fmt(CONSUMER_CAPACITY - BASE_RATE)} msg/s.`;
  }
  if (lastDrainSeconds !== null) {
    return `Last surge peaked at ${fmt(peakDepth)} queued messages and took ${lastDrainSeconds.toFixed(1)} s to drain.`;
  }
  return `Producers send ${fmt(BASE_RATE)} msg/s and the consumer can handle ${fmt(CONSUMER_CAPACITY)}. Inject a surge to see what happens when that flips.`;
};

const LiveDemo: React.FC<{ onEnterApp: () => void }> = ({ onEnterApp }) => {
  const { state, triggerSurge } = useSurgeSimulation();
  const frameRef = useRef<HTMLDivElement>(null);
  const userTriggered = useRef(false);

  // Play one surge the first time the demo is actually on screen.
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
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer) window.clearTimeout(timer);
    };
  }, [triggerSurge]);

  const handleSurge = () => {
    userTriggered.current = true;
    triggerSurge();
  };

  const phase = surgePhase(state);
  const surging = phase === 'surging';
  const p99 = gatewayP99Ms(state);
  const lag = consumerLagSeconds(state);
  const eta = drainEtaSeconds(state);
  const utilization = state.consumerRate / CONSUMER_CAPACITY;
  const queueDegraded = lag > 1;
  const secondsLeft = Math.ceil(state.surgeTicksRemaining * TICK_SECONDS);

  const statusLine =
    phase === 'surging'
      ? `Surge · ${fmt(state.producerRate)} msg/s · ${secondsLeft} s left`
      : phase === 'draining'
        ? `Draining · ${fmt(state.depth)} queued${eta !== null ? ` · ~${eta.toFixed(1)} s to empty` : ''}`
        : `Steady · ${fmt(state.producerRate)} msg/s`;

  return (
    <div ref={frameRef} className="rounded-2xl border border-slate-800 bg-dark-900 shadow-2xl overflow-hidden">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-5 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className={`w-2 h-2 rounded-full shrink-0 ${phase === 'steady' ? 'bg-emerald-400' : 'bg-amber-400'}`}
          />
          <span className="font-mono text-xs text-slate-200 tabular-nums truncate">{statusLine}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSurge}
            disabled={surging}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-700 bg-slate-800 text-xs font-semibold text-slate-100 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:border-amber-500/40 disabled:bg-amber-950/40 disabled:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900"
          >
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{surging ? 'Surge running' : 'Inject 10 s surge'}</span>
          </button>
          <button
            type="button"
            onClick={onEnterApp}
            className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-cyan-300 transition-colors hover:text-cyan-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <span>Build your own</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Topology */}
      <div className="p-4 md:p-5 bg-dark-950/60 bg-grid-dots">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <DemoNode
            icon={<Globe className="w-3.5 h-3.5" aria-hidden="true" />}
            kind="Client"
            name="Storefront"
            detail="Next.js on the edge"
            strip="#38bdf8"
            degraded={false}
            metrics={[
              { label: 'Requests', value: `${fmt(state.producerRate)}/s` },
              { label: 'p99', value: `${p99 + 9} ms` },
            ]}
            footer={<Egress protocol="HTTPS" rate={state.producerRate} />}
          />
          <DemoNode
            icon={<Network className="w-3.5 h-3.5" aria-hidden="true" />}
            kind="Gateway"
            name="Kong"
            detail="Auth and rate limits"
            strip="#818cf8"
            degraded={surging}
            metrics={[
              { label: 'Requests', value: `${fmt(state.producerRate)}/s` },
              { label: 'p99', value: `${p99} ms` },
            ]}
            footer={<Egress protocol="produce" rate={state.producerRate} />}
          />
          <DemoNode
            icon={<Layers className="w-3.5 h-3.5" aria-hidden="true" />}
            kind="Kafka topic"
            name="orders.created"
            detail="6 partitions"
            strip="#f59e0b"
            degraded={queueDegraded}
            metrics={[
              { label: 'Queued', value: fmt(state.depth) },
              { label: 'Lag', value: `${lag.toFixed(1)} s` },
            ]}
            footer={
              <div className="space-y-1.5">
                <Meter value={state.depth / 10000} tone={queueDegraded ? 'degraded' : 'neutral'} label="Queue depth" />
                <Egress protocol="consume" rate={state.consumerRate} />
              </div>
            }
          />
          <DemoNode
            icon={<Cpu className="w-3.5 h-3.5" aria-hidden="true" />}
            kind="Consumer"
            name="order-worker"
            detail="Writes to Postgres"
            strip="#a855f7"
            degraded={utilization >= 0.99}
            metrics={[
              { label: 'Processed', value: `${fmt(state.consumerRate)}/s` },
              { label: 'Capacity', value: `${fmt(CONSUMER_CAPACITY)}/s` },
            ]}
            footer={
              <div className="space-y-1.5">
                <Meter value={utilization} tone={utilization >= 0.99 ? 'degraded' : 'neutral'} label="Consumer utilization" />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Utilization</span>
                  <span className="font-mono tabular-nums text-slate-200">{Math.round(utilization * 100)}%</span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* Lag over time */}
      <div className="px-4 md:px-5 pt-4 pb-4 border-t border-slate-800">
        <div className="flex items-baseline justify-between text-[11px] text-slate-400 mb-2">
          <span>Messages waiting in orders.created, last 30 s</span>
          <span className="font-mono tabular-nums text-slate-300">peak {fmt(state.peakDepth)}</span>
        </div>
        <LagChart history={state.history} phase={phase} />
        <p className="mt-3 text-sm text-slate-300" aria-live="polite">
          {phaseCopy(phase, state.lastDrainSeconds, state.peakDepth)}
        </p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Feature rows                                                        */
/* ------------------------------------------------------------------ */

const FEATURES: Array<{ title: string; body: string; tag?: string; artifact: string }> = [
  {
    title: 'Break it on purpose',
    body: 'Raise a service’s error rate, slow down a dependency, or throw a traffic spike at the edge. Failed requests travel through the graph, so you can see which services take the hit and where retries pile up.',
    artifact: `payment-svc    error rate   0.00  ->  0.25
order-svc      5xx/s           0  ->    31
api-gateway    p99          41ms  ->  186ms
storefront     errors       0.0%  ->   4.1%`,
  },
  {
    title: 'Describe a system, get a starting point',
    body: 'Write what you need in plain English and GraphFlow lays out the services, queues, caches, and databases with protocols and latencies filled in. Then you edit it like any other diagram.',
    tag: 'Pro',
    artifact: `> checkout with a Redis session cache, Kafka for
  order events, and a Postgres primary

+ api-gateway      gateway
+ checkout-svc     service
+ session-cache    cache      Redis
+ orders.created   queue      Kafka
+ order-worker     service
+ orders-db        database   PostgreSQL`,
  },
  {
    title: 'Export what you drew',
    body: 'Docker Compose and Mermaid exports are free. Pro adds Terraform scaffolding for AWS: a VPC, an ECS cluster, and one resource per node, ready to edit.',
    artifact: `resource "aws_db_instance" "orders_db" {
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t4g.micro"
}

resource "aws_ecs_service" "order_worker_svc" {
  launch_type   = "FARGATE"
  desired_count = 2
}`,
  },
  {
    title: 'Share a link, not a screenshot',
    body: 'The whole graph is encoded into the URL. Paste it in a pull request or a design doc and whoever opens it gets the same running simulation, without an account.',
    artifact: `https://graph-flow-virid.vercel.app/#share=eyJub2Rlc
yI6W3siaWQiOiJhcGktZ2F0ZXdheSIsInR5cGUiOiJnYXRld2F5
IiwidGl0bGUiOiJLb25nIn0seyJpZCI6Im9yZGVycy5jcmVhdGV…`,
  },
];

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950';

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenPricing, onOpenAuth }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 font-sans overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-dark-900/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto h-full px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-slate-950" aria-hidden="true" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">GraphFlow</span>
          </div>

          <div className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-400">
            <a href="#demo" className="hover:text-slate-100 transition-colors">Demo</a>
            <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
            <a
              href="https://github.com/Hanubaki/GraphFlow"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-slate-100 transition-colors"
            >
              <Github className="w-3.5 h-3.5" aria-hidden="true" />
              <span>GitHub</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={onOpenAuth}
                className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors ${focusRing}`}
              >
                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center justify-center text-[11px] font-bold">
                  {user.email?.[0]?.toUpperCase() || <UserIcon className="w-3 h-3" />}
                </span>
                <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className={`hidden sm:inline-flex items-center h-9 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors ${focusRing}`}
              >
                Sign in
              </button>
            )}
            <button
              onClick={onEnterApp}
              className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors ${focusRing}`}
            >
              <span>Open studio</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-6xl mx-auto px-4 md:px-8 pt-16 md:pt-24 pb-10 md:pb-14">
        <div className="grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-16 lg:items-end">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-[1.05] text-balance">
            Architecture diagrams that actually run.
          </h1>
          <div className="space-y-6 lg:pb-1.5">
            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-[52ch]">
              Draw your gateways, services, queues, and databases, then push traffic through them. Watch latency climb,
              queues back up, and failures spread before any of it reaches production.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={onEnterApp}
                className={`h-11 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors ${focusRing}`}
              >
                <span>Open the studio</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <a
                href="https://github.com/Hanubaki/GraphFlow"
                target="_blank"
                rel="noreferrer"
                className={`h-11 px-6 rounded-xl border border-slate-700 bg-dark-900 hover:bg-slate-800 text-slate-200 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors ${focusRing}`}
              >
                <Github className="w-4 h-4" aria-hidden="true" />
                <span>View source</span>
              </a>
            </div>
            <p className="text-xs text-slate-400">Free and open source (MIT). Runs in your browser, nothing to install.</p>
          </div>
        </div>
      </header>

      {/* Live demo */}
      <section id="demo" aria-label="Live simulation" className="max-w-6xl mx-auto px-4 md:px-8 scroll-mt-20">
        <LiveDemo onEnterApp={onEnterApp} />
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-8 py-24 md:py-32 scroll-mt-16">
        <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
          <div className="lg:sticky lg:top-28 self-start space-y-4">
            <h2 className="text-3xl font-bold tracking-tight text-white text-balance">Draw it, break it, ship it.</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Most architecture diagrams show how a system should work. GraphFlow shows how it behaves once real
              traffic, failures, and slow dependencies show up.
            </p>
          </div>

          <div className="border-y border-slate-800 divide-y divide-slate-800">
            {FEATURES.map(f => (
              <article
                key={f.title}
                className="py-8 md:py-10 grid md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-5 md:gap-8"
              >
                <div className="space-y-2.5">
                  <h3 className="text-base font-bold text-white text-balance">
                    {f.title}
                    {f.tag && (
                      <span className="ml-2 align-[2px] px-1.5 py-0.5 rounded border border-slate-700 text-[11px] font-medium text-slate-400">
                        {f.tag}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.body}</p>
                </div>
                <pre className="m-0 p-4 rounded-xl border border-slate-800 bg-dark-950 font-mono text-[11px] leading-relaxed text-slate-300 overflow-x-auto whitespace-pre">
                  {f.artifact}
                </pre>
              </article>
            ))}
            <p className="py-5 text-xs text-slate-400">
              Rendered with plain SVG and requestAnimationFrame. No canvas engine, no plugins.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 md:px-8 pb-24 md:pb-32 scroll-mt-16">
        <div className="max-w-xl space-y-3 mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-white">Pricing</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The simulator, templates, and Mermaid and Docker exports are free. Pro adds AI generation, cloud projects,
            and Terraform.
          </p>
        </div>

        <div className="grid md:grid-cols-3 rounded-2xl border border-slate-800 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Community */}
          <div className="p-6 md:p-8 flex flex-col">
            <h3 className="text-sm font-bold text-slate-200">Community</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tabular-nums">$0</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Free forever</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300 flex-1">
              {['Live traffic simulation', 'Starter templates', 'JSON, Mermaid and Docker Compose export', 'Share by link'].map(item => (
                <li key={item} className="flex gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={onEnterApp}
              className={`mt-8 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors ${focusRing}`}
            >
              Start in the browser
            </button>
          </div>

          {/* Pro */}
          <div className="relative p-6 md:p-8 flex flex-col bg-dark-900">
            <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-cyan-400" />
            <h3 className="text-sm font-bold text-cyan-300">Pro</h3>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tabular-nums">$12</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">or $99 / year</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-200 flex-1">
              {['Everything in Community', 'AI architecture generator', 'Unlimited cloud projects', 'Terraform export for AWS'].map(item => (
                <li key={item} className="flex gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242?embed=1"
              target="_blank"
              rel="noopener noreferrer"
              className={`lemonsqueezy-button mt-8 h-10 rounded-xl bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${focusRing}`}
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </a>
          </div>

          {/* Team */}
          <div className="p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-200">Engineering Team</h3>
              <span className="px-2 py-0.5 rounded-full border border-slate-700 text-[11px] text-slate-400">Coming soon</span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white tabular-nums">$39</span>
              <span className="text-xs text-slate-400">/ month</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Up to 10 seats</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-300 flex-1">
              {['Everything in Pro', 'Live multiplayer editing', 'Embeds for Notion and docs'].map(item => (
                <li key={item} className="flex gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <a
              href={CONTACT_MAILTO}
              className={`mt-8 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 ${focusRing}`}
            >
              <Mail className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
              <span>Ask about early access</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-cyan-500 flex items-center justify-center">
              <Cpu className="w-3 h-3 text-slate-950" aria-hidden="true" />
            </div>
            <span className="font-semibold text-slate-300">GraphFlow</span>
            <span>© 2026 · MIT licensed</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={onEnterApp} className="hover:text-slate-100 transition-colors">Studio</button>
            <button onClick={onOpenPricing} className="hover:text-slate-100 transition-colors">Pricing</button>
            <a href="https://github.com/Hanubaki/GraphFlow" target="_blank" rel="noreferrer" className="hover:text-slate-100 transition-colors">
              GitHub
            </a>
            <a href="mailto:berkeakdemir5855@gmail.com" className="hover:text-slate-100 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
