import React, { useState } from 'react';
import { X, ShieldCheck, FileText, Scale, AlertTriangle, Mail, CheckCircle2 } from 'lucide-react';
import { useEscapeToClose } from '../../hooks/useEscapeToClose';
import { logSecurityIncident72h, getRecentSecurityIncidents } from '../../utils/complianceAudit';

export type LegalTab = 'kvkk' | 'privacy' | 'distance-sales' | 'breach-72h';

interface LegalComplianceModalProps {
  isOpen: boolean;
  initialTab?: LegalTab;
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({
  isOpen,
  initialTab = 'kvkk',
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const [breachSummary, setBreachSummary] = useState('');
  const [breachSubmitted, setBreachSubmitted] = useState<string | null>(null);

  useEscapeToClose(isOpen, onClose);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breachSummary.trim()) return;
    const record = logSecurityIncident72h(
      'data_breach_suspected',
      'critical',
      '127.0.0.1',
      breachSummary.trim()
    );
    setBreachSubmitted(
      `Incident Record Created (${record.incidentId}). 72-Hour GDPR/KVKK Notification Deadline: ${new Date(
        record.notificationDeadline72hIso
      ).toUTCString()}`
    );
    setBreachSummary('');
  };

  const recentIncidents = getRecentSecurityIncidents();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none"
    >
      <div className="bg-dark-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 md:p-6 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-[11px] font-semibold mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>GDPR / KVKK · Privacy · Terms of Sale · 72h Breach Response</span>
            </div>
            <h2 id="legal-modal-title" className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Legal Terms, Privacy Policy &amp; Data Security Center
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-dark-950/60">
          {[
            { id: 'kvkk' as LegalTab, label: 'Data Protection (GDPR / KVKK)', icon: ShieldCheck },
            { id: 'privacy' as LegalTab, label: 'Privacy Policy', icon: FileText },
            { id: 'distance-sales' as LegalTab, label: 'Terms of Sale & Refunds', icon: Scale },
            { id: 'breach-72h' as LegalTab, label: '72h Breach Response & Requests', icon: AlertTriangle },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-cyan-400 text-cyan-300 bg-slate-900/90'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300 select-text">
          {activeTab === 'kvkk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  1. Data Protection Notice (GDPR &amp; KVKK Law No. 6698)
                </h3>
                <p>
                  <strong>Data Controller:</strong> GraphFlow Architecture Simulation Studio — Berke Akdemir
                  (<code className="text-cyan-300">berkeakdemir5855@gmail.com</code>, Istanbul, Turkey).
                </p>
                <p>
                  <strong>Processed Personal Data &amp; Purpose:</strong> When you create an account or enable cloud
                  synchronization, your email address, user ID (`UUID`), subscription tier (`free/pro/team`), and saved
                  system architecture topologies are processed strictly for contract execution and legitimate service
                  operation.
                </p>
                <p>
                  <strong>Local-First Guarantee:</strong> When you use the studio without signing into cloud sync, your
                  diagrams remain 100% in your browser&apos;s local storage (`localStorage`) and URL hash (`#share=`)
                  and are never transmitted to external servers.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  2. Explicit Cloud Sync &amp; Optional Communications Consent
                </h3>
                <p>
                  Because cloud project backup (`Supabase Cloud`), global payment processing (`Lemon Squeezy`), and
                  optional AI synthesis (`Google Gemini API`) operate on distributed global cloud infrastructure, cloud
                  account synchronization requires your separate explicit consent.
                </p>
                <p>
                  Product update and newsletter emails are strictly optional, disabled by default, and managed via a
                  separate opt-in checkbox.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Privacy Policy &amp; Self-Hosted Zero-Leak Architecture
                </h3>
                <p>
                  GraphFlow is engineered with a <strong>Privacy-by-Design</strong> architecture:
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>
                    <strong>Zero Third-Party Font Tracking:</strong> Fonts (`Mona Sans`, `IBM Plex Mono`) are served
                    locally/self-hosted without automatic IP leakage to `fonts.googleapis.com` or `fonts.gstatic.com`.
                  </li>
                  <li>
                    <strong>PII-Scrubbed Telemetry (`src/utils/telemetry.ts`):</strong> Automatic scrubbing strips any
                    `email`, `password`, `token`, `secret`, `apiKey`, or `creditCard` keys before in-memory analytics.
                  </li>
                  <li>
                    <strong>Row-Level Security (`supabase/schema.sql`):</strong> Every table (`public.profiles`,
                    `public.projects`) enforces strict PostgreSQL Row Level Security (`auth.uid() = user_id`).
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'distance-sales' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  1. Pre-Information &amp; Service Summary
                </h3>
                <p>
                  <strong>Provider:</strong> GraphFlow (Berke Akdemir — Contact:{' '}
                  <code className="text-cyan-300">berkeakdemir5855@gmail.com</code>, Istanbul, Turkey) | Merchant of
                  Record: <strong>Lemon Squeezy, LLC</strong>.
                </p>
                <p>
                  <strong>Service Scope &amp; Pricing:</strong> GraphFlow Pro Digital SaaS Subscription (Unlimited cloud
                  architecture projects, AWS Terraform &amp; Kubernetes HPA code generation, AI architecture synthesizer,
                  and live API/ERP telemetry streaming). Pricing: <strong>$12/month</strong> on monthly billing or{' '}
                  <strong>$99/year</strong> ($9/month equivalent) on annual billing + applicable local taxes.
                </p>
                <p>
                  <strong>Delivery &amp; Activation:</strong> Digital subscription entitlements activate immediately upon
                  payment confirmation via signed webhook verification.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  2. Terms of Sale &amp; Cancellation / Refund Policy
                </h3>
                <p>
                  You can cancel your subscription at any time in one click via the{' '}
                  <strong>&ldquo;Manage Invoices &amp; Billing&rdquo;</strong> portal or by emailing{' '}
                  <code className="text-cyan-300">berkeakdemir5855@gmail.com</code> to stop future billing cycles
                  immediately.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'breach-72h' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  GDPR Art. 33 / KVKK Art. 12 — 72-Hour Security Incident Notification &amp; Response Procedure
                </h3>
                <p>
                  If an unauthorized access attempt, webhook signature violation (`401`), or suspected data leak is
                  detected, the system automatically creates a{' '}
                  <code className="text-cyan-300">KVKK_72H_SECURITY_INCIDENT_MONITOR</code> audit record, computes the{' '}
                  <code className="text-cyan-300">detectedAt + 72 hours</code> statutory notification deadline, and
                  escalates to the Data Controller (<code className="text-cyan-300">berkeakdemir5855@gmail.com</code>).
                </p>

                <form onSubmit={handleReportIncident} className="pt-2 space-y-2.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Log a Security Vulnerability, Data Breach Report, or Data Subject Request (Deletion / Access):
                  </label>
                  <textarea
                    rows={2}
                    value={breachSummary}
                    onChange={e => setBreachSummary(e.target.value)}
                    placeholder="Describe any suspected security issue, vulnerability report, or data deletion/access request..."
                    className="w-full rounded-xl bg-dark-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      Log 72h Incident &amp; Notify
                    </button>
                    <a
                      href="mailto:berkeakdemir5855@gmail.com?subject=URGENT%2072h%20Security%20Report%20/%20Data%20Subject%20Request"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Email Data Controller Directly</span>
                    </a>
                  </div>
                </form>

                {breachSubmitted && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>{breachSubmitted}</span>
                  </div>
                )}

                {recentIncidents.length > 0 && (
                  <div className="pt-2">
                    <div className="text-[11px] font-mono text-slate-400 mb-1">Recent Security / 72h Incident Logs:</div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {recentIncidents.slice(-3).map(inc => (
                        <div key={inc.incidentId} className="p-2 rounded bg-dark-900 border border-slate-800 text-slate-300">
                          [{inc.incidentId}] {inc.category} | Deadline: {inc.notificationDeadline72hIso}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-dark-950 flex items-center justify-between text-xs text-slate-400">
          <span>Data Controller Contact: berkeakdemir5855@gmail.com</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
