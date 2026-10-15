# GraphFlow — Proje Durum, Gelir Yolu ve Denetim Raporu (RAPOR.md)

**Son Güncelleme:** 15 Ekim 2026
**Canlı Üretim Adresi:** https://graph-flow-virid.vercel.app
**Git Durumu:** `main` (`dc9d044` - Lemon Squeezy CSP ve gömülü ödeme penceresi düzeltmesi dahil)
**Test ve Derleme Durumu:** 18/18 Test Dosyası, 111/111 Birim Testi Başarılı, 0 TypeScript Hatası
**Lemon Squeezy Mağaza Durumu:** ONAYLANDI VE AKTİF (`APPROVED` - 15 Ekim 2026, 06:09 TSİ)

---

## 1. Tamamlanan Çekirdek Motor ve Ürün Geliştirmeleri

1. **Nedensel Simülasyon Fiziği ve Otomatik Sigorta (Circuit Breaker) Motoru (`src/utils/simulationPhysics.ts`, `src/context/SimulationContext.tsx`):**
   - Paketler yalnızca giriş (`client` / kök) düğümlerinden doğar ve ulaştığı düğümden alt düğümlere zincirleme (`hop-by-hop`) ilerler.
   - Kapasite (`throughputRps`) aşımında kuyruk geri basıncı ile gecikme otomatik yükselir.
   - 5 ardışık hatada devre kesici otomatik `OPEN` durumuna geçer, 6 saniye soğuma sonunda `HALF-OPEN` ve başarılı pakette `CLOSED` durumuna döner.

2. **60 FPS Render ve Performans Optimizasyonu (`src/components/Canvas/GraphCanvas.tsx`, `src/components/Canvas/ConnectionLine.tsx`):**
   - Sürükleme sırasında simülasyon zamanlayıcılarının sıfırlanması (`nodesRef` / `edgesRef` izolasyonu ile) engellendi.
   - $O(1)$ `nodeMap` ve $O(P)$ `packetsByEdge` gruplaması ile boşta duran bağlantıların 60 FPS döngüsünde yeniden çizilmesi (`React.memo`) tamamen durduruldu.
   - Web Audio ses düğümlerine otomatik bellek temizliği (`onended -> disconnect`) ve imleç yayınına 30 Hz hız sınırı eklendi.

3. **Çizim Ergonomisi ve Ticari Pro Kilitler (`src/hooks/useGraphStore.ts`, `src/components/Modals/ExportModal.tsx`, `src/components/Modals/ProjectsModal.tsx`):**
   - `10px` ızgara hizalaması (`Snap-to-Grid`) ve `Ctrl+D` düğüm kopyalama kısayolu eklendi.
   - Ücretsiz planda Terraform (IaC) dışa aktarma ve 3 üzeri bulut proje kaydetme işlemleri kilitlenerek doğrudan Lemon Squeezy satın alma ekranına (`PricingModal`) bağlandı.

4. **Lemon Squeezy Gömülü Ödeme Penceresi (CSP) Düzeltmesi (`vercel.json`, `src/components/Modals/PricingModal.tsx`):**
   - `https://graphflow.lemonsqueezy.com` alt alan adının site içi pencerede (iframe) engellenmeden açılması için `vercel.json` güvenlik başlıklarına `https://*.lemonsqueezy.com` izni eklendi ve `PricingModal` açılışında `createLemonSqueezy()` tetiklemesi sağlandı.

5. **Composio MCP Kurulumu ve Entegrasyonu (`.agent/mcp_config.json`, `mcp_config.json`, `.gitignore`):**
   - Composio MCP sunucusu (`https://connect.composio.dev/mcp`) hem bu çalışma alanına hem de global yapılandırmaya kuruldu.
   - API anahtarının GitHub'a sızmaması için `mcp_config.json`, `.mcp.json` ve `.agent/mcp_config.json` dosyaları `.gitignore` korumasına alındı.
   - Aktif Bağlı Uygulamalar: **Lemon Squeezy** (`Berke Akdemir` — Live Mode), **Gmail** (`berkeakdemir5855@gmail.com`), **GitHub** (`Hanubaki`), **Vercel** (`berkeakdemir5855-9289`), **Twitter / X** (`@Hanubaki01`), **YouTube** (`youtube_sunny-unteem`), **Instagram** (`@dijitalvitrin.app`), **Inspo MCP** (`inspo_mcp`), **DataForSEO** ve **Ahrefs** (Instant Account — kredi yüklemesi bekliyor).

6. **Landing Page "Control Room" Arka Plan Mimari Katmanı (`src/components/Landing/LandingPage.tsx`):**
   - Composio'nun **`inspo_mcp`** tasarım arşivi (`INSPO_MCP_SEARCH_SCREENS`, `INSPO_MCP_RECOMMEND`) ve geliştirici SaaS referansları (`unkey.com`, `novu.co`, `localcan.com`, Linear, Railway, Vercel) incelenerek düz siyah boşluk hissi giderildi.
   - `DESIGN.md` kurallarına (%100 sıfır bulanık renk küresi / glow orb) sadık kalınarak **`ControlRoomBackdrop`** bileşeni eklendi:
     - **Çift Ölçekli Mimari Blueprint Izgarası:** `24px` ince hücreler ve `120px` ana kadran çizgileri (`radial-gradient` eliptik maske ile `#08090a` zemine yumuşak geçişli).
     - **Tam Boy Yapısal Kılavuz Rayları ve `+` Kesişim Nişangahları (`SectionCrosshairs`):** Geniş ekranlarda sağ/sol boşlukları çerçeveleyen dikey kılavuz çizgileri ve her bölüm (`section`) sınırında `+` koordinat işaretçileri.
     - **Canlı Topoloji Devre İzi (Ambient Schematic Traces):** Hero arka planında `#22d3ee` ve `#e1e3e6` veri paketlerinin aktığı SVG devre yolları ve telemetri koordinat etiketleri (`GRID // 24PX_CADENCE`, `ORIGIN // 00.00.08090A`).

7. **Mühendislik Seviyesi Topoloji Tanılama (Diagnostics), Ağ Paket Kaybı ve Gerçekçi IaC Motoru (`src/utils/simulationPhysics.ts`, `src/components/Inspector/InspectorPanel.tsx`, `src/utils/export.ts`):**
   - **Kritik Yol (Critical Path), Darboğaz (Bottleneck), SPOF ve SLA Motoru (`analyzeTopologyDiagnostics`):** DFS/DAG analizi ile uçtan uca en uzun gecikme zinciri (`Critical Path Latency`), fan-in oranına göre sistemin ilk tıkanacağı darboğaz düğüm (`Primary Bottleneck RPS Cap`), bileşik uçtan uca erişilebilirlik (`Composite SLA %`) ve tekil hata noktası (`SPOF / Unprotected 3rd-Party Dependency`) uyarıları canlı olarak sağ panele (`InspectorPanel`) ve dışa aktarılan Markdown ADR raporuna eklendi.
   - **Ağ Hattı Paket Kaybı (`Packet Loss Rate %`) Kontrolü:** İki sağlıklı servis arasındaki ağ bağlantısında (`GraphEdge`) paket düşürme / kararsız hat simülasyonu yapılabilmesi için `Connection Inspector` paneline `0% - 50%` paket kaybı sürgüsü eklendi.
   - **Bileşen Tipine Duyarlı AWS Terraform ve Docker Compose Üretimi:** `queue` (`aws_sqs_queue`), `storage` (`aws_s3_bucket` / `minio/minio`), `serverless` (`aws_lambda_function`) ve `throughputRps` kapasitesine göre otomatik ölçeklenen `desired_count` Fargate replika hesabı eklendi.

8. **İnteraktif "Spotlight" Stüdyo Rehberi / Onboarding Tour (`src/components/Onboarding/OnboardingTour.tsx`, `src/i18n/I18nContext.tsx`, `src/App.tsx`, `src/components/Toolbar/TopBar.tsx`):**
   - Tarayıcı dili Türkçe olsa dahi küresel SaaS hedef kitlesi için hem stüdyo (`I18nContext.tsx`) hem de interaktif rehber (`OnboardingTour.tsx`) varsayılan olarak **%100 İngilizce (`EN`)** açılacak şekilde ayarlandı (rehber kartının sağ üst köşesine isteğe bağlı `EN` / `TR` dil geçiş tuşu eklendi).
   - Simülatöre ilk kez giren kullanıcılar için (`localStorage: graphflow_tour_completed_v1`) gerçek arayüz elemanlarını SVG maske ve `#22d3ee` CAD nişangah çerçevesiyle aydınlatan 6 adımlı interaktif rehber eklendi:
     1. **Component Palette (`[data-tour="palette"]`):** Bileşen ekleme ve porttan porta boru hattı çekme.
     2. **Architecture Presets (`[data-tour="presets"]`):** Hazır üretim mimarilerini (E-Ticaret, Fintech, AI RAG, Streaming) tek tıkla yükleme.
     3. **AI Prompt-to-Architecture (`[data-tour="aigen"]`):** Doğal dille sistem topolojisi üretme.
     4. **Live Traffic & Spike Engine (`[data-tour="sim-controls"]`):** Hız çarpanları (`0.5x`, `1x`, `2x`) ve 3x Spike yük testi ile Circuit Breaker / Backpressure gözlemi.
     5. **Service Inspector & Engineering Diagnostics (`[data-tour="inspector"]`):** Gecikme, hata oranı, paket kaybı, kaos durumu (`Healthy / Degraded / Down`) ve Kritik Yol / Darboğaz / SLA analizi.
     6. **Export & IaC Hub (`[data-tour="export"]`):** AWS Terraform (`main.tf`), `docker-compose.yml`, Markdown ADR (`.md`) ve JSON çıktısı.
   - Üst araç çubuğuna (`TopBar`) rehberi istenildiği an tekrar başlatan **`?` (Rehber / Tour)** butonu ve klavye kısayolları (`←`, `→`, `Enter`, `Esc`) eklendi.

9. **FinOps Bulut Maliyet Hesaplayıcı, `p95 / p99` Kuyruk Gecikmesi, Tek Tıkla Otomatik Onarım (Auto-Harden & DAG Auto-Layout), Kubernetes (K8s) Çıktısı ve Pro Paywall Koruması (`src/utils/simulationPhysics.ts`, `src/utils/export.ts`, `src/components/Modals/ExportModal.tsx`, `src/components/Modals/AiGeneratorModal.tsx`, `src/components/Inspector/InspectorPanel.tsx`):**
   - **Pro IaC Kod Sızıntısı Kapatıldı (Paywall Blur Gate):** Ücretsiz kullanıcıların `ExportModal` içindeki Terraform (`main.tf`) kodunu fareyle seçip kopyalayabilmesi (`select-text`) engellendi; ilk 12 satır önizleme olarak gösterilip geri kalan kod bulanıklaştırılarak (`blur-[4px] select-none`) doğrudan **"Unlock Pro IaC Export"** satın alma butonuna bağlandı.
   - **Kubernetes (`k8s-manifests.yaml` + HPA) Pro Sekmesi Eklendi (`generateKubernetesManifests`):** Düğümlerin `throughputRps` kapasitesine göre otomatik ölçeklenen `Deployment`, `Service` ve `HorizontalPodAutoscaler (HPA)` YAML üretici Pro özelliğine eklendi.
   - **FinOps Aylık AWS Bulut Maliyet Tahmini (`~$XXX/mo`) ve `p95 / p99` Gecikme Dağılımı:** Sağ paneldeki `Engineering Diagnostics` kartına ve Markdown ADR çıktısına gerçek zamanlı `p95` / `p99` gecikme metrikleri ile bileşen tipine ve RPS kapasitesine duyarlı aylık AWS bulut altyapı maliyet tahmini eklendi.
   - **Tek Tıkla "Auto-Harden Risks & Breakers" ve "Auto-Align Architecture DAG":** Sağ paneldeki SPOF uyarılarını tek tıkla onaran (Circuit Breaker ekleyen, darboğaz RPS kapasitelerini yükselten ve çökük düğümleri ayağa kaldıran) `Auto-Harden` butonu ile dağınık kanvası mimari katmanlara göre hizalayan `Auto-Align DAG` butonu eklendi.
   - **Günlük AI Mimari Üretim Kotası (`AiGeneratorModal.tsx`):** Ücretsiz planda günlük kullanım sayacı (`FREE TODAY`) görünür hale getirildi ve limit dolduğunda doğrudan Pro yükseltme ekranına (`PricingModal`) yönlendirme sağlandı.

10. **Teknik SEO Yapılandırması ve 2. Faz Stratejik Ürün & Büyüme Özellikleri (`index.html`, `public/robots.txt`, `public/sitemap.xml`, `src/utils/importTopology.ts`, `src/utils/export.ts`, `src/components/Modals/ExportModal.tsx`, `src/constants/templates.ts`, `src/components/Landing/LandingPage.tsx`):**
    - **SEO, `robots.txt`, `sitemap.xml` ve Zengin `JSON-LD` (`SoftwareApplication` + `FAQPage`):** Yüksek dönüşümlü DevOps/SRE anahtar kelimeleri (`system design simulator`, `cloud architecture diagram tool`, `docker compose visualizer`, `diagram to terraform generator`, `kubernetes manifest generator`) `index.html` başlıklarına ve yapılandırılmış `@graph` şemasına işlendi; `public/robots.txt` ve `public/sitemap.xml` oluşturuldu.
    - **Reverse-Engineering Altyapı İçe Aktarıcı (`parseInfrastructureToTopology`):** Kullanıcıların mevcut `docker-compose.yml` veya `main.tf` (Terraform HCL) dosyalarını yapıştırarak ya da yükleyerek (veya tek tıkla örnek `docker-compose.yml` deneyerek) saniyeler içinde 4 katmanlı otomatik hizalanmış canlı GraphFlow topolojisine dönüştürmesi sağlandı.
    - **Yüksek Çözünürlüklü Vektörel `SVG` ve `2x Retina PNG` Diyagram Çıktısı (`generateArchitectureSvg`, `exportSvgDiagram`, `exportPngDiagram`):** Üst kısmında canlı SLA, `p99` kuyruk gecikmesi ve aylık AWS bulut maliyeti HUD barı bulunan CAD blueprint diyagram çıktısı eklendi (Ücretsiz planda `"Simulated with GraphFlow.dev"` viral filigranı, Pro planda filigransız white-label çıktı).
    - **Public Architecture Blueprints Galerisi (`#blueprints`):** Landing Page üzerine **Stripe Idempotent Webhook & Ledger Engine** ve **Netflix Chaos-Resilient Global Edge Stream** dahil 6 gerçek dünya mimarisini canlı SLA/p99/AWS maliyetiyle sergileyen ve tek tıkla (**"Simulate & fork blueprint"**) doğrudan simülatöre çatallayan galeri bölümü eklendi.

---

## 2. Gelir Yolu (Lemon Squeezy Mağaza Onayı ve %100 Canlı Satış Otomasyonu Tamamlandı)

- **Onay Durumu:** 15 Ekim 2026 sabahı saat 06:08 ve 06:09'da Lemon Squeezy'den (`hello@lemonsqueezy.com` - Tanay Khemka) iki e-posta geldi: **"Your store has been activated!"** ve **"Your account has now been APPROVED."**
- **Canlı Ödeme Linki (Live Mode) Bağlandı:**
  - Canlı mağazadan (`https://graphflow.lemonsqueezy.com`) yeni Live Mode ödeme bağlantısı (`https://graphflow.lemonsqueezy.com/checkout/buy/171c3132-5464-46eb-a519-b95c1e4bca8a?embed=1`) otomatik çekildi ve `src/components/Modals/PricingModal.tsx`, `src/components/Landing/LandingPage.tsx`, `src/services/billing.ts` dosyalarına işlendi.
- **Canlı Webhook ve Vercel Şifre Senkronizasyonu (Composio ile %100 Otomatik Yapıldı):**
  - Lemon Squeezy Canlı Webhook'u (`ID: 142796`) Composio API üzerinden otomatik olarak `https://graph-flow-virid.vercel.app/api/webhook` adresine ve `["order_created", "subscription_created", "subscription_updated", "subscription_cancelled", "subscription_expired", "subscription_payment_success"]` olaylarına bağlandı.
  - Aynı kriptografik imza anahtarı (`LEMONSQUEEZY_WEBHOOK_SECRET`) Vercel üretim ortamına (`prj_vl7ak7U9tSDjHipCvwpUVf7M8RTC`) otomatik yazıldı ve yeni canlı dağıtım (`dpl_Bi5jgBwsTJJdQcT5w8p7UTgWygkc`) tetiklendi.
