# GraphFlow — Proje Durum, Gelir Yolu ve Denetim Raporu (RAPOR.md)

**Son Güncelleme:** 14 Ekim 2026
**Canlı Üretim Adresi:** https://graph-flow-virid.vercel.app
**Git Durumu:** `main...origin/main` (`c6af10f` - %100 Senkronize)
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

---

## 2. Gelir Yolu (Lemon Squeezy Mağaza Onayı — Canlıya Geçiş Adımı)

Lemon Squeezy inceleme ekibinden (`hello@lemonsqueezy.com`) gelen standart mağaza doğrulama (KYB/KYC) e-postasına verilecek yanıt hazırlandı:
- **Gereksinim 1:** 45-60 saniyelik ekran kaydı (Canlı sitede stüdyoyu açma, simülasyonu çalıştırma, Pro kilit ekranını gösterme).
- **Gereksinim 2:** GitHub (`https://github.com/Hanubaki`) ve LinkedIn profil bağlantıları.
- **Gereksinim 3:** Ürünün %100 otomatik, anında teslim edilen (`api/webhook.ts` üzerinden otomatik Pro aktivasyonlu) bir SaaS yazılım aboneliği olduğunun resmi açıklaması.
