---
aliases: [WCAG authority, ARIA authority, accessibility package]
covers: []
---
# Standards authority

The public package [@verndale/accessibility-standards](https://github.com/verndale/accessibility-standards) is normative for shared accessibility obligations. Authority order is native platform semantics, WCAG 2.2, WAI-ARIA, APG pattern guidance, then non-conflicting product policy. Consumer prose cannot create or weaken requirements.

IDs are stable contracts. Authority, behavior, schema, or removal changes are major; additive records are minor; editorial corrections are patch. Compatibility fails closed across a major or when a consumer references records unavailable in its pinned version.

[UI Design Brain](https://github.com/verndale/ui-design-brain) is authoritative only for UI vocabulary and aliases. It does not own accessibility requirements. This repository owns the [versioned mapping](./ui-pattern-bindings.md) from its canonical slugs to accessibility patterns. The schema-2 binding is a breaking authority/projection change targeted for `@verndale/accessibility-standards@2.0.0`; it cannot be stamped as version 1.0.0.

Related: [semantic and pattern model](./semantic-pattern-model.md), [consumer projections](./consumer-projections.md), and the [delivery plan](../plans/2026-08-30-shared-accessibility-standards-delivery.md).
