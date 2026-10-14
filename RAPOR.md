# GraphFlow — Proje Durum, Gelir Yolu ve Denetim Raporu (RAPOR.md)

**Son Güncelleme:** 14 Ekim 2026
**Canlı Üretim Adresi:** https://graph-flow-virid.vercel.app
**Git Durumu:** `main` (`dc9d044` - Lemon Squeezy CSP ve gömülü ödeme penceresi düzeltmesi dahil)
**Test ve Derleme Durumu:** 18/18 Test Dosyası, 109/109 Birim Testi Başarılı, 0 TypeScript Hatası

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

---

## 2. Gelir Yolu (Lemon Squeezy Mağaza Onayı — Canlıya Geçiş Adımı)

- **Durum:** Tanıtım videosu çekildi.
- **Son Adım:** Videonun Google Drive bağlantısı ("Bağlantıya sahip olan herkes görüntüleyebilir") ve sosyal medya profil linki hazır İngilizce şablona eklenerek `hello@lemonsqueezy.com` adresinden gelen e-postaya **Yanıtla (Reply)** olarak gönderilecek.
