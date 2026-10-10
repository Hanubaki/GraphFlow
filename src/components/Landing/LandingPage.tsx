import React, { useState } from 'react';
import {
  Cpu,
  Sparkles,
  Zap,
  ArrowRight,
  Share2,
  Check,
  Terminal,
  Activity,
  Github,
  Play,
  User as UserIcon,
  Globe,
  Network,
  Database,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenPricing: () => void;
  onOpenAuth?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenPricing, onOpenAuth }) => {
  const { user } = useAuth();
  const [isSurgeActive, setIsSurgeActive] = useState(false);
  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">
      {/* Navigation Bar */}
      <nav className="relative z-30 border-b border-slate-800/80 bg-dark-900/80 backdrop-blur-xl sticky top-0 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
            <Cpu className="w-4 h-4 text-slate-950" />
          </div>
          <span className="font-bold text-base tracking-tight text-white">GraphFlow</span>
          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-slate-800 text-slate-400">
            v1.0
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <a href="#features" className="hover:text-slate-100 transition-colors">Features</a>
          <a href="#demo" className="hover:text-slate-100 transition-colors">Simulation</a>
          <a href="#pricing" className="hover:text-slate-100 transition-colors">Pricing</a>
          <a
            href="https://github.com/Hanubaki/GraphFlow"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-slate-100 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-slate-800 bg-dark-950/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              <div className="w-5 h-5 rounded-full bg-cyan-600/30 text-cyan-300 border border-cyan-500/50 flex items-center justify-center text-[11px] font-bold">
                {user.email?.[0]?.toUpperCase() || <UserIcon className="w-3 h-3" />}
              </div>
              <span className="hidden sm:inline text-xs">{user.email?.split('@')[0]}</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 transition-colors cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
          <button
            onClick={onEnterApp}
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-16 md:pt-24 pb-16 px-4 max-w-5xl mx-auto text-center space-y-6">
        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] text-balance">
          Turn Static Architecture Diagrams into{' '}
          <span className="text-cyan-300">Living Simulations</span>
        </h1>

        {/* Subhead */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Design distributed architectures, API gateways, caches, Kafka queues, and databases.
          Simulate real-time traffic, latency bottlenecks, and network chaos directly in your browser.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto h-11 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Start Simulating Free</span>
          </button>
          <a
            href="https://github.com/Hanubaki/GraphFlow"
            target="_blank"
            rel="noreferrer"
            className="w-full sm:w-auto h-11 px-6 rounded-xl border border-slate-700 bg-dark-900/60 hover:bg-slate-800 text-slate-200 text-sm font-semibold flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-950"
          >
            <Github className="w-4 h-4" />
            <span>Star on GitHub</span>
          </a>
        </div>

        <p className="text-sm text-slate-400">
          Open source (MIT) · Runs in your browser · No install, no canvas runtime
        </p>

        {/* Living Architecture Simulation Preview */}
        <div id="demo" className="pt-8">
          <div
            onClick={onEnterApp}
            className="group relative rounded-2xl border border-slate-800 bg-dark-900/90 shadow-2xl p-4 md:p-6 backdrop-blur-xl cursor-pointer hover:border-cyan-500/50 transition-all overflow-hidden"
            role="region"
            aria-label="Interactive distributed system simulation preview"
          >
            {/* Simulation Header Controller */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-5 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isSurgeActive ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
                <span className="text-slate-200 font-semibold">
                  {isSurgeActive ? 'SURGE ACTIVE · 2,450 RPS' : 'SIMULATION ACTIVE · 730 RPS'}
                </span>
                <span className="hidden sm:inline text-slate-600">•</span>
                <span className="hidden sm:inline text-slate-400">
                  {isSurgeActive ? 'p99 142ms · 0.4% Drop' : 'p50 18ms · 0.01% Error'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsSurgeActive(prev => !prev);
                  }}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                    isSurgeActive
                      ? 'border-amber-500/50 bg-amber-950/50 text-amber-300'
                      : 'border-slate-800 bg-dark-950 hover:bg-slate-800 text-slate-300'
                  }`}
                  title="Simulate load spike"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>{isSurgeActive ? 'Normalize Flow' : 'Inject Surge'}</span>
                </button>
                <button
                  type="button"
                  onClick={onEnterApp}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-bold font-sans transition-colors cursor-pointer shadow-sm shadow-cyan-950"
                >
                  <span>Open in Studio</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Living Pipeline Diagram Canvas */}
            <div className="relative py-4 px-2 bg-dark-950/40 rounded-xl border border-slate-800/60 bg-grid-dots">
              {/* Connected Pipeline on Desktop (lg) / Adaptive on Mobile */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0">
                {/* Node 1: Client */}
                <div className="w-full lg:w-48 p-3 rounded-xl border border-slate-800 bg-dark-950/90 shadow-lg text-left relative overflow-hidden shrink-0 group-hover:border-slate-700 transition-colors">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#38bdf8]" />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5 text-sky-400 font-semibold">
                      <Globe className="w-3.5 h-3.5" />
                      <span>CLIENT</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Healthy" />
                  </div>
                  <div className="text-xs font-bold text-white mt-1.5 truncate">Next.js Storefront</div>
                  <div className="text-[11px] text-slate-400 truncate">Edge App Router</div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>LAT {isSurgeActive ? '38ms' : '15ms'}</span>
                    <span className="text-slate-300">{isSurgeActive ? '1,200 rps' : '450 rps'}</span>
                  </div>
                </div>

                {/* Wire 1: Client -> Gateway */}
                <div className="flex-1 w-full lg:w-auto flex flex-col items-center justify-center relative px-1 py-1 lg:py-0">
                  {/* Desktop horizontal wire */}
                  <div className="hidden lg:flex items-center w-full relative">
                    <div className="w-full h-0.5 bg-slate-800 relative overflow-hidden">
                      <div className="w-full h-full border-t border-dashed border-cyan-400/80 animate-flow-dash" />
                    </div>
                    {/* Flowing animated packet */}
                    <span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse" />
                  </div>
                  {/* Mobile vertical line */}
                  <div className="lg:hidden w-0.5 h-5 bg-slate-800 relative">
                    <div className="w-full h-full border-l border-dashed border-cyan-400/80 animate-flow-dash" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-dark-950 border border-cyan-900/60 text-cyan-400 -mt-2 lg:mt-1">
                    HTTP/REST
                  </span>
                </div>

                {/* Node 2: API Gateway */}
                <div className="w-full lg:w-48 p-3 rounded-xl border border-cyan-500/50 bg-cyan-950/20 shadow-lg text-left relative overflow-hidden shrink-0">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#818cf8]" />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
                      <Network className="w-3.5 h-3.5" />
                      <span>GATEWAY</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${isSurgeActive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="text-xs font-bold text-white mt-1.5 truncate">Kong API Gateway</div>
                  <div className="text-[11px] text-slate-400 truncate">Rate Limit & Auth</div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>LAT {isSurgeActive ? '24ms' : '6ms'}</span>
                    <span className="text-slate-300">{isSurgeActive ? '2,450 rps' : '730 rps'}</span>
                  </div>
                </div>

                {/* Wire 2: Gateway -> Service */}
                <div className="flex-1 w-full lg:w-auto flex flex-col items-center justify-center relative px-1 py-1 lg:py-0">
                  {/* Desktop horizontal wire */}
                  <div className="hidden lg:flex items-center w-full relative">
                    <div className="w-full h-0.5 bg-slate-800 relative overflow-hidden">
                      <div className="w-full h-full border-t border-dashed border-purple-400/80 animate-flow-dash" />
                    </div>
                    <span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.9)] animate-pulse" />
                  </div>
                  {/* Mobile vertical line */}
                  <div className="lg:hidden w-0.5 h-5 bg-slate-800 relative">
                    <div className="w-full h-full border-l border-dashed border-purple-400/80 animate-flow-dash" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-dark-950 border border-purple-900/60 text-purple-300 -mt-2 lg:mt-1">
                    gRPC
                  </span>
                </div>

                {/* Node 3: Microservice */}
                <div className="w-full lg:w-48 p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 shadow-lg text-left relative overflow-hidden shrink-0">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#a855f7]" />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5 text-purple-400 font-semibold">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>SERVICE</span>
                    </div>
                    <span className={`w-2 h-2 rounded-full ${isSurgeActive ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                  </div>
                  <div className="text-xs font-bold text-white mt-1.5 truncate">Order Processor</div>
                  <div className="text-[11px] text-slate-400 truncate">Kafka Sync Worker</div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>LAT {isSurgeActive ? '92ms' : '35ms'}</span>
                    <span className="text-slate-300">{isSurgeActive ? '2,380 rps' : '710 rps'}</span>
                  </div>
                </div>

                {/* Wire 3: Service -> Database */}
                <div className="flex-1 w-full lg:w-auto flex flex-col items-center justify-center relative px-1 py-1 lg:py-0">
                  {/* Desktop horizontal wire */}
                  <div className="hidden lg:flex items-center w-full relative">
                    <div className="w-full h-0.5 bg-slate-800 relative overflow-hidden">
                      <div className="w-full h-full border-t border-dashed border-blue-400/80 animate-flow-dash" />
                    </div>
                    <span className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)] animate-pulse" />
                  </div>
                  {/* Mobile vertical line */}
                  <div className="lg:hidden w-0.5 h-5 bg-slate-800 relative">
                    <div className="w-full h-full border-l border-dashed border-blue-400/80 animate-flow-dash" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-dark-950 border border-blue-900/60 text-blue-300 -mt-2 lg:mt-1">
                    SQL Query
                  </span>
                </div>

                {/* Node 4: Database */}
                <div className="w-full lg:w-48 p-3 rounded-xl border border-blue-500/40 bg-blue-950/20 shadow-lg text-left relative overflow-hidden shrink-0">
                  <div className="absolute top-0 inset-x-0 h-1 bg-[#3b82f6]" />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
                    <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                      <Database className="w-3.5 h-3.5" />
                      <span>DATABASE</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" title="Healthy" />
                  </div>
                  <div className="text-xs font-bold text-white mt-1.5 truncate">PostgreSQL Multi-AZ</div>
                  <div className="text-[11px] text-slate-400 truncate">Read Replica Pool</div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>LAT {isSurgeActive ? '65ms' : '28ms'}</span>
                    <span className="text-slate-300">{isSurgeActive ? '2,350 rps' : '700 rps'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Footer Bar */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                <span>Native vector calculus • 60 FPS De Casteljau packet evaluation • 0 external canvas runtimes</span>
              </span>
              <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-1">
                <span>Click canvas to open interactive simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section: Engineered for Backend & Platform Teams */}
      <section id="features" className="py-20 px-4 max-w-5xl mx-auto space-y-10 relative z-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-mono">
            <Activity className="w-3.5 h-3.5" />
            <span>CORE ARCHITECTURE ENGINE</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white text-balance">
            Engineered for Backend &amp; Platform Teams
          </h2>
          <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Interactive topology simulation, latency modeling, and declarative architecture specs — executed in pure SVG mathematics without heavyweight canvas engines.
          </p>
        </div>

        {/* Feature Grid with Prominent Simulation Hero Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hero Feature Card: Vector Calculus & Traffic Engine */}
          <div className="md:col-span-2 p-6 md:p-8 rounded-2xl border border-slate-800 bg-dark-900/80 hover:border-slate-700 transition-colors relative overflow-hidden group">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-4 max-w-xl">
                <div className="w-10 h-10 rounded-xl bg-dark-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">Simulation Runtime</span>
                  <h3 className="text-xl font-bold text-white mt-1">Native Vector Calculus &amp; De Casteljau Packet Evaluation</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Real distributed traffic behaves non-linearly. GraphFlow calculates cubic Bézier tangent velocities and queue depths on every frame. Simulate realistic network latencies, packet backpressure, and upstream cascading bottlenecks at a steady 60 FPS.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-md bg-dark-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    60 FPS Vector Calculus
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-dark-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    Cubic Bézier Interpolation
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-dark-950 border border-slate-800 text-[11px] font-mono text-slate-300">
                    0 External Canvas Runtimes
                  </span>
                </div>
              </div>

              {/* Minimal Technical Metric Callout */}
              <div className="shrink-0 p-4 rounded-xl border border-slate-800/80 bg-dark-950/90 font-mono text-xs space-y-2.5 min-w-[220px]">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>FRAME BUDGET</span>
                  <span className="text-emerald-400 font-semibold">16.6 ms</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>INTERPOLATION</span>
                  <span className="text-cyan-400 font-semibold">De Casteljau</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>PACKET CAPACITY</span>
                  <span className="text-slate-200 font-semibold">1,000 concurrent</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>MEMORY FOOTPRINT</span>
                  <span className="text-slate-200 font-semibold">&lt; 15 MB heap</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capability Card 1: Chaos & Spike Simulation */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-dark-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Chaos &amp; DDoS Surge Simulation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Inject load spikes and test edge resilience. Tune node error rates to watch HTTP 500 error packets propagate through downstream dependencies before deploying to production.
            </p>
          </div>

          {/* Capability Card 2: AI Architecture Synthesis */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-dark-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">AI Prompt-to-Architecture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Describe distributed requirements in natural language. GraphFlow synthesizes microservices, queues, caches, and database clusters with wire protocols and realistic latency profiles.
            </p>
          </div>

          {/* Capability Card 3: Terraform & Markdown Spec Export */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-dark-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Terraform, Docker &amp; Mermaid Export</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Turn diagrams directly into infrastructure. Export production Terraform scaffolding, Docker Compose network definitions, and GitHub-flavored Mermaid Markdown documentation.
            </p>
          </div>

          {/* Capability Card 4: Zero-Cost Instant State Sharing */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-dark-950 border border-slate-800 text-cyan-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero-Cost Instant URL Share</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Compress complete system topologies and runtime parameters directly into shareable URL hashes. Share interactive architecture simulations with colleagues with zero backend friction.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 max-w-5xl mx-auto space-y-12 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white text-balance">
            Choose the Plan That Fits Your Engineering Scale
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-200">Community</div>
              <div className="text-3xl font-extrabold text-white mt-2">$0</div>
              <div className="text-xs text-slate-400">Free forever for personal tinkering</div>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Interactive 60 FPS Simulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Pre-built Distributed Templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>JSON, Mermaid &amp; Docker Compose Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Instant URL Hash Sharing</span>
                </div>
              </div>
            </div>

            <button
              onClick={onEnterApp}
              className="w-full mt-8 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Start Free in Browser
            </button>
          </div>

          {/* Pro Tier (Featured) */}
          <div className="p-6 rounded-2xl border-2 border-cyan-400/70 bg-dark-900 relative shadow-xl shadow-black/40 flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[11px] font-semibold">
              Recommended
            </div>

            <div>
              <div className="text-sm font-bold text-cyan-300">Pro Developer</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-white tabular-nums">$12</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-xs text-slate-400">Or $99/year (Save 20%)</div>

              <div className="mt-6 space-y-3 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span><strong>AI Architecture Generator</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span><strong>Unlimited</strong> Cloud Saved Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Terraform (IaC) Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Mermaid Markdown Spec Generator</span>
                </div>
              </div>
            </div>

            <a
              href="https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242?embed=1"
              target="_blank"
              rel="noopener noreferrer"
              className="lemonsqueezy-button w-full mt-8 h-10 rounded-xl bg-slate-100 hover:bg-white text-slate-950 text-xs font-bold shadow-md shadow-black/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900"
            >
              <span>Upgrade to Pro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Team Tier */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-200">Engineering Team</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-extrabold text-white">$39</span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-xs text-slate-400">For startups & enterprise squads</div>

              <div className="mt-6 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Everything in Pro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Up to 10 Team Seats</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Live Multiplayer (Figma style)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Embeddable Notion/Docs Widget</span>
                </div>
              </div>
            </div>

            <button
              onClick={onOpenPricing}
              className="w-full mt-8 h-10 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Start Team Trial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-dark-950 py-10 px-4 text-center text-xs text-slate-400 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-md bg-cyan-500 flex items-center justify-center">
            <Cpu className="w-3 h-3 text-slate-950" />
          </div>
          <span className="font-bold text-sm text-slate-300">GraphFlow</span>
        </div>
        <p>© 2026 GraphFlow. Built with React, TypeScript, and native SVG mathematics.</p>
        <div className="flex items-center justify-center gap-4 text-slate-400 pt-2">
          <button onClick={onEnterApp} className="hover:text-cyan-400 transition-colors">Simulator Studio</button>
          <span>•</span>
          <button onClick={onOpenPricing} className="hover:text-cyan-400 transition-colors">Pricing</button>
          <span>•</span>
          <a href="https://github.com/Hanubaki/GraphFlow" target="_blank" rel="noreferrer" className="hover:text-cyan-400 transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  );
};
