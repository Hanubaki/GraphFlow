# GraphFlow - Claude Code kuralları

## Skill kullanım bildirimi
Bir skill kullandığında cevabın ilk cümlesinde hangi skill(ler)i kullandığını söyle
(örnek: "git-ninja ve vitest-tdd skill'lerini kullandım, ...").

## Skill'ler
Proje skill'leri `.claude/skills/` altındadır (Antigravity `.agent/skills` klasöründen taşındı).
İlgili görev geldiğinde ilgili skill'i Skill aracıyla yükle.

## Kurallar
Aşağıdaki kurallar bağlayıcıdır:

@.claude/rules/command-execution-guard.md
@.claude/rules/skill-recommendations.md
@.claude/rules/completed-skills-manifest.md
