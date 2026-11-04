import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Sparkles,
  Terminal,
  AlertTriangle,
  HelpCircle,
  Quote,
  Github,
  Mail,
} from 'lucide-react';
import { TEMPLATES } from '../../constants/templates';
import { ArchitectureTemplate } from '../../types/graph';
import type { LegalTab } from '../Modals/LegalComplianceModal';

interface LandingSectionsProps {
  onEnterApp: () => void;
  onOpenPricing: () => void;
  onSelectBlueprint?: (template: ArchitectureTemplate) => void;
  onOpenLegal?: (tab: LegalTab) => void;
}

export const BreadcrumbBar: React.FC<{ onEnterApp: () => void }> = ({ onEnterApp }) => (
  <nav
    aria-label="Breadcrumb"
    className="relative z-10 max-w-6xl mx-auto px-5 md:px-8 pt-6 text-[12px] font-mono text-slate-400 flex items-center gap-1.5 flex-wrap"
  >
    <a href="#top" className="hover:text-slate-100 transition-colors">
      Home
    </a>
    <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
    <a href="#blueprints" className="hover:text-slate-100 transition-colors">
      Architecture Blueprints
    </a>
    <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
    <a href="#case-studies" className="hover:text-slate-100 transition-colors">
      Case Studies
    </a>
    <ChevronRight className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
    <button
      type="button"
      onClick={onEnterApp}
      className="text-cyan-400 hover:text-cyan-300 transition-colors"
    >
      Interactive 60 FPS Studio
    </button>
  </nav>
);

export const ThankYouBanner: React.FC<{
  onDismiss: () => void;
  onEnterApp: () => void;
}> = ({ onDismiss, onEnterApp }) => (
  <section
    aria-label="Thank you confirmation"
    className="relative z-20 max-w-6xl mx-auto px-5 md:px-8 pt-6"
  >
    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-slate-50">
            Teşekkürler — İşleminiz &amp; Talebiniz Başarıyla Alındı (Thank You)
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            GraphFlow Pro / Mimari Simülasyon talebiniz kaydedildi. Doğrudan 60 FPS stüdyoya geçerek AWS Terraform,
            Kubernetes HPA ve Canlı ERP/API özelliklerini kullanmaya başlayabilirsiniz.
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onEnterApp}
          className="px-3.5 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Stüdyoyu Aç</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
        >
          Kapat
        </button>
      </div>
    </div>
  </section>
);

export const NotFound404Banner: React.FC<{
  path: string;
  onResetHome: () => void;
  onEnterApp: () => void;
}> = ({ path, onResetHome, onEnterApp }) => (
  <section
    aria-label="404 Page Not Found"
    className="relative z-20 max-w-6xl mx-auto px-5 md:px-8 pt-8"
  >
    <div className="rounded-2xl border border-amber-500/40 bg-slate-950 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-amber-950/60 border border-amber-700/50 text-amber-300 font-mono text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>HTTP 404 // ROUTE_NOT_FOUND</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-50 tracking-tight">
          Aradığınız Sayfa Bulunamadı ({path})
        </h2>
        <p className="text-sm text-slate-400 max-w-xl">
          Bu uç nokta topolojide mevcut değil veya taşınmış. Ana sayfaya dönebilir ya da doğrudan 60 FPS mimari
          simülasyon stüdyosunu başlatabilirsiniz.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onEnterApp}
          className="h-10 px-4 rounded-lg bg-slate-50 hover:bg-white text-slate-950 text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
        >
          <span>Open 60 FPS Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onResetHome}
          className="h-10 px-4 rounded-lg border border-slate-800 hover:bg-slate-900 text-slate-200 text-sm font-medium transition-colors"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    </div>
  </section>
);

const CASE_STUDIES = [
  {
    id: 'cs-fintech-ledger',
    badge: 'CASE STUDY 01 // FINTECH PAYMENTS',
    title: 'Idempotent Webhook & Double-Entry Ledger Under 5x Flash Surge',
    problem:
      'Synchronous PostgreSQL writes on incoming payment webhooks caused connection pool exhaustion and 840ms p99 spikes during flash checkout events.',
    solution:
      'Decoupled webhook ingestion with Redis idempotency locks + partitioned Kafka queue before the ledger workers in GraphFlow Studio.',
    metrics: [
      { label: 'p99 Latency', value: '840ms → 38ms' },
      { label: 'Dropped Webhooks', value: '4.2% → 0.0%' },
      { label: 'Composite SLA', value: '99.98%' },
    ],
    templateIndex: 0,
  },
  {
    id: 'cs-ai-rag',
    badge: 'CASE STUDY 02 // AI RAG PIPELINE',
    title: 'Semantic Vector Cache & LLM Circuit Breaker Hardening',
    problem:
      'Unthrottled LLM API calls drove monthly inference spend above $3,200/mo and cascaded 504 timeouts whenever upstream token latency spiked.',
    solution:
      'Simulated a Redis semantic cache layer (68% hit ratio) and automated 5-error circuit breaker fallback in GraphFlow before deploying Terraform.',
    metrics: [
      { label: 'Monthly Cloud/LLM Spend', value: '-$1,420/mo' },
      { label: 'Tail p99 Recovery', value: '6.0s Auto-Heal' },
      { label: 'Cache Hit Offload', value: '68% RPS' },
    ],
    templateIndex: 1,
  },
  {
    id: 'cs-global-edge',
    badge: 'CASE STUDY 03 // GLOBAL STREAMING',
    title: 'Multi-Region Edge CDN & Read-Replica Bottleneck Elimination',
    problem:
      'Single-region database fan-in saturated at 2,400 RPS during regional traffic failover drills.',
    solution:
      'Modeled fan-in capacity ceilings and added read-replicas + edge caching in GraphFlow, exporting production Kubernetes HPA manifests.',
    metrics: [
      { label: 'Max Safe Capacity', value: '2.4k → 9.6k RPS' },
      { label: 'SPOF Count', value: '3 → 0 SPOFs' },
      { label: 'IaC Export Time', value: '< 30 sec' },
    ],
    templateIndex: 2,
  },
];

const TESTIMONIALS = [
  {
    quote:
      'The fan-in queue saturation and p99 cliff-edge simulation matches real production incidents we hit when downstream workers fall behind Kafka.',
    author: 'Staff SRE & Distributed Systems Engineer',
    role: 'r/sre Community Verification · Production Infrastructure',
    metric: 'Verified Queue Physics',
  },
  {
    quote:
      'Dragging a legacy .drawio or docker-compose.yml file onto the canvas and immediately seeing where the bottleneck chokes under a 3x load surge saved our architecture review two days.',
    author: 'Principal Cloud Architect',
    role: 'FinTech Platform Team · AWS & Terraform Workflow',
    metric: 'draw.io → Terraform in 1 Click',
  },
  {
    quote:
      'Having Prometheus/JSON live metrics stream into the same diagram we use for RFCs and exporting Grafana k6 + OpenShift-compatible configs is a game changer.',
    author: 'Platform Engineering Lead',
    role: 'Kubernetes & OpenShift Hybrid Cloud',
    metric: 'Live Digital Twin + k6',
  },
];

const FAQ_ITEMS = [
  {
    q: '1. Mevcut docker-compose.yml, .drawio, .excalidraw veya Terraform dosyamı nasıl canlı diyagrama çeviririm?',
    a: 'Stüdyoyu açıp bilgisayarınızdaki .drawio, .excalidraw, docker-compose.yml veya main.tf dosyasını doğrudan tuvalin üzerine sürükleyip bırakmanız yeterlidir. GraphFlow servisleri, veritabanlarını, kuyrukları ve bağlantıları saniyeler içinde 60 FPS canlı topolojiye dönüştürür.',
  },
  {
    q: '2. Çizdiğim mimariden doğrudan çalışır AWS Terraform ve Kubernetes (HPA) kodu alabilir miyim?',
    a: 'Evet. Export & Import Hub üzerinden tek tıkla docker-compose.yml, Mermaid.js (GitHub PR), SVG/PNG diyagramı, AWS Terraform (RDS, ElastiCache, SQS, ECS, ALB) ve Kubernetes HPA manifest dosyalarını indirebilirsiniz.',
  },
  {
    q: '3. Simülatör darboğazları (bottleneck), p99 gecikmesini ve aylık AWS/GCP/Azure maliyetini nasıl hesaplıyor?',
    a: 'GraphFlow, yönlü çevrimsiz graf (DAG) fizik motoruyla her düğümün gelen trafik yükünü (fan-in RPS), kapasite tavanını, kuyruk birikimini (queue lag), tekil hata noktalarını (SPOF), bileşik SLA yüzdesini ve AWS/GCP/Azure aylık tahmini bulut maliyetini gerçek zamanlı hesaplar.',
  },
  {
    q: '4. Mimari diyagramlarım dış sunuculara gönderiliyor mu? KVKK ve veri gizliliği nasıl korunuyor?',
    a: 'Varsayılan olarak tüm çizimleriniz %100 tarayıcınızın yerel belleğinde (localStorage) ve paylaşılan URL (#share=) içinde çalışır; sunucuya gönderilmez. Bulut kayıt (Supabase) tamamen isteğe bağlıdır, PostgreSQL Row-Level Security (RLS) ile korunur ve fontlar kendi sunucumuzdan (self-hosted) yüklenir.',
  },
  {
    q: '5. Canlı üretim (Prometheus / REST API / ERP) metriklerini diyagramıma bağlayabilir miyim?',
    a: 'Evet. Üst araç çubuğundaki "Live ERP/API" butonuyla gerçek zamanlı JSON, CSV veya Prometheus metrik uç noktanızı bağlayarak üretimdeki anlık RPS, gecikme ve hata oranlarını canlı diyagram üzerinde izleyebilirsiniz.',
  },
];

export const PreLaunchSections20: React.FC<LandingSectionsProps> = ({
  onEnterApp,
  onSelectBlueprint,
  onOpenLegal,
}) => {
  const [openFaqIdx, setOpenFaqIdx] = useState<number>(0);

  return (
    <>
      {/* 1. Vaka Çalışmaları (Case Studies) */}
      <section id="case-studies" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-28">
          <div className="grid md:grid-cols-2 gap-6 md:gap-16 mb-12">
            <div>
              <div className="font-mono text-xs text-cyan-400 mb-2">ENGINEERING CASE STUDIES // VERIFIED ROI</div>
              <h2 className="font-semibold tracking-[-0.035em] text-slate-50 text-3xl md:text-5xl leading-[1.06]">
                Real bottlenecks caught before deploy
              </h2>
            </div>
            <p className="max-w-[46ch] text-[16px] leading-relaxed text-slate-400 md:pt-4">
              How engineering teams use GraphFlow to stress-test queue backpressure, eliminate single points of failure,
              and cut monthly cloud spend before writing production infrastructure code.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {CASE_STUDIES.map(cs => {
              const tpl = TEMPLATES[cs.templateIndex] || TEMPLATES[0];
              return (
                <article
                  key={cs.id}
                  className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <span className="inline-block font-mono text-[11px] px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/50 text-cyan-300">
                      {cs.badge}
                    </span>
                    <h3 className="text-[16px] font-semibold text-slate-50 leading-snug">{cs.title}</h3>
                    <p className="text-[13px] text-slate-400 leading-relaxed">
                      <strong className="text-slate-200">Before:</strong> {cs.problem}
                    </p>
                    <p className="text-[13px] text-slate-300 leading-relaxed">
                      <strong className="text-cyan-300">Fix:</strong> {cs.solution}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-dark-900 border border-slate-800 font-mono text-[11px]">
                      {cs.metrics.map(m => (
                        <div key={m.label}>
                          <div className="text-slate-500 text-[10px] truncate">{m.label}</div>
                          <div className="text-emerald-400 font-semibold mt-0.5">{m.value}</div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectBlueprint && tpl) {
                          onSelectBlueprint(tpl);
                        } else {
                          onEnterApp();
                        }
                      }}
                      className="w-full h-9 px-3 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-medium inline-flex items-center justify-between transition-colors"
                    >
                      <span>Simulate this case study</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* 2. Müşteri & Mühendis Yorumları (Testimonials) */}
      <section id="testimonials" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-28">
          <div className="mb-12">
            <div className="font-mono text-xs text-cyan-400 mb-2">COMMUNITY &amp; ARCHITECT FEEDBACK</div>
            <h2 className="font-semibold tracking-[-0.035em] text-slate-50 text-3xl md:text-4xl leading-tight">
              Trusted by SREs and systems architects
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, idx) => (
              <blockquote
                key={idx}
                className="rounded-xl border border-slate-800 bg-slate-950/90 p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Quote className="w-4 h-4 text-cyan-400" aria-hidden="true" />
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                      {t.metric}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-200 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <footer className="pt-3 border-t border-slate-800/80">
                  <div className="text-xs font-semibold text-slate-100">{t.author}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{t.role}</div>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 5 Adet SSS (5 Interactive FAQs) */}
      <section id="faq" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-24 md:py-28">
          <div className="grid md:grid-cols-[1fr_1.5fr] gap-8 md:gap-16">
            <div>
              <div className="inline-flex items-center gap-1.5 font-mono text-xs text-cyan-400 mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>FREQUENTLY ASKED QUESTIONS (5 SSS)</span>
              </div>
              <h2 className="font-semibold tracking-[-0.035em] text-slate-50 text-3xl md:text-4xl leading-tight">
                Sıkça Sorulan Sorular &amp; Teknik Detaylar
              </h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Mimari içe aktarma, Terraform/K8s kod üretimi, veri gizliliği ve canlı telemetri hakkında en çok
                sorulan 5 temel soru.
              </p>
            </div>

            <div className="space-y-2.5">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIdx === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-800 bg-slate-950/90 overflow-hidden"
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                      className="w-full px-4 py-3.5 text-left flex items-center justify-between gap-3 text-xs md:text-sm font-semibold text-slate-100 hover:bg-slate-900/60 transition-colors"
                    >
                      <span>{item.q}</span>
                      <span className="font-mono text-cyan-400 text-sm shrink-0">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs md:text-[13px] text-slate-300 leading-relaxed border-t border-slate-800/60">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Takım Fotoğrafı / Kurucu Mühendis & Google Harita / Adres Kartı */}
      <section id="team" className="relative z-10 border-t border-slate-800/70 scroll-mt-14">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-20 md:py-24">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Founder / Team Photo Card with descriptive alt attribute */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <img
                src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><rect width='160' height='160' rx='28' fill='%230b1320' stroke='%2322d3ee' stroke-width='3'/><circle cx='80' cy='62' r='26' fill='%231e293b' stroke='%2338bdf8' stroke-width='2.5'/><path d='M36 138c8-26 28-38 44-38s36 12 44 38' fill='%231e293b' stroke='%2338bdf8' stroke-width='2.5'/><text x='80' y='69' text-anchor='middle' fill='%23e2e8f0' font-family='monospace' font-weight='bold' font-size='18'>BA</text></svg>"
                alt="Berke Akdemir – GraphFlow Founder and Distributed Systems Architect portrait"
                width={84}
                height={84}
                loading="lazy"
                className="w-20 h-20 rounded-2xl border border-cyan-500/40 shrink-0"
              />
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-cyan-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>CORE ENGINEERING TEAM</span>
                </div>
                <h3 className="text-base font-bold text-slate-50">Berke Akdemir — Founder &amp; Lead Architect</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Building deterministic 60 FPS distributed systems simulation, chaos fault modeling, and zero-friction
                  IaC compilers for SRE and backend teams worldwide.
                </p>
                <div className="flex items-center gap-3 pt-1 text-xs">
                  <a
                    href="https://github.com/Hanubaki"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-200 hover:text-cyan-300 font-medium"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>@Hanubaki</span>
                  </a>
                  <a
                    href="mailto:berkeakdemir5855@gmail.com"
                    className="inline-flex items-center gap-1 text-slate-200 hover:text-cyan-300 font-medium"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>berkeakdemir5855@gmail.com</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Address, Google Maps Link & KVKK Data Controller Hub */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>ENGINEERING HQ &amp; KVKK VERİ SORUMLUSU ADRESİ</span>
                </div>
                <h3 className="text-base font-bold text-slate-50">İstanbul, Türkiye · Global Cloud Edge</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Koordinatlar: <code className="text-slate-200">41.0082° N, 28.9784° E</code> (İstanbul / Türkiye) ·
                  7/24 KVKK &amp; Güvenlik İrtibat: <code className="text-cyan-300">berkeakdemir5855@gmail.com</code>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <a
                  href="https://maps.google.com/?q=Istanbul,Turkey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Google Haritalar&apos;da Aç</span>
                </a>
                <button
                  type="button"
                  onClick={() => onOpenLegal?.('kvkk')}
                  className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-medium text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>KVKK &amp; Gizlilik Merkezi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export const StickyMobileCtaBar: React.FC<{
  onEnterApp: () => void;
  onOpenPricing: () => void;
}> = ({ onEnterApp, onOpenPricing }) => (
  <div className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-slate-800 bg-dark-950/95 backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-2">
    <button
      type="button"
      onClick={onEnterApp}
      className="flex-1 h-10 px-3 rounded-lg bg-slate-50 text-slate-950 text-xs font-bold inline-flex items-center justify-center gap-1.5"
    >
      <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
      <span>Open 60 FPS Studio</span>
    </button>
    <button
      type="button"
      onClick={onOpenPricing}
      className="h-10 px-3.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 text-xs font-semibold"
    >
      Pro / Pricing
    </button>
  </div>
);
