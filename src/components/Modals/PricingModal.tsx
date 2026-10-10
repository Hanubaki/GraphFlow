import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Check, Sparkles, X, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { soundFx } from '../../utils/sound';
import { telemetry } from '../../utils/telemetry';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onOpenAuth }) => {
  const [isAnnual, setIsAnnual] = useState(true);
  const { user, isPro, planTier, refreshProfile } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).createLemonSqueezy) {
      (window as any).createLemonSqueezy();
      (window as any).LemonSqueezy?.Setup?.({
        eventHandler: (event: { event: string }) => {
          if (event.event === 'Checkout.Success') {
            soundFx.playSuccess();
            refreshProfile?.();
          }
        },
      });
    }
  }, [refreshProfile]);

  // Accessibility: close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const defaultCheckoutUrl = 'https://graphflow.lemonsqueezy.com/checkout/buy/3022e88b-f961-4b6d-8e5d-2840d312a242?embed=1';
  const checkoutUrl = user
    ? `${defaultCheckoutUrl}&checkout[custom][user_id]=${user.id}&checkout[email]=${encodeURIComponent(user.email || '')}`
    : defaultCheckoutUrl;

  const handleProClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    soundFx.playClick();
    telemetry.track('Checkout Clicked', {
      tier: 'pro',
      billingCycle: isAnnual ? 'annual' : 'monthly',
      source: 'pricing_modal',
    });

    if (!user && onOpenAuth) {
      e.preventDefault();
      onClose();
      onOpenAuth();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pricing-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none"
    >
      <div className="bg-dark-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 text-center border-b border-slate-800 bg-gradient-to-b from-purple-950/20 to-transparent relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            aria-label="Close pricing modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-800/50 text-purple-400 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            GraphFlow Pro & Cloud
          </div>
          <h2 id="pricing-modal-title" className="text-2xl font-bold text-slate-100 tracking-tight">
            Supercharge Your System Architecture Workflow
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Unlimited cloud projects, AI generation, 4K vector exports, and real-time team collaboration.
          </p>

          {/* Current User Badge */}
          {user && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dark-950 border border-slate-800 text-[11px] text-slate-300 mt-2">
              <UserCheck className="w-3 h-3 text-cyan-400" />
              <span>Signed in as <strong>{user.email}</strong> ({planTier.toUpperCase()} tier)</span>
            </div>
          )}

          {/* Monthly / Annual Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-dark-950 border border-slate-800 mt-4 text-xs font-semibold">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                !isAnnual ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors ${
                isAnnual ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Annual</span>
              <span className="text-[10px] bg-purple-900/80 px-1.5 py-0.2 rounded text-purple-200">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          {/* Free Tier */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-dark-950/60 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-200">Community</div>
              <div className="text-2xl font-extrabold text-slate-100 mt-2">$0</div>
              <div className="text-[11px] text-slate-500">Free forever for personal tinkering</div>

              <div className="mt-5 space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Up to 3 Saved Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Interactive 60 FPS Simulation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Standard PNG Export</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>AI Prompt Generation</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`w-full mt-6 py-2 px-3 rounded-xl border border-slate-800 text-xs font-semibold transition-colors ${
                !isPro ? 'bg-slate-800 text-slate-200' : 'bg-dark-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {!isPro ? 'Current Plan' : 'Free Tier'}
            </button>
          </div>

          {/* Pro Tier (Highlighted) */}
          <div className="p-5 rounded-2xl border-2 border-purple-500/80 bg-purple-950/20 relative shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col justify-between">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              Most Popular
            </div>

            <div>
              <div className="text-sm font-bold text-purple-300">Pro Developer</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-white">
                  {isAnnual ? '$9' : '$12'}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-[11px] text-slate-400">Billed {isAnnual ? 'annually ($99)' : 'monthly'}</div>

              <div className="mt-5 space-y-2.5 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span><strong>Unlimited</strong> Saved Projects</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span><strong>AI Architecture Generator</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>High-Res 4K SVG & PDF Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span>Markdown & Mermaid Spec Exporter</span>
                </div>
              </div>
            </div>

            {isPro ? (
              <div className="space-y-2 mt-6">
                <div className="w-full py-2 px-3 rounded-xl bg-purple-900/50 border border-purple-500/50 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Active Subscription</span>
                </div>
                <a
                  href="https://app.lemonsqueezy.com/my-orders"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-1.5 px-3 rounded-xl border border-slate-700 bg-dark-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                >
                  Manage Invoices & Billing
                </a>
              </div>
            ) : (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleProClick}
                className="lemonsqueezy-button w-full mt-6 py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-950 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <span>{user ? 'Upgrade to Pro' : 'Sign In & Upgrade to Pro'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Team Tier */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-dark-950/60 flex flex-col justify-between">
            <div>
              <div className="text-sm font-bold text-slate-200">Engineering Team</div>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-2xl font-extrabold text-slate-100">
                  {isAnnual ? '$32' : '$39'}
                </span>
                <span className="text-xs text-slate-400">/ month</span>
              </div>
              <div className="text-[11px] text-slate-500">For startups & enterprise squads</div>

              <div className="mt-5 space-y-2.5 text-xs text-slate-300">
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
              onClick={() => {
                alert('Team Plan Checkout: Contact sales or checkout via Lemon Squeezy!');
              }}
              className="w-full mt-6 py-2 px-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
            >
              Start Team Trial
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
