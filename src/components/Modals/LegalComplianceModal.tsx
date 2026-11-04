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
      `Olay Kaydı Oluşturuldu (${record.incidentId}). 72 Saatlik KVKK/GDPR Bildirim Son Tarihi: ${new Date(
        record.notificationDeadline72hIso
      ).toLocaleString('tr-TR')}`
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
              <span>KVKK · Gizlilik · Mesafeli Satış · 72s İhlal Prosedürü</span>
            </div>
            <h2 id="legal-modal-title" className="text-lg md:text-xl font-bold text-slate-100 tracking-tight">
              Hukuki Metinler, Gizlilik Politikası ve Veri Güvenliği Merkezi
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 pt-3 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto bg-dark-950/60">
          {[
            { id: 'kvkk' as LegalTab, label: 'KVKK Aydınlatma & Açık Rıza', icon: ShieldCheck },
            { id: 'privacy' as LegalTab, label: 'Gizlilik Politikası (Privacy)', icon: FileText },
            { id: 'distance-sales' as LegalTab, label: 'Ön Bilgilendirme & Mesafeli Satış', icon: Scale },
            { id: 'breach-72h' as LegalTab, label: '72 Saat Veri İhlali & Başvuru', icon: AlertTriangle },
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
                  1. 6698 Sayılı KVKK Kapsamında Aydınlatma Metni
                </h3>
                <p>
                  <strong>Veri Sorumlusu:</strong> GraphFlow Mimari Simülasyon Stüdyosu — Berke Akdemir
                  (<code className="text-cyan-300">berkeakdemir5855@gmail.com</code>, İstanbul / Türkiye).
                </p>
                <p>
                  <strong>İşlenen Kişisel Veriler ve Amaç:</strong> Bulut senkronizasyonu ve hesap oluşturma özelliğini
                  kullandığınızda e-posta adresiniz, kullanıcı kimliğiniz (`UUID`), abonelik kademeniz (`free/pro/team`)
                  ve kaydettiğiniz sistem mimarisi diyagramları; sözleşmenin kurulması ve ifası (KVKK m.5/2-c) ile veri
                  sorumlusunun meşru menfaati (m.5/2-f) hukuki sebeplerine dayanarak işlenmektedir.
                </p>
                <p>
                  <strong>Yerel Çalışma Garantisi:</strong> Hesap açmadan stüdyoyu kullandığınızda çizimleriniz yalnızca
                  tarayıcınızın yerel belleğinde (`localStorage`) tutulur ve sunucularımıza gönderilmez.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  2. Aydınlatmadan Bağımsız Açık Rıza Beyanı (Yurt Dışı Aktarım & İYS)
                </h3>
                <p>
                  KVKK m.9 kapsamında bulut proje yedekleme (`Supabase Cloud`), küresel ödeme altyapısı (`Lemon Squeezy`)
                  ve isteğe bağlı yapay zeka sentezleme (`Google Gemini API`) servislerinin yurt dışı sunucularında
                  barındırılması nedeniyle, bulut hesap senkronizasyonu <strong>aydınlatma metninden ayrı olarak</strong>{' '}
                  alınan açık rızanıza tabidir.
                </p>
                <p>
                  Ticari elektronik ileti (kampanya/bülten) onayı ise üyelik için zorunlu değildir; varsayılan olarak
                  kapalıdır ve tamamen isteğe bağlı ayrı bir onay kutusuyla yönetilir.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Privacy Policy & Self-Hosted Zero-Leak Architecture
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
                  1. Ön Bilgilendirme Formu (Pre-Information Form)
                </h3>
                <p>
                  <strong>Satıcı / Sağlayıcı:</strong> GraphFlow (Berke Akdemir — İletişim:{' '}
                  <code className="text-cyan-300">berkeakdemir5855@gmail.com</code>, İstanbul, Türkiye) | Merchant of
                  Record: <strong>Lemon Squeezy, LLC</strong>.
                </p>
                <p>
                  <strong>Hizmetin Temel Nitelikleri ve Fiyatı:</strong> GraphFlow Pro Dijital SaaS Aboneliği (Sınırsız
                  bulut mimari projesi, AWS Terraform & Kubernetes HPA kod üretimi, AI mimari sentezleyici ve Canlı
                  ERP/API telemetri akışı). Fiyat: Aylık planda <strong>$12/ay</strong>, Yıllık planda{' '}
                  <strong>$99/yıl</strong> ($9/ay eşdeğeri) + yerel vergi oranları.
                </p>
                <p>
                  <strong>Teslimat ve İfa:</strong> Ödeme onaylandığı anda (`webhook` doğrulaması ile) dijital abonelik
                  hakları elektronik ortamda derhal aktifleşir.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  2. Mesafeli Satış Sözleşmesi & İptal/İade Koşulları
                </h3>
                <p>
                  Kullanıcı, dilediği zaman tek tıkla <strong>&ldquo;Manage Invoices &amp; Billing&rdquo;</strong> portalı
                  üzerinden veya <code className="text-cyan-300">berkeakdemir5855@gmail.com</code> adresine e-posta
                  göndererek aboneliğini bir sonraki dönem için kesintisiz iptal edebilir.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'breach-72h' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-dark-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-slate-100">
                  KVKK m.12 / GDPR m.33 — 72 Saat İçinde Veri İhlali Bildirim ve Müdahale Prosedürü
                </h3>
                <p>
                  Olası bir yetkisiz erişim, webhook imza ihlali (`401`) veya veri sızıntısı tespit edildiğinde sistem
                  otomatik olarak <code className="text-cyan-300">KVKK_72H_SECURITY_INCIDENT_MONITOR</code> kaydı
                  oluşturur, <code className="text-cyan-300">detectedAt + 72 saat</code> yasal bildirim son tarihini
                  hesaplar ve Veri Sorumlusu İrtibat Kişisine (<code className="text-cyan-300">berkeakdemir5855@gmail.com</code>)
                  acil eskalasyon uyarısı üretir.
                </p>

                <form onSubmit={handleReportIncident} className="pt-2 space-y-2.5">
                  <label className="block text-[11px] font-semibold text-slate-300">
                    Güvenlik Zaafiyeti / Veri İhlali veya KVKK m.11 Veri Sahibi Başvurusu Kaydet:
                  </label>
                  <textarea
                    rows={2}
                    value={breachSummary}
                    onChange={e => setBreachSummary(e.target.value)}
                    placeholder="Şüpheli erişim, güvenlik bildirimi veya veri silme/erişim talebinizi yazın..."
                    className="w-full rounded-xl bg-dark-900 border border-slate-800 p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="submit"
                      className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                    >
                      72s Olay Kaydı Oluştur & Bildir
                    </button>
                    <a
                      href="mailto:berkeakdemir5855@gmail.com?subject=ACIL%20KVKK%2072s%20Veri%20Güvenliği%20/%20Veri%20Sahibi%20Başvurusu"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Veri Sorumlusuna Doğrudan E-Posta</span>
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
                    <div className="text-[11px] font-mono text-slate-400 mb-1">Son Güvenlik / 72s İhlal Kayıtları:</div>
                    <div className="space-y-1 font-mono text-[11px]">
                      {recentIncidents.slice(-3).map(inc => (
                        <div key={inc.incidentId} className="p-2 rounded bg-dark-900 border border-slate-800 text-slate-300">
                          [{inc.incidentId}] {inc.category} | Son Bildirim: {inc.notificationDeadline72hIso}
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
          <span>Veri Sorumlusu İrtibat: berkeakdemir5855@gmail.com</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};
