# GraphFlow — Proje Durum, Gelir Yolu ve Denetim Raporu (RAPOR.md)

**Son Güncelleme:** 15 Ekim 2026
**Canlı Üretim Adresi:** https://graph-flow-virid.vercel.app
**Git Durumu:** `main` (`dc9d044` - Lemon Squeezy CSP ve gömülü ödeme penceresi düzeltmesi dahil)
**Test ve Derleme Durumu:** 18/18 Test Dosyası, 109/109 Birim Testi Başarılı, 0 TypeScript Hatası
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
   - Aktif Bağlı Uygulamalar (6 Adet): **Gmail** (`berkeakdemir5855@gmail.com`), **GitHub** (`Hanubaki`), **Vercel** (`berkeakdemir5855-9289`), **Twitter / X** (`@Hanubaki01`), **YouTube** (`youtube_sunny-unteem`), **Instagram** (`@dijitalvitrin.app`).

---

## 2. Gelir Yolu (Lemon Squeezy Mağaza Onayı ve Gerçek Satışa Geçiş)

- **Onay Durumu:** 15 Ekim 2026 sabahı saat 06:08 ve 06:09'da Lemon Squeezy'den (`hello@lemonsqueezy.com` - Tanay Khemka) iki e-posta geldi: **"Your store has been activated!"** ve **"Your account has now been APPROVED."**
- **Canlı Ödeme Linki (Live Mode) Bağlandı:**
  - Canlı mağazadan (`https://graphflow.lemonsqueezy.com`) yeni Live Mode ödeme bağlantısı (`https://graphflow.lemonsqueezy.com/checkout/buy/171c3132-5464-46eb-a519-b95c1e4bca8a?embed=1`) otomatik çekildi.
  - `src/components/Modals/PricingModal.tsx`, `src/components/Landing/LandingPage.tsx`, `src/services/billing.ts` ve tüm birim testleri yeni canlı ödeme linkine geçirildi.
