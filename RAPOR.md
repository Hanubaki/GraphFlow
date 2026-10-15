# GraphFlow — Proje Durum, Gelir Yolu ve Denetim Raporu (RAPOR.md)

**Son Güncelleme:** 15 Ekim 2026
**Canlı Üretim Adresi:** https://graph-flow-virid.vercel.app
**Git Durumu:** `main` (`7e290e5` + Faz-3 UX & SRE Geliştirmeleri)
**Test ve Derleme Durumu:** 19/19 Test Dosyası, 114/114 Birim Testi Başarılı, 0 TypeScript Hatası
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
   - Aktif Bağlı Uygulamalar: **Lemon Squeezy** (`Berke Akdemir` — Live Mode), **Gmail** (`berkeakdemir5855@gmail.com`), **GitHub** (`Hanubaki`), **Vercel & Vercel MCP** (`berkeakdemir5855-9289`), **Twitter / X** (`@Hanubaki01`), **YouTube** (`youtube_sunny-unteem`), **Instagram** (`@dijitalvitrin.app`), **Inspo MCP** (`inspo_mcp`), **DataForSEO** ve **Ahrefs** (Instant Account — kredi yüklemesi bekliyor).

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
   - Simülatöre ilk kez giren kullanıcılar için (`localStorage: graphflow_tour_completed_v1`) gerçek arayüz elemanlarını SVG maske ve `#22d3ee` CAD nişangah çerçevesiyle aydınlatan 6 adımlı interaktif rehber eklendi.

9. **FinOps Bulut Maliyet Hesaplayıcı, `p95 / p99` Kuyruk Gecikmesi, Tek Tıkla Otomatik Onarım (Auto-Harden & DAG Auto-Layout), Kubernetes (K8s) Çıktısı ve Pro Paywall Koruması (`src/utils/simulationPhysics.ts`, `src/utils/export.ts`, `src/components/Modals/ExportModal.tsx`, `src/components/Modals/AiGeneratorModal.tsx`, `src/components/Inspector/InspectorPanel.tsx`):**
   - **Pro IaC Kod Sızıntısı Kapatıldı (Paywall Blur Gate):** Ücretsiz kullanıcıların `ExportModal` içindeki Terraform (`main.tf`) kodunu fareyle seçip kopyalayabilmesi (`select-text`) engellendi; ilk 12 satır önizleme olarak gösterilip geri kalan kod bulanıklaştırılarak (`blur-[4px] select-none`) doğrudan **"Unlock Pro IaC Export"** satın alma butonuna bağlandı.
   - **Kubernetes (`k8s-manifests.yaml` + HPA) Pro Sekmesi Eklendi (`generateKubernetesManifests`):** Düğümlerin `throughputRps` kapasitesine göre otomatik ölçeklenen `Deployment`, `Service` ve `HorizontalPodAutoscaler (HPA)` YAML üretici Pro özelliğine eklendi.
   - **Tek Tıkla "Auto-Harden Risks & Breakers" ve "Auto-Align Architecture DAG":** Sağ paneldeki SPOF uyarılarını tek tıkla onaran `Auto-Harden` butonu ile dağınık kanvası mimari katmanlara göre hizalayan `Auto-Align DAG` butonu eklendi.

10. **Teknik SEO Yapılandırması ve 2. Faz Stratejik Ürün & Büyüme Özellikleri (`index.html`, `public/robots.txt`, `public/sitemap.xml`, `src/utils/importTopology.ts`, `src/utils/export.ts`, `src/components/Modals/ExportModal.tsx`, `src/constants/templates.ts`, `src/components/Landing/LandingPage.tsx`):**
    - **SEO, `robots.txt`, `sitemap.xml` ve Zengin `JSON-LD` (`SoftwareApplication` + `FAQPage`):** Yüksek dönüşümlü DevOps/SRE anahtar kelimeleri `index.html` başlıklarına ve yapılandırılmış `@graph` şemasına işlendi; `public/robots.txt` ve `public/sitemap.xml` oluşturuldu.
    - **Reverse-Engineering Altyapı İçe Aktarıcı (`parseInfrastructureToTopology`):** Kullanıcıların mevcut `docker-compose.yml` veya `main.tf` (Terraform HCL) dosyalarını yapıştırarak ya da yükleyerek saniyeler içinde 4 katmanlı otomatik hizalanmış canlı GraphFlow topolojisine dönüştürmesi sağlandı.
    - **Yüksek Çözünürlüklü Vektörel `SVG` ve `2x Retina PNG` Diyagram Çıktısı (`generateArchitectureSvg`, `exportSvgDiagram`, `exportPngDiagram`):** Üst kısmında canlı SLA, `p99` kuyruk gecikmesi ve aylık AWS bulut maliyeti HUD barı bulunan CAD blueprint diyagram çıktısı eklendi (Ücretsiz planda `"Simulated with GraphFlow.dev"` viral filigranı, Pro planda filigransız white-label çıktı).
    - **Public Architecture Blueprints Galerisi (`#blueprints`):** Landing Page üzerine **Stripe Idempotent Webhook & Ledger Engine** ve **Netflix Chaos-Resilient Global Edge Stream** dahil 6 gerçek dünya mimarisini canlı SLA/p99/AWS maliyetiyle sergileyen ve tek tıkla (**"Simulate & fork blueprint"**) doğrudan simülatöre çatallayan galeri bölümü eklendi.

11. **Kullanıcı Tarafı (UX) ve SRE Mühendislik İyileştirmeleri (`src/components/Toolbar/TopBar.tsx`, `src/components/Canvas/NodeComponent.tsx`, `src/components/Inspector/InspectorPanel.tsx`, `src/context/SimulationContext.tsx`, `src/utils/simulationPhysics.ts`):**
    - **Canlı Global Trafik Yükü Sürgüsü (`Load 0.5x – 10x` Stress Slider):** Üst kontrol çubuğuna (`TopBar`) eklenen `Load` sürgüsü ile kullanıcılar giriş trafiğini `0.5x`'ten `10x`'e kadar kademeli artırıp hangi RPS eşiğinde kuyrukların şiştiğini ve gecikmenin kuadratik olarak yükseldiğini canlı test edebiliyor.
    - **Düğüm Üzerinde Yüzen Hızlı Kaos ve Ölçekleme Çubuğu (Floating Quick-Action Context Bar):** Kanvas üzerinde seçilen herhangi bir düğümün hemen üstünde beliren hızlı aksiyon çubuğu ile sağ panele gitmeden tek tıkla `Kill / Heal` (Kaos Çökertme), `+100ms` gecikme enjeksiyonu, `CB` (Circuit Breaker Aç/Kapat), `2x RPS` kapasite ölçekleme, `Duplicate` ve `Delete` işlemleri yapılabiliyor.
    - **Çoklu Bulut (`AWS | GCP | Azure`) FinOps Maliyet Karşılaştırması:** Sağ paneldeki `Engineering Diagnostics` kartına eklenen `AWS / GCP / Azure` seçici ile aynı mimarinin üç büyük bulut sağlayıcısındaki eşdeğer servis yığını (`ECS Fargate + RDS` vs `Cloud Run + Cloud SQL` vs `Container Apps + Azure DB`) ve aylık tahmini maliyeti (`~$XXX/mo`) anlık karşılaştırılabiliyor.
    - **Canlı SRE Olay Günlüğü ve Tek Tıkla Post-Mortem Raporu (`generateIncidentPostMortemMarkdown`):** Simülasyon sırasında tetiklenen `Spike`, `Circuit Breaker OPEN/CLOSED` ve `Node Down/Degraded` olayları saat damgasıyla (`HH:MM:SS`) sağ paneldeki **SRE Post-Mortem Log** kutusuna kaydediliyor ve **"Copy Report"** butonuyla tam teşekküllü Markdown olay sonrası raporu panoya kopyalanabiliyor.

---

## 2. Gelir Yolu ve Canlı Trafik Analitiği (`vercel_mcp` & `lemonsqueezy`)

- **Onay Durumu:** 15 Ekim 2026 sabahı saat 06:08 ve 06:09'da Lemon Squeezy'den (`hello@lemonsqueezy.com` - Tanay Khemka) iki e-posta geldi: **"Your store has been activated!"** ve **"Your account has now been APPROVED."**
- **Canlı Ödeme Linki (Live Mode) Bağlandı:**
  - Canlı mağazadan (`https://graphflow.lemonsqueezy.com`) yeni Live Mode ödeme bağlantısı (`https://graphflow.lemonsqueezy.com/checkout/buy/171c3132-5464-46eb-a519-b95c1e4bca8a?embed=1`) otomatik çekildi ve `src/components/Modals/PricingModal.tsx`, `src/components/Landing/LandingPage.tsx`, `src/services/billing.ts` dosyalarına işlendi.
- **Canlı Webhook ve Vercel Şifre Senkronizasyonu (Composio ile %100 Otomatik Yapıldı):**
  - Lemon Squeezy Canlı Webhook'u (`ID: 142796`) Composio API üzerinden otomatik olarak `https://graph-flow-virid.vercel.app/api/webhook` adresine bağlandı.
- **Canlı Vercel Web Analytics Özeti (`VERCEL_MCP_GET_WEB_ANALYTICS`):**
  - Son 7 günde **16 tekil ziyaretçi** ve **43 sayfa görüntülemesi** kaydedildi (ABD `US`, Hindistan `IN`, Fas `MA` (`t.co` X/Twitter yönlendirmesi) ve Türkiye `TR`).
