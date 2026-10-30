# GraphFlow — Mühendisler İçin Sıfır Bütçeli Viral Büyüme & Dağıtım Rehberi (Playbook)

> **Altın Kural:** Yazılım mühendisleri (Backend, SRE, DevOps, System Architect) **"reklam"** kokan paylaşımlardan nefret eder ve anında kaydırıp geçer. Mühendisler yalnızca **1) Teknik İnceleme (Teardown), 2) Tartışma Yaratan Mimari Kriz Senaryosu ("Bu mimaride 3.000 RPS'te ilk neresi patlar?"), 3) Doğrudan Tarayıcıda Kurcalayabilecekleri Canlı Link** gördüklerinde tıklar, paylaşır ve satın alır.

Artık projeye **Doğrudan Derin Link (`?template=...`)** özelliği eklendi. Aşağıdaki linklere tıklayan mühendisler Landing Page ile vakit kaybetmeden **doğrudan çalışan 60 FPS simülasyonun içine** düşer:

- **Stripe Ödeme & İdempotent Muhasebe Mimarisi:** `https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger`
- **Netflix Kaos Dayanıklı Edge Streaming Mimarisi:** `https://graph-flow-virid.vercel.app/?template=netflix-chaos-streaming`
- **CQRS + Transactional Outbox + Kafka DLQ Mimarisi:** `https://graph-flow-virid.vercel.app/?template=resilient-cqrs-outbox`
- **E-Ticaret Dağıtık Mikroservis Mimarisi:** `https://graph-flow-virid.vercel.app/?template=ecommerce-distributed`
- **AI RAG & Vektör Arama Pipeline Mimarisi:** `https://graph-flow-virid.vercel.app/?template=ai-rag-pipeline`

---

## 1. En Yüksek Dönüşümlü 5 Mühendis Kanalı (Öncelik Sırasıyla)

| Kanal | Hedef Kitle | Beklenen Trafik | Satışa Dönüşüm | Nasıl Paylaşılmalı? |
| :--- | :--- | :--- | :--- | :--- |
| **1. Hacker News (`Show HN`)** | Staff/Principal Eng, CTO, Kurucular | 1.500 – 15.000 tekil ziyaretçi (tek günde) | **Çok Yüksek** | Saf mühendislik dili, De Casteljau bezier matematiği, M/M/1 kuyruk fiziği ve sıfır kayıt şartı vurgulanmalı. |
| **2. Reddit (`r/softwarearchitecture`, `r/sre`, `r/devops`, `r/backend`)** | Kıdemli Backend & SRE Mühendisleri | 800 – 5.000 ziyaretçi / post | **Yüksek** | *"X ürünümü yaptım"* diye DEĞİL; *"Stripe'ın webhook mimarisini 3x yük altında simüle ettim, ilk darboğaz neresi?"* diye paylaşılmalı. |
| **3. GitHub `Awesome` Listelerine PR Açmak** | Sürekli Araç Arayan Mimarlar | Kalıcı pasif trafik (Aylık 500–2.000) | **Yüksek** | `awesome-system-design`, `awesome-sre`, `awesome-software-architecture` depolarına 3 dakikalık Pull Request açmak. |
| **4. X (Twitter) & LinkedIn "Bunu Kır (Break This)" Meydan Okuması** | Tech Lead & Yazılım Topluluğu | Organik RT ve yer imi (Bookmark) | **Orta-Yüksek** | 15 saniyelik ekran kaydı GIF/video: Trafik sürgüsünü `1x` -> `5x` çekip düğümlerin kızardığı ve `Auto-Harden` ile saniyesinde iyileştiği an. |
| **5. Sistem Tasarımı Bültenleri & Discord/Slack** | ByteByteGo, Pragmatic Engineer, Gourav Sen takipçileri | Hedefli niş trafik | **Çok Yüksek** | Yazarlara DM/E-posta ile *"Okuyucularınızın statik diyagram yerine canlı stres testi yapabileceği ücretsiz interaktif link"* olarak sunmak. |

---

## 2. Kopyala-Yapıştır Hazır Paylaşım Metinleri

### A) Hacker News — `Show HN` Gönderisi (Salı, Çarşamba veya Perşembe 16:30–18:00 TSİ'de atılmalı)
- **Gönderim Adresi:** https://news.ycombinator.com/submit
- **Title:**
  `Show HN: GraphFlow – Interactive distributed systems simulator with queuing physics`
- **URL:**
  `https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger`
- **İlk Yorum (Paylaştıktan hemen sonra kendi gönderinin altına yazacağın teknik açıklama):**
```text
Hi HN,

Static architecture diagrams (draw.io, Excalidraw, Lucidchart) are great for documentation, but they treat a 2,400 RPS Redis cluster and a 400 RPS PostgreSQL primary as identical inert boxes. During design reviews, it's hard to visually prove where backpressure builds up, when p99 tail latency spikes non-linearly, or what happens when a downstream dependency starts dropping packets.

I built GraphFlow to make system design diagrams executable directly in the browser (no signup required to test):

1. Causal Hop-by-Hop Queuing Physics: Packets spawn at ingress nodes and traverse cubic Bezier edges (evaluated via native De Casteljau polynomials at 60 FPS without heavy canvas libraries). When arrival rate approaches a node's throughput capacity, utilization rises and effective p95/p99 latency compounds non-linearly.
2. Automatic Circuit Breakers & Chaos Injection: Consecutive 5xx failures trip upstream circuit breakers into OPEN -> HALF-OPEN -> CLOSED states. You can drag the global load slider from 0.5x to 10x or inject packet loss on individual network links.
3. Reverse-Engineering & IaC Export: You can paste an existing docker-compose.yml, main.tf, package.json, or OpenAPI 3.0 spec to auto-generate a live topology, compare AWS/GCP/Azure FinOps monthly estimates, or export back to Mermaid.js (for GitHub PRs), Terraform, K8s HPA, and Grafana k6 load scripts.

Direct link to a live Stripe Idempotent Webhook & Ledger simulation (you can drag the "Load" slider in the top bar to 3x or click any node to kill it):
https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger

Or try the Netflix Chaos-Resilient Edge Stream blueprint:
https://graph-flow-virid.vercel.app/?template=netflix-chaos-streaming

Would love your feedback on the queuing/latency math and what component primitives or failure modes you'd want to see next!
```

---

### B) Reddit — `r/softwarearchitecture` & `r/backend` Gönderisi ("Mimari Tartışma" Formatı — Asla Spama Takılmaz)
- **Title:**
  `I modeled an idempotent Stripe Webhook & Double-Entry Ledger topology with live queuing physics — watch what happens to p99 latency at 3x burst load`
- **Body (Markdown):**
```markdown
Whenever our team reviews RFCs or Architecture Decision Records (ADRs), static diagrams always hide the two things that actually cause pages at 3 AM: **fan-in saturation** and **missing circuit breakers on third-party/downstream sinks**.

To test failure modes before writing boilerplate, I built a client-side distributed systems simulator that models causal hop-by-hop packet routing, utilization saturation, p95/p99 tail latency, and automatic circuit breakers (`OPEN` -> `HALF-OPEN` -> `CLOSED`).

Here is a live interactive model of a **Stripe-style Idempotent Webhook & Double-Entry Ledger** (`Merchant SDK -> Envoy Gateway -> Redis SETNX Lock -> Rust Ledger Core -> Serializable Postgres + Kafka Webhook Dispatcher`):

👉 **Live Interactive Simulation (no login required):** https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger

**Try breaking it in 10 seconds:**
1. In the top bar, drag the **Load slider** from `1x` to `3x`. Watch how the `Serializable Postgres` node hits >95% utilization first while `Redis SETNX` barely sweats.
2. Click on the `Immutable Ledger DB` node and hit **`Kill`** (or **`+100ms`**) in the floating action bar to see how fast errors cascade before the circuit breaker isolates the fault.
3. Click **`Pin Baseline`** in the right inspector panel, then click **`Auto-Harden Risks & Breakers`** to see the exact before/after delta in Composite SLA %, p99 latency, and monthly AWS/GCP/Azure cost.

You can also paste your own `docker-compose.yml`, `main.tf`, or `package.json` via the **AI / Import** modal to visualize your current stack's bottleneck.

Curious if the p99 queuing degradation curves match what you see in production—what failure mode should I add next (e.g. connection pool exhaustion, cache stampede, split-brain)?
```

---

### C) Reddit — `r/sre` & `r/devops` Gönderisi (Kaos Mühendisliği & Post-Mortem Odaklı)
- **Title:**
  `Built a browser-based Chaos Engineering & FinOps sandbox that imports docker-compose.yml / main.tf and generates k6 load tests + SRE Post-Mortems`
- **Body (Markdown):**
```markdown
Hey r/sre,

I've been working on **GraphFlow**, an interactive distributed systems and chaos engineering sandbox for stress-testing topologies before deploying them.

Instead of drawing static boxes, every node has throughput capacity (RPS), base latency, error rate, and an optional circuit breaker.

**What you can do right now (free & runs in browser):**
- **Live Netflix Edge Chaos Blueprint:** https://graph-flow-virid.vercel.app/?template=netflix-chaos-streaming
- **1-Click Chaos Audit (`Grade A+ to F`):** Run a 3x traffic spike audit in the right panel to find your Single Points of Failure (SPOFs), unprotected external dependencies, and primary RPS bottleneck.
- **Reverse-Engineer Your Infra:** Open **AI / Import -> Import Infra** and paste your `docker-compose.yml`, `main.tf`, or `OpenAPI` spec to turn it into a 60 FPS topology.
- **Automated Incident Post-Mortem & GitHub PR Mermaid Export:** Inject faults, watch the real-time SRE Incident Log populate, and export a ready-to-paste Markdown Post-Mortem or GitHub PR Mermaid diagram (`flowchart LR` + `sequenceDiagram` + SLA/FinOps table).

Would love brutal feedback from practicing SREs on the Composite SLA calculation and multi-cloud (AWS vs GCP vs Azure) FinOps estimator!
```

---

### D) X (Twitter) İçin "Yüksek Etkileşimli" Meydan Okuma Serisi
X'te sadece *"Yeni proje yaptım, link burada"* demek algoritmada gömülür. Bunun yerine **15 saniyelik ekran videosu/GIF** ile şu **"Meydan Okuma (Challenge)"** formatını atmalısın:

**Tweet 1 (Video/GIF ile):**
```text
Most system design diagrams are a lie.

A 2,400 RPS Redis cluster and a 400 RPS Postgres DB look like the exact same rectangle in draw.io — until traffic hits 3x and your p99 latency explodes.

I modeled Stripe's Idempotent Webhook & Ledger architecture with live 60fps queuing physics.

Try breaking it in your browser (no signup):
https://graph-flow-virid.vercel.app/?template=stripe-webhook-ledger
```

**Tweet 2 (Hemen altına yanıt / Thread):**
```text
What happens when you drag the traffic slider to 3.5x on this topology?

1. Redis SETNX stays at 2ms
2. Postgres Serializable Ledger crosses 95% utilization
3. Tail latency (p99) spikes from 64ms -> 380ms
4. Clicking "Auto-Harden" adds circuit breakers + scales replicas and gives you the exact AWS vs GCP vs Azure monthly cost delta.

You can also paste your own docker-compose.yml or package.json to stress-test your own backend:
https://graph-flow-virid.vercel.app/#studio
```

---

### E) Dev.to — Tam Teşekküllü Teknik Makale (`DEVTO_POST.md` — Frontmatter + GIF + 16 Fazın Tamamı)
- **Gönderim Adresi:** https://dev.to/new (Sağ üstteki ayar ikonundan **"Raw Markdown"** moduna geçip `DEVTO_POST.md` dosyasının tamamını tek seferde yapıştırabilirsin)
- **Tam Metin Dosyası:** [`DEVTO_POST.md`](./DEVTO_POST.md)
- **Öne Çıkan Başlık:**
  `Why Static System Design Diagrams Lie (And How I Built a 60 FPS Distributed Systems Simulator in the Browser)`
- **Etiketler (`tags`):** `architecture`, `devops`, `webdev`, `opensource`
- **Kapak Görseli (`cover_image`):** `https://graph-flow-virid.vercel.app/og-image.png`
- **İçerdiği Güncel Özellikler (Faz 1–16):**
  1. 10 saniyelik sıfır kayıt şartlı **Stripe Webhook & Ledger** (`?template=stripe-webhook-ledger`) ve **Netflix Edge Chaos** (`?template=netflix-chaos-streaming`) canlı kırma testi.
  2. Native De Casteljau kübik Bezier matematiği ($B(t)$) ve sıfır üçüncü parti kanvas kütüphanesi ile 60 FPS simülasyon döngüsü.
  3. **Yeni (Faz 16):** Mobil tarayıcılardaki **2.5-Gigapiksel (`50000x50000`) SVG GPU doku darboğazının** çözümü, `~33 FPS` adaptif mobil kare hızı, `4 Hz` (`240ms`) düğüm yük izolasyonu ve dokunmatik kablo bağlama (`changedTouches`).
  4. `docker-compose.yml`, `main.tf`, `package.json`, `OpenAPI 3.0` ve **Çoklu-Departman ERP CSV** tersine mühendislik içe aktarıcısı + **Canlı ERP/API Dijital İkiz Telemetri** (`Live: ON`) akışı.
  5. `Pin Baseline` + `Executive ROI Proposal`, `3x Chaos Audit (Grade A+ – F)`, çoklu bulut FinOps (`AWS | GCP | Azure`) ve `Mermaid (GitHub PR)` / `Terraform` / `Kubernetes HPA` / `Grafana k6` çıktıları.

---

## 3. GitHub "Awesome" Listelerine 5 Dakikada Kalıcı Backlink & Mühendis Trafiği Ekleme

GitHub'da on binlerce yıldızlı aşağıdaki 4 depoya gidip `README.md` dosyasına tek satırlık PR (Pull Request) açmak **%100 ücretsizdir** ve her gün organik kıdemli mühendis trafiği getirir:

1. **`https://github.com/madd86/awesome-system-design`** ("Tools" veya "Simulators" başlığı altına)
2. **`https://github.com/upgundecha/howtheytest`** veya **`https://github.com/dastergon/awesome-sre`** ("Chaos Engineering / Architecture" altına)
3. **`https://github.com/mehdihadeli/awesome-software-architecture`** ("Tools and Frameworks" altına)
4. **`https://github.com/binhnguyennus/awesome-scalability`**

**Eklenecek Satır (Kopyala-Yapıştır):**
```markdown
- [GraphFlow](https://graph-flow-virid.vercel.app) - Interactive 60 FPS distributed systems simulator with hop-by-hop queuing physics, chaos fault injection, FinOps multi-cloud cost estimation, and Terraform/Kubernetes/Mermaid export.
```

---

## 4. Ürün İçi Viral Döngü (Mühendislerin Kendi Kendine Reklamını Yapması)

Projede halihazırda kurduğumuz **3 viral kanca** sayesinde gelen her mühendis senin yerine paylaşım yapar:
1. **GitHub PR Mermaid Çıktısı (`Export -> Mermaid (GitHub PR)`):** Mühendis kendi şirketindeki Pull Request'e bu diyagramı yapıştırdığında en altında otomatik olarak *"Simulated & verified with GraphFlow"* imzası yer alır; ekipteki diğer 10 mühendis o linke tıklar.
2. **SVG / 2x Retina PNG Filigranı (`Export -> SVG / PNG`):** Ücretsiz planda indirilen her yüksek çözünürlüklü mimari şemanın sağ altında `"Simulated with GraphFlow.dev"` rozeti bulunur (kaldırmak isteyenler Pro paketi satın alır).
3. **Executive ROI Teklifi (`Inspector -> Pin Baseline -> Copy Executive ROI Proposal`):** Kıdemli mühendis CTO'suna veya takım liderine *"Neden Redis/Kafka eklemeliyiz?"* sunumu yaparken GraphFlow'un ürettiği öncesi/sonrası SLA ve maliyet tablosunu Slack/Notion'a yapıştırır.

---

## 5. `draw.io` (`diagrams.net`), `Excalidraw`, `Mermaid.js` ve `Cloudcraft` Kullanıcılarını Doğrudan Yakalama Rehberi

Bu araçların kullanıcıları internette rastgele dağılmış değildir; **6 spesifik yerde** toplanırlar ve artık GraphFlow içinde **Tek Tıkla `.drawio`, `.excalidraw` ve `Mermaid.js` İçe Aktarıcı** (`Export & Import Hub`) bulunduğu için diyagramlarını sıfırdan çizmeden 1 saniyede 60 FPS canlı simülasyona dönüştürebilirler:

| # | Hedef Kitle Nerededir? | Nasıl Bulunur / Arama Sorgusu | Dönüşüm Kancası (Nasıl Yaklaşılır?) |
| :--- | :--- | :--- | :--- |
| **1** | **GitHub Kod & Depo Aramaları (En Sıcak Kitle)** | GitHub arama çubuğuna:<br>• `extension:drawio path:docs` veya `filename:architecture.drawio`<br>• `extension:excalidraw architecture`<br>• `"```mermaid" "flowchart" microservice` | Depo sahibinin Issue/Discussion veya X/GitHub profiline: *"Deponuzdaki `architecture.drawio` dosyasını gördüm; aynı `.drawio` dosyasını sıfır değişiklikle GraphFlow'a sürükleyip 3x trafik altında ilk hangi servisin darboğaza girdiğini canlı test edebilirsiniz"* |
| **2** | **`jgraph/drawio` & `excalidraw/excalidraw` GitHub Discussions** | • `github.com/jgraph/drawio/discussions`<br>• `github.com/excalidraw/excalidraw/discussions`<br>• *"simulation"*, *"dynamic"*, *"auto layout"*, *"cloud cost"* aramaları | Statik diyagramların yük testi, gecikme (`p99`) veya AWS/GCP/Azure maliyeti hesaplayamadığından şikayet eden kullanıcılara `.drawio` / `.excalidraw` dosyasını doğrudan içe aktaran tamamlayıcı simülatör olarak sunmak. |
| **3** | **Reddit "Hangi Diyagram Aracını Kullanıyorsunuz?" Başlıkları** | • `r/softwarearchitecture`, `r/devops`, `r/aws`, `r/selfhosted`<br>• Arama: `"draw.io" OR "excalidraw" OR "cloudcraft" architecture` | Özellikle **Cloudcraft** (Datadog satın aldıktan sonra kurumsal fiyata kilitlendi) ve **Lucidchart** alternatiflerini soranlara: *"Draw.io veya Excalidraw'da çizdiğiniz dosyayı doğrudan yükleyip 60 FPS kuyruk fiziği + çoklu bulut FinOps maliyeti görebileceğiniz ücretsiz tarayıcı simülatörü"* yanıtı. |
| **4** | **VS Code Eklenti Kullanıcıları (`hediet.vscode-drawio` — 2.5M+ İndirme)** | GitHub'da `.drawio.svg` veya `.drawio.png` uzantılı dosyaları repolarında tutan geliştiriciler (`extension:drawio.svg`) | GraphFlow'un `.drawio.svg` içindeki gömülü `<mxfile>` XML verisini bile otomatik okuyup canlı topolojiye çevirdiğini göstermek. |
| **5** | **Obsidian & Notion Mimar Toplulukları (`r/ObsidianMD`, `r/Notion`)** | Obsidian Excalidraw eklentisi ve Notion Mermaid bloklarıyla sistem tasarımı notları tutan yazılımcılar | *"Obsidian'daki `.excalidraw` veya Notion'daki `Mermaid` kodunuzu yapıştırın, statik notunuz 60 FPS çalışan stres testine dönüşsün."* |
| **6** | **AlternativeTo & Product Hunt "Draw.io / Cloudcraft Alternatives"** | • `alternativeto.net/software/cloudcraft/`<br>• `alternativeto.net/software/draw-io/` | GraphFlow'u **Cloudcraft**, **draw.io**, **Excalidraw** ve **IcePanel** altına *"Executable Architecture Simulator (with native .drawio & .excalidraw import)"* olarak eklemek. |
