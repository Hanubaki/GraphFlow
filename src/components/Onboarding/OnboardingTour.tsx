import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowRight, ArrowLeft, Check, Compass } from 'lucide-react';

export const TOUR_STORAGE_KEY = 'graphflow_tour_completed_v1';

export interface TourStep {
  id: string;
  targetSelector: string;
  badge: string;
  titleTr: string;
  titleEn: string;
  descTr: string;
  descEn: string;
  tipTr: string;
  tipEn: string;
  preferredPlacement: 'right' | 'bottom' | 'left';
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'palette',
    targetSelector: '[data-tour="palette"]',
    badge: 'STEP 01 // TOPOLOGY BUILDER',
    titleTr: 'Mimari Bileşen Paleti (Component Palette)',
    titleEn: 'Component Palette',
    descTr:
      'Buradan API Gateway, Mikroservis, PostgreSQL, Redis, Kafka veya 3. Parti API bileşenlerini kanvasa sürükleyip bırakabilir ya da tek tıkla ekleyebilirsin.',
    descEn:
      'Drag and drop or click to place API Gateways, Microservices, PostgreSQL, Redis, Kafka, or 3rd-party APIs directly onto the blueprint canvas.',
    tipTr: 'İPUCU: Bir düğümün sağ çıkış portundan diğer düğümün sol giriş portuna sürükleyerek bağlantı kurabilirsin.',
    tipEn: 'TIP: Drag from any node’s right output port to another node’s left input port to wire a pipeline.',
    preferredPlacement: 'right',
  },
  {
    id: 'presets',
    targetSelector: '[data-tour="presets"]',
    badge: 'STEP 02 // ARCHITECTURE PRESETS',
    titleTr: 'Hazır Mimari Şablonlar (Presets)',
    titleEn: 'Production Architecture Presets',
    descTr:
      'Sıfırdan başlamak istemiyorsan E-Ticaret, Fintech Ödeme Motoru, AI RAG Pipeline veya Video Streaming gibi gerçek dünya mimarilerini tek tıkla yükleyebilirsin.',
    descEn:
      'Load battle-tested production topologies—E-Commerce, Fintech Payment Engine, AI RAG Pipeline, or Video Streaming—in a single click.',
    tipTr: 'İPUCU: Şablonu yükledikten sonra üzerine yeni servisler ekleyip kendi sistemine göre özelleştirebilirsin.',
    tipEn: 'TIP: Every preset is fully editable—add nodes, rewire edges, or inject faults immediately.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'aigen',
    targetSelector: '[data-tour="aigen"]',
    badge: 'STEP 03 // AI SYNTHESIZER',
    titleTr: 'Yapay Zeka ile Mimari Üretici (AI Gen)',
    titleEn: 'AI Prompt-to-Architecture',
    descTr:
      'Kurmak istediğin sistemi doğal dille yaz (ör. "Yüksek trafikli yemek sipariş ve kurye takip sistemi"); motor tüm servisleri ve protokolleri otomatik kursun.',
    descEn:
      'Describe your architecture in plain text and let the engine synthesize the nodes, layers, and transport protocols automatically.',
    tipTr: 'İPUCU: Türkçe veya İngilizce komutlarla saniyeler içinde komple mikroservis topolojisi üretebilirsin.',
    tipEn: 'TIP: Supports both English and Turkish natural-language architecture prompts.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'sim-controls',
    targetSelector: '[data-tour="sim-controls"]',
    badge: 'STEP 04 // TRAFFIC & SPIKE ENGINE',
    titleTr: 'Canlı Trafik Hızı ve Spike (Yük) Testi',
    titleEn: 'Live Traffic & Spike Stress-Testing',
    descTr:
      'Simülasyon hızını (0.5x, 1x, 2x) buradan yönetebilir veya "Spike" (Yıldırım) tuşuna basarak sisteme anlık 3 kat aşırı trafik yükü gönderebilirsin.',
    descEn:
      'Adjust simulation speed (0.5x, 1x, 2x) or click the "Spike" bolt to inject a 3x traffic surge across all ingress pipelines.',
    tipTr: 'İPUCU: Spike anında kapasitesi aşan servislerde gecikmenin fırladığını ve Circuit Breaker sigortalarının attığını görebilirsin.',
    tipEn: 'TIP: Watch M/M/1 queueing latency climb and Circuit Breakers trip to OPEN under spike load.',
    preferredPlacement: 'bottom',
  },
  {
    id: 'inspector',
    targetSelector: '[data-tour="inspector"]',
    badge: 'STEP 05 // CHAOS & DIAGNOSTICS',
    titleTr: 'Servis Denetçisi ve Mühendislik Tanılama',
    titleEn: 'Service Inspector & Engineering Diagnostics',
    descTr:
      'Bir düğüme veya bağlantıya tıkladığında buradan Gecikme (ms), Hata Oranı (%), Paket Kaybı, RPS Kapasitesi ve Healthy/Degraded/Down kaos durumlarını değiştirebilirsin.',
    descEn:
      'Click any node or edge to tune Latency (ms), Error Rate (%), Packet Loss, RPS Capacity, or inject Degraded/Down chaos faults.',
    tipTr: 'İPUCU: Boşluğa tıkladığında burada sistemin Kritik Yol (Critical Path), Darboğaz (Bottleneck) ve SLA analizini görürsün.',
    tipEn: 'TIP: Deselect all nodes to view automated Critical Path Latency, Primary Bottleneck, and SLA diagnostics.',
    preferredPlacement: 'left',
  },
  {
    id: 'export',
    targetSelector: '[data-tour="export"]',
    badge: 'STEP 06 // INFRASTRUCTURE AS CODE',
    titleTr: 'Terraform, Docker Compose ve Spec Çıktısı',
    titleEn: 'Export to Terraform, Docker & Markdown ADR',
    descTr:
      'Test ettiğin mimariyi tek tıkla üretime hazır AWS Terraform (main.tf), docker-compose.yml, Mermaid + SLA Markdown Raporu (.md) veya JSON olarak indirebilirsin.',
    descEn:
      'Export your verified topology directly into AWS Terraform (main.tf), docker-compose.yml, Markdown ADR Specs (.md), or JSON.',
    tipTr: 'İPUCU: Üst menüdeki "?" (Rehber) ikonuna tıklayarak bu tanıtımı istediğin zaman tekrar açabilirsin.',
    tipEn: 'TIP: Click the "?" (Tour) button in the top bar anytime to replay this walkthrough.',
    preferredPlacement: 'bottom',
  },
];

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [tourLang, setTourLang] = useState<'en' | 'tr'>('en');
  const [rect, setRect] = useState<SpotlightRect | null>(null);

  const currentStep = TOUR_STEPS[stepIndex] || TOUR_STEPS[0];
  const isTr = tourLang === 'tr';

  const measureTarget = useCallback(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const el = document.querySelector(currentStep.targetSelector) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) {
      setRect(null);
      return;
    }
    const pad = 6;
    setRect({
      top: Math.max(4, r.top - pad),
      left: Math.max(4, r.left - pad),
      width: Math.min(window.innerWidth - 8, r.width + pad * 2),
      height: Math.min(window.innerHeight - 8, r.height + pad * 2),
    });
  }, [isOpen, currentStep.targetSelector]);

  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      return;
    }
    measureTarget();
    window.addEventListener('resize', measureTarget);
    return () => window.removeEventListener('resize', measureTarget);
  }, [isOpen, stepIndex, measureTarget]);

  const handleFinish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // ignore storage quota errors
    }
    onClose();
  }, [onClose]);

  const handleNext = useCallback(() => {
    if (stepIndex < TOUR_STEPS.length - 1) {
      setStepIndex(i => i + 1);
    } else {
      handleFinish();
    }
  }, [stepIndex, handleFinish]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      setStepIndex(i => i - 1);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleFinish();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleFinish, handleNext, handlePrev]);

  if (!isOpen) return null;

  // Compute callout card position based on target rect and preferred placement
  const cardWidth = 360;
  const cardHeight = 250;
  let cardStyle: React.CSSProperties = {
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  if (rect && typeof window !== 'undefined' && window.innerWidth >= 768) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 16;

    if (currentStep.preferredPlacement === 'right') {
      const left = Math.min(vw - cardWidth - 16, rect.left + rect.width + gap);
      const top = Math.max(70, Math.min(vh - cardHeight - 24, rect.top + 24));
      cardStyle = { top: `${top}px`, left: `${left}px` };
    } else if (currentStep.preferredPlacement === 'left') {
      const left = Math.max(16, rect.left - cardWidth - gap);
      const top = Math.max(70, Math.min(vh - cardHeight - 24, rect.top + 24));
      cardStyle = { top: `${top}px`, left: `${left}px` };
    } else {
      // bottom
      const top = Math.min(vh - cardHeight - 20, rect.top + rect.height + gap);
      const centeredLeft = rect.left + rect.width / 2 - cardWidth / 2;
      const left = Math.max(16, Math.min(vw - cardWidth - 16, centeredLeft));
      cardStyle = { top: `${top}px`, left: `${left}px` };
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isTr ? 'Stüdyo Hızlı Rehberi' : 'Studio Interactive Tour'}
      className="fixed inset-0 z-50 pointer-events-auto"
    >
      {/* Dimmed Backdrop with SVG Spotlight Cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="gf-tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {rect && (
              <rect
                x={rect.left}
                y={rect.top}
                width={rect.width}
                height={rect.height}
                rx="10"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(8, 9, 10, 0.74)"
          mask="url(#gf-tour-spotlight-mask)"
        />
      </svg>

      {/* Click outside to advance or close */}
      <div
        onClick={handleFinish}
        className="fixed inset-0"
        aria-hidden="true"
      />

      {/* Glowing Cyan Target Frame around the Active UI Control */}
      {rect && (
        <div
          style={{
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
          className="fixed pointer-events-none rounded-[10px] border-2 border-cyan-400 shadow-[0_0_0_4px_rgba(34,211,238,0.15),0_0_24px_rgba(34,211,238,0.35)] transition-all duration-200"
        >
          {/* Corner CAD crosshairs */}
          <span className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-300" />
          <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-300" />
          <span className="absolute -bottom-1.5 -left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-300" />
          <span className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-300" />
        </div>
      )}

      {/* Floating Tour Callout Card */}
      <div
        style={cardStyle}
        onClick={e => e.stopPropagation()}
        className="fixed w-[calc(100vw-32px)] max-w-[360px] rounded-xl bg-[#0f1012] border border-slate-700/90 shadow-[0_24px_60px_rgba(0,0,0,0.85)] p-4 text-slate-100 transition-all duration-200"
      >
        {/* Top Metadata Bar */}
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="font-mono text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">
              {currentStep.badge}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setTourLang(l => (l === 'en' ? 'tr' : 'en'))}
              className="px-1.5 py-0.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 font-mono text-[10px] font-semibold text-slate-300 transition-colors"
              title="Switch tour language (EN / TR)"
            >
              {tourLang.toUpperCase()}
            </button>
            <button
              onClick={handleFinish}
              className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors"
              title={isTr ? 'Rehberi Kapat (Esc)' : 'Close Tour (Esc)'}
              aria-label="Close onboarding tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="py-3 space-y-2">
          <h3 className="text-sm font-bold text-slate-100 tracking-tight">
            {isTr ? currentStep.titleTr : currentStep.titleEn}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {isTr ? currentStep.descTr : currentStep.descEn}
          </p>
          <div className="p-2.5 rounded-lg bg-[#08090a] border border-slate-800/90 text-[11px] font-mono text-cyan-300/90 leading-relaxed">
            {isTr ? currentStep.tipTr : currentStep.tipEn}
          </div>
        </div>

        {/* Footer Navigation & Step Dots */}
        <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setStepIndex(idx)}
                aria-label={`Go to step ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === stepIndex
                    ? 'w-5 bg-cyan-400'
                    : idx < stepIndex
                      ? 'w-1.5 bg-cyan-800'
                      : 'w-1.5 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
            <span className="ml-1.5 font-mono text-[11px] text-slate-400">
              {stepIndex + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleFinish}
              className="h-7 px-2 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              {isTr ? 'Atla' : 'Skip'}
            </button>

            {stepIndex > 0 && (
              <button
                onClick={handlePrev}
                className="h-7 px-2 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1 transition-colors"
                aria-label={isTr ? 'Önceki adım' : 'Previous step'}
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={handleNext}
              className="h-7 px-3 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
            >
              {stepIndex === TOUR_STEPS.length - 1 ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Başla' : 'Finish'}</span>
                </>
              ) : (
                <>
                  <span>{isTr ? 'İleri' : 'Next'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
