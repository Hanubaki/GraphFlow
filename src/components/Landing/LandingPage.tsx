import React from 'react';
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
  RotateCcw,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenPricing: () => void;
  onOpenAuth?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp, onOpenPricing, onOpenAuth }) => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen w-full bg-[#090d16] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden relative">
      {/* Glow Orbs Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-cyan-600/10 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[30%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[160px]" />
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-30 border-b border-slate-800/80 bg-dark-900/80 backdrop-blur-xl sticky top-0 px-4 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
            <Cpu className="w-4 h-4 text-white" />
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

        {/* Illustrative Topology Preview */}
        <div id="demo" className="pt-10">
          <div
            role="img"
            aria-label="Illustrative preview of a GraphFlow topology: client, API gateway, microservice, and database with latency and throughput readouts"
            className="relative rounded-2xl border border-slate-800 bg-dark-900/90 shadow-2xl p-4 md:p-6 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent z-10 pointer-events-none" />

            {/* Mock Editor Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-slate-200 font-semibold">Simulation running · 730 rps</span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span>p50 18 ms</span>
              </div>
            </div>

            {/* Mock Node & Edge Diagram */}
            <div className="min-h-[17rem] w-full relative grid grid-cols-2 lg:grid-cols-4 gap-3 items-center justify-items-center px-2 py-8">
              {/* Client Node */}
              <div className="w-full max-w-[180px] p-3 rounded-xl border border-slate-800 bg-dark-950/90 shadow-lg text-left">
                <div className="text-[11px] text-cyan-400 font-mono">CLIENT</div>
                <div className="text-xs font-bold text-white truncate">Next.js Store</div>
                <div className="text-[11px] text-slate-400 mt-1">LAT: 15ms • 450 rps</div>
              </div>

              {/* Gateway Node */}
              <div className="w-full max-w-[180px] p-3 rounded-xl border border-cyan-500/50 bg-cyan-950/20 text-left">
                <div className="text-[11px] text-indigo-400 font-mono">INGRESS</div>
                <div className="text-xs font-bold text-white truncate">Kong API Gateway</div>
                <div className="text-[11px] text-slate-400 mt-1">LAT: 6ms • 1500 rps</div>
              </div>

              {/* Service Node */}
              <div className="w-full max-w-[180px] p-3 rounded-xl border border-purple-500/40 bg-purple-950/20 text-left">
                <div className="text-[11px] text-purple-400 font-mono">MICROSERVICE</div>
                <div className="text-xs font-bold text-white truncate">Order Processor</div>
                <div className="text-[11px] text-slate-400 mt-1">LAT: 35ms • Kafka Sync</div>
              </div>

              {/* DB Node */}
              <div className="w-full max-w-[180px] p-3 rounded-xl border border-blue-500/40 bg-blue-950/20 text-left">
                <div className="text-[11px] text-blue-400 font-mono">DATABASE</div>
                <div className="text-xs font-bold text-white truncate">PostgreSQL Multi-AZ</div>
                <div className="text-[11px] text-slate-400 mt-1">LAT: 28ms • SQL Query</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-20 px-4 max-w-5xl mx-auto space-y-12 relative z-10">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white text-balance">
            Built for Architects, System Designers, and Developers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Real-Time Traffic Engine</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Cubic bezier velocity calculations simulate real request transit times, queue delays, and throughput bottlenecks in real-time.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800/50 text-sky-300 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">AI Prompt-to-Architecture</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Describe your system in plain text. GraphFlow automatically synthesizes gateways, services, databases, and connects them with optimal protocols.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800/50 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Chaos & DDoS Simulation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Trigger traffic spikes, configure error rates, and observe how your system handles degraded nodes with visual HTTP 500 error packets.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950 border border-blue-800/50 text-blue-400 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Command Pattern History</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Full undo/redo stack (`Ctrl+Z`, `Ctrl+Y`) and keyboard shortcuts ensure zero loss of architecture design context.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800/50 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Mermaid & README Export</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Export high-res diagrams or generate production-ready Markdown specifications with embedded Mermaid syntax for GitHub repositories.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-dark-900/60 hover:border-slate-700 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800/50 text-rose-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Zero-Cost Instant URL Share</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Compresses active architecture state directly into a shareable URL hash. Send it to colleagues to replicate your exact simulation instantly.
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
              <div className="text-xs text-slate-500">Free forever for personal tinkering</div>

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
              <div className="text-xs text-slate-500">For startups & enterprise squads</div>

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
      <footer className="border-t border-slate-800/80 bg-dark-950 py-10 px-4 text-center text-xs text-slate-500 space-y-3">
        <div className="flex items-center justify-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center">
            <Cpu className="w-3 h-3 text-white" />
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
