---
name: i18n-localization
description: >-
  Internationalization (i18n), localization (l10n), multi-language catalogs, RTL layout adaptation,
  ICU message formats, and locale-aware number/currency formatting. Use when internationalizing apps or adding multi-language support.
---

# Internationalization (i18n) & Localization Runbook

Engineering standards for globally accessible, multi-lingual web applications.

## 1. Structured Locale Catalogs

* Never hardcode user-facing strings directly in components.
* Use nested dictionary structures with scoped keys:

```json
{
  "canvas": {
    "nodes": {
      "gateway": "API Gateway",
      "database": "PostgreSQL Database"
    },
    "actions": {
      "clear": "Clear Architecture",
      "export": "Export Diagram"
    }
  }
}
```

## 2. Pluralization & Interpolation

* Avoid naive string concatenation for counts (`count + " items"`).
* Use ICU MessageFormat or `Intl.PluralRules` to support languages with complex plural forms (e.g. Russian, Arabic, Polish).

## 3. Formatting with Native `Intl` APIs

* Currency: `new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount)`
* Dates: `new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)`
* Layouts: Add `dir="rtl"` to root elements when rendering right-to-left languages (Arabic, Hebrew).
