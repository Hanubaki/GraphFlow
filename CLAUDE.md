# GraphFlow - Claude Code kuralları

## Çalışma sırası (her istekte)
1. Cevap vermeden veya iş yapmadan önce isteğe uyan skill(leri) belirle (`.claude/skills/`).
2. O skill'leri Skill aracıyla yükle ve uygula. Token tüketimini azaltmak için
   `token-optimization` her istekte varsayılan olarak kullanılır.
3. Sonra cevabı ver / kodu yaz / işi yap.
4. Cevabın ilk cümlesinde hangi skill(ler)i kullandığını söyle
   (örnek: "token-optimization ve git-ninja skill'lerini kullandım, ...").

## Ponytail (her cevapta)
Her kodlama görevinde (yazma, düzeltme, refactor, review) `ponytail` skill'ini yükle ve uygula
(varsayılan seviye: full). Kullanıcı "stop ponytail" veya "normal mode" diyene kadar aktif kalır.
Cevabın ilk cümlesinde ponytail'i de kullanılan skill'ler arasında say.

## Skill'ler
Proje skill'leri `.claude/skills/` altındadır (Antigravity `.agent/skills` klasöründen taşındı).
İlgili görev geldiğinde ilgili skill'i Skill aracıyla yükle.

## Kurallar
Aşağıdaki kurallar bağlayıcıdır:

@.claude/rules/command-execution-guard.md
@.claude/rules/skill-recommendations.md
@.claude/rules/completed-skills-manifest.md
