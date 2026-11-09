# GraphFlow – Mobil Test Raporu

**Tarih:** 2026-11-09 · **Site:** https://graph-flow-virid.vercel.app/
**Cihaz:** Xiaomi/Redmi `2510DRA23E` (spinel), Android, Chrome 156, 1080x2392 @ 450dpi (384x701 CSS px), 120 Hz ekran, Wi-Fi ADB
**Yöntem:** Telefonda gerçek Chrome. Kaydırma/pan/dokunma `adb input` ile, kare süreleri Chrome DevTools (CDP) üzerinden sayfa içi `requestAnimationFrame` probu ile ölçüldü.

> **Not (ARTEMIS):** ARTEMIS Pro görevi başlatıldı ama ARTEMIS'in kullandığı Gemini anahtarı ücretsiz katman günlük kotasını doldurmuştu (`429 RESOURCE_EXHAUSTED`, `gemini-3.8-flash`, 20 istek/gün, ~14 saat sonra sıfırlanır). Görev durduruldu. Aynı telefon doğrudan ADB + CDP ile test edildi. ARTEMIS'i tekrar kullanmak için `.env` içine ücretli bir Gemini anahtarı konmalı veya kota sıfırlanmasını beklemeli.
> Test **dikey (portrait)** yönde yapıldı. Yatay yön denenmedi.

---

## Özet

| Alan | Sonuç |
|---|---|
| Yükleme | İyi. FCP 544 ms, load 780 ms, toplam ~301 KB, yatay taşma yok |
| Landing kaydırma | İyi. ~59 fps, uzun görev (long task) yok, CLS 0 |
| Studio (canvas) boşta + simülasyon | İyi. ~58 fps, uzun görev yok |
| **Studio'da pan (tek parmak)** | **Orta/Kötü. ~51 fps, karelerin %33'ü > 25 ms** |
| **Studio okunabilirliği** | **Kötü. Graph minik, sağda kesik, düğüm yazıları okunmuyor** |
| Dokunma hedefleri | Orta. Landing'de 37, studio'da 45 öğe 40 px altında |

Ana sonuç: telefon kullanıcısı landing sayfasında sorunsuz, ama "Open studio"ya girince diyagramı okuyamıyor ve pan hareketi takılıyor. Asıl değer burada olduğu için öncelik studio mobil deneyimi.

---

## Ölçümler

**Landing (`/`), 18 kaydırma, yukarı-aşağı**

| Metrik | Değer |
|---|---|
| Kare sayısı | 1202 |
| Ortalama / FPS | 16.83 ms / 59.4 |
| p50 / p90 / p95 / p99 | 16.9 / 16.9 / 17.0 / 25.3 ms |
| En kötü kare | 101 ms (1 adet, ilk kaydırma) |
| 25 ms üstü kare | 21 (%1.7) |
| Long task | 0 |
| CLS | 0 |
| Sayfa yüksekliği / DOM | 13 649 px / 1383 öğe, 54 SVG |

**Studio (`/?template=stripe-webhook-ledger`)**

| Durum | FPS | p50 | p90 | p95 | p99 | >25 ms kare | Long task |
|---|---|---|---|---|---|---|---|
| Boşta, simülasyon çalışıyor (5 sn) | 58.4 | 16.8 | 16.9 | 17.0 | 25.4 | 7 / 295 | 0 |
| Tek parmak pan (24 kaydırma) | **51.2** | 16.9 | **25.4** | **33.7** | **42.1** | **267 / 820 (%33)** | 0 |

Not: Chrome `requestAnimationFrame`'i 60 Hz ile sınırladığı için ~59 fps "tam akıcı" anlamına gelir. Ekran 120 Hz.
`dumpsys gfxinfo com.android.chrome` Chrome GPU süreci ayrı olduğu için 0 kare döndürdü, bu yüzden CDP kullanıldı.

---

## Bulgular

### Yüksek öncelik

**1. Studio'da graph telefonda okunmuyor ve ekrana sığmıyor**
- Ekran: `/?template=stripe-webhook-ledger`, portrait.
- Graph ekranın alt-orta kısmında ~6 px yazılarla duruyor, sağ kenarda kesiliyor, üstte ve altta büyük boş alan var. "Fit" düğmesi bir şey değiştirmiyor.
- Neden: [`src/utils/viewportMath.ts`](src/utils/viewportMath.ts) mobil min zoom'u 0.22'ye sabitliyor. Şablonlar yatay bir pipeline (geniş), dikey telefon dar. 0.22'de bile genişlik sığmıyor, `Math.min(1.0, Math.max(minZoom, ...))` sığdırma yerine kırpıyor. Ayrıca `graphWidth = Math.max(400, ...)` ve `availableHeight = windowHeight - 108` tahmini sabitler gerçek kanvas boyutunu ölçmüyor.
- Öneri:
  - Mobilde şablonu dikey (top-to-bottom) otomatik yerleştir (`autoLayoutTopology` zaten var), ya da ilk açılışta ilk düğüme okunabilir zoom'da (≥0.6) odaklan.
  - Fit için `window.innerWidth/innerHeight` yerine kanvas konteynerinin `getBoundingClientRect()` boyutunu kullan.
  - Dikeyde "yatay çevirin" ipucu göster.

**2. Pan sırasında takılma (51 fps, %33 yavaş kare)**
- Neden: [`GraphCanvas.tsx:331-339`](src/components/Canvas/GraphCanvas.tsx:331) her `touchmove`'da `setPan(...)` çağırıyor. `pan` state'i `App.tsx` içinde olduğu için her dokunma olayında App ve altındaki TopBar, NodePalette, Inspector, tüm düğümler yeniden render oluyor. Pinch (`setZoom` + `setPan`) için de aynı durum geçerli.
- Öneri:
  - Pan/zoom'u `ref` + `requestAnimationFrame` ile kanvas katmanına `transform: translate3d(...) scale(...)` olarak doğrudan uygula, React state'e sadece `touchend`'de yaz.
  - `NodeComponent` ve `ConnectionLine`'ı `React.memo` ile sar, pan değişince yeniden render olmasınlar.
  - Kanvas konteynerine `touch-action: none` ve `will-change: transform` ekle (şu an projede hiç `touch-action` tanımı yok).

### Orta öncelik

**3. İlk girişte 6 adımlık tur ekranı kaplıyor**
Studio'ya ilk giren kullanıcıya tam ekran modal tur çıkıyor ve ekranın yarısını örtüyor. Atlanabiliyor ("Skip"), ama mobilde varsayılan olarak kapalı başlayıp küçük bir "Tur" düğmesi olması daha iyi.

**4. Üst araç çubuğu yatay kayıyor, düğmeler gizli**
Studio'da TopBar 384 px'e sığmıyor, sağdaki düğmeler (Templates/Export/…) kesiliyor ve çubuğun altında kaydırma çubuğu görünüyor. Kullanıcı gizli düğmelerin varlığını fark etmeyebilir. Öneri: mobilde birincil 3-4 eylem + "⋯" menüsü, ya da komut paleti.

**5. Sol palet kalıcı olarak ~57 CSS px (ekranın %15'i) yer kaplıyor**
Zaten dar olan alanı daraltıyor. Öneri: varsayılan kapalı, "+" ile açılan alt çekmece (bottom sheet) olsun. Inspect paneli zaten güzel bir bottom sheet, aynı kalıp palet için de kullanılabilir.

**6. Dokunma hedefleri küçük**
Landing: breadcrumb bağlantıları 18 px yüksekliğinde, "Open studio" 32 px. Studio: hız düğmeleri 25-38x28, bazı düğmeler 31x28. Hedef en az 44x44 px. [`index.css`](src/index.css) içindeki `pointer: coarse` kuralı sadece `h-6/h-7/h-8` sınıflarını kapsıyor, `h-5`, `px-*`'lı küçük düğmeler ve bağlantılar dışarıda kalıyor.

### Düşük öncelik

**7. Landing'de alt sabit çubuk (Open Studio / Send to PC / Pro) ~%14 ekran yüksekliği kaplıyor**
Hero'daki "Open the studio" ile aynı eylemi tekrarlıyor, içeriği örtüyor. Öneri: ilk ekranda gizle, hero CTA görünür olunca gösterme, ya da yüksekliğini düşür.

**8. Breadcrumb mobilde iki satıra bölünüyor**
"Home > Architecture Blueprints > Scenarios > Interactive 60 FPS Studio" 384 px'e sığmıyor. Mobilde gizlenebilir ya da son öğeye kısaltılabilir.

**9. İlk kaydırmada tek 101 ms'lik kare**
Muhtemelen lazy yüklenen bölüm/görsel. Sorun düzeyinde değil, izlenebilir.

---

## Çalışanlar

- Site portrait'te düzgün yükleniyor, yatay taşma yok, hero okunaklı.
- Landing akıcı (59 fps, CLS 0, long task 0), toplam 301 KB.
- Studio açılıyor, şablon yükleniyor, simülasyon otomatik başlıyor ve boşta akıcı kalıyor.
- Düğümlere dokununca seçim araç çubuğu çıkıyor.
- "Inspect" alt çekmecesi (System Overview: servis sayısı, SLA, p50/p95/p99) mobilde güzel çalışıyor.
- Kodda pinch-zoom ve çok parmaklı pan, `pointer: coarse` dokunma alanı genişletme, `prefers-reduced-motion` desteği zaten var.

## Test edilmeyenler

- Pinch-zoom (ADB ile çok parmaklı hareket gönderilemedi), düğüm sürükleme, kablo çekme, düğüm ekleme ve diğer şablonlar (`netflix-chaos-streaming` vb.).
- Yatay (landscape) yön, farklı ekran boyutları, düşük donanımlı cihazlar.
- Ağ yavaşlatma altında yükleme. Ölçümler Wi-Fi'da, tek cihazda alındı.

## Düzeltme sonrası durum (2026-11-09)

**Yapılan: mobil "Fit" (bulgu #1)**
- [`viewportMath.ts`](src/utils/viewportMath.ts): `calculateAutoCenter` artık isteğe bağlı olarak kanvas konteynerinin ölçülmüş boyutunu alıyor. Eski kod `pan`'e 56 px palet ofseti ekliyordu ama `pan` konteynere göre olduğu için graph sağa kayıyordu. Dar kanvasta (<600 px) zoom en az 0.5 kalıyor, geniş graph sığdırılmak yerine sol/üst kenara hizalanıyor, alttaki HUD için 52 px ayrılıyor.
- [`App.tsx`](src/App.tsx): tüm otomatik ortalama çağrıları `fitToViewport` üzerinden ölçülmüş boyutu kullanıyor. [`GraphCanvas.tsx`](src/components/Canvas/GraphCanvas.tsx)'e `data-graph-canvas` özniteliği eklendi.
- Eski 3 parametreli çağrı aynı davranıyor, mevcut testler değişmeden geçiyor. 2 yeni test eklendi. 138/138 test geçiyor, `tsc` temiz.
- Telefonda doğrulandı: Stripe şablonunda düğüm yazıları artık okunuyor (eskiden ~6 px), pipeline başı sol kenarda.

**Denenip geri alınan: pan'i React state dışına alma (bulgu #2)**
Touch hareketini rAF ile doğrudan `transform`'a yazıp bırakınca state'e commit eden bir sürüm denendi. Aynı zoom'da (0.22) ölçüm: eski 47.6–48.4 fps, yeni 46–48 fps. Kazanç yok, yani darboğaz React render'ı değil. Karmaşıklık eklemesin diye geri alındı.

**Pan takılması: profillendi ve düzeltildi**
Chrome trace (CDP `Tracing`) sonucu: GPU süreci (`CrGpuMain`) **pan yokken bile %99 dolu**, raster flush tek başına 5.9 sn / 10 sn. Ana thread %57. Yani maliyet pan'den değil, sürekli yeniden raster edilen içerikten geliyordu. Boşta 10 sn'de ~1666 raster karosu ve ~115 farklı compositing katmanı oluşuyordu. Her kenardaki `animate-flow-dash` (kesikli çizgi akışı) `stroke-dashoffset` animasyonu ana thread'de çalışıyor ve her karede tüm kenarları yeniden boyuyordu.

Düzeltme: [`index.css`](src/index.css) içinde `@media (pointer: coarse)` altında `.animate-flow-dash { animation: none }`. Hareket eden paketler akışı zaten gösteriyor, masaüstü davranışı değişmedi.

Üç varyant aynı telefonda, ayrı portlardan, sırayla 3 tur ölçüldü (stripe-webhook-ledger, zoom 0.5):

| Varyant | Boşta | Pan | Pan p90 |
|---|---|---|---|
| A: mevcut | 51.9 fps | 36.5 fps | 42.2 ms |
| B: paketlerden `will-change-transform` kaldırılmış | 43.3 fps | 28.9 fps | 50.6 ms |
| **C: A + dokunmatikte dash animasyonu kapalı (uygulandı)** | **56.5 fps** | **51.7 fps** | **28.2 ms** |

B denemesi ters tepti: `will-change` paket katmanlarını küçük tutuyormuş, kaldırınca büyük katman yeniden raster ediliyor. Geri alındı, kod A'daki gibi kaldı. C, okunabilir zoom'da bile eski sürümün pan değerini (~48 fps @0.22) geçiyor.

Ölçüm notu: tek cihaz, Wi-Fi, ~35 °C. Aynı derlemede turlar arası ±5 fps oynama var, ama C ile A/B arasındaki fark her turda aynı yönde.

## İkinci tur düzeltmeler (2026-11-09)

Hepsi gerçek telefonda doğrulandı (üretim derlemesi, LAN üzerinden).

| Madde | Yapılan | Sonuç |
|---|---|---|
| #3 Tur | Telefonda (<768 px) ilk girişte otomatik açılmıyor, "⋯" menüsündeki "Studio tour"dan açılıyor | Stüdyoya girince ekran temiz |
| #4 TopBar | Telefonda yalnızca oynat, spike, ses, Presets, AI Gen, Export ve "⋯" kalıyor. Projects, Embed, Analytics, Live, komut paleti, Pro, giriş, dil, tur, temizle ve hız seçimi 44 px'lik satırlarla "⋯" menüsünde. Dokunma alanı sahte elemanlarının yarattığı yatay kaydırma çubuğu kaldırıldı | Bar taşmıyor, tüm eylemler erişilebilir |
| #5 Palet | Telefonda sabit 56 px'lik ray yerine yüzen "+ Add" düğmesi ve soldan açılan çekmece (arkası kararıyor, bileşen ekleyince kapanıyor). Alt HUD tüm genişliği kullanıyor | Kanvas tam genişlik |
| #6 Dokunma hedefleri | [`index.css`](src/index.css) 44 px kuralı `h-5/9/10`, `w-4/5/8/9/10` sınıflarını da kapsıyor | Görsel boyut aynı, dokunma alanı 44 px |
| İlerleme çubukları | `width` yerine `transform: scaleX` ([`NodeComponent.tsx`](src/components/Canvas/NodeComponent.tsx)) | Ana thread layout maliyeti yok |

Ölçüm (stripe-webhook-ledger, zoom 0.5): boşta **58.8 fps**, pan **64 fps** (p90 25 ms). Önceki tur 56.5 / 51.7, ilk test 58.4 / 51.2 (zoom 0.22).
Not: "görsel olarak 40 px altı" sayısı 45'ten 31'e indi, kalanlar 44 px dokunma alanı alan 28–32 px'lik düğmeler.

## Kalan işler

- Landing alt sabit çubuğu ve breadcrumb (#7, #8) yapılmadı.
- iOS Safari test edilmedi (ziyaretçilerin %37'si iOS).
- Pinch zoom, düğüm sürükleme ve diğer şablonlar test edilmedi.

## Önerilen sıra

1. Pan/zoom'u ref + rAF + `translate3d`'e taşı, düğümleri `memo`'la (#2, en kolay kazanç).
2. Mobilde dikey auto-layout veya okunabilir zoom'da odaklanma, Fit'i gerçek konteyner boyutuyla hesapla (#1).
3. TopBar'ı mobilde sadeleştir, paleti bottom sheet yap, turu isteğe bağlı yap (#3, #4, #5).
4. Dokunma hedeflerini 44 px'e çıkar, landing alt çubuğunu küçült (#6, #7).
