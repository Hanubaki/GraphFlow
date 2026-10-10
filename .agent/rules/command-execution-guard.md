# Komut Çalıştırma ve Otomatik Kapanma Kuralı (Command Execution & Auto-Shutdown Rule)

Arka planda (background) veya terminalde çalıştırılan işlemlerin projeyi kilitlemesini, döngüye sokmasını veya askıda kalmasını (hang) engellemek için şu kurallar KESİNLİKLE uygulanmalıdır:

## 1. Etkileşimli Giriş ve Bekleme Yasağı (Zero-Hanging Mandate)
- **Git Komutları:** Git komutları çalıştırılırken KESİNLİKLE `$env:GIT_TERMINAL_PROMPT = "0"` tanımlanmalıdır. Bu sayede kimlik doğrulama başarısız olursa git stdin üzerinde kullanıcı adı/şifre sormak için sonsuza kadar beklemek yerine hemen hata döndürür.
- **CLI Araçları:** `npm`, `npx`, `impeccable` gibi araçlar çalıştırılırken her zaman etkileşimsiz bayraklar (`--yes`, `-y`, `--force`, `--no-prompt`, `--scope=project`) eklenmelidir. Asla kullanıcıdan stdin bekleyen interaktif seçim modunda komut başlatılamaz.

## 2. Otomatik Zaman Aşımı ve Kapanma (Timeout & Self-Shutdown)
- Büyük bir indirme veya derleme işlemi olmadığı sürece (küçük işlemler, durum sorguları, push/fetch işlemleri) komutlar **maksimum 15-30 saniye içinde kendini kapatacak (timeout / auto-shutdown)** şekilde kurgulanmalıdır.
- Komut PowerShell içerisinde çalıştırılırken gerekirse zaman aşımı kontrolü eklenmeli, takılan veya askıda kalan komutlar döngüye girmeden anında sonlandırılmalıdır.

## 3. Bağımsız Çalışabilirlik (Self-Contained Scripts)
- PowerShell süreçleri bağımsız process'ler olarak çalıştığı için, özel C# tipleri (örn. `CredReader`) kullanan her komut bloğu `Add-Type` tanımını KENDİ İÇERİSİNDE barındırmalıdır. Asla önceki bir adımdan tip tanımının kalacağı varsayılmamalıdır.
