---
aliases: [WCAG authority, ARIA authority, accessibility package]
covers: []
---
# Standards authority

The public package [@verndale/accessibility-standards](https://github.com/verndale/accessibility-standards) is normative for shared accessibility obligations. Authority order is native platform semantics, WCAG 2.2, WAI-ARIA, APG pattern guidance, then non-conflicting product policy. WCAG success criteria are normative; Understanding WCAG and APG are informative implementation guidance. Consumer prose cannot create or weaken requirements.

IDs are stable contracts. Authority, behavior, schema, or removal changes are major; additive records are minor; editorial corrections are patch. Compatibility fails closed across a major or when a consumer references records unavailable in its pinned version.

[UI Design Brain](https://github.com/verndale/ui-design-brain) is authoritative only for UI vocabulary and aliases. It does not own accessibility requirements. This repository owns the [versioned mapping](./ui-pattern-bindings.md) from its canonical slugs to accessibility patterns. Schema 2 introduced that deterministic binding at `2.0.0`. Schema 3, tracked by [issue 6](https://github.com/verndale/accessibility-standards/issues/6), is a breaking `3.0.0` contract that normalizes per-record standards references and adds criterion-level WCAG 2.2 A/AA coverage; neither contract may be stamped with an earlier version. The additive `3.1.0` expansion tracked by [issue 15](https://github.com/verndale/accessibility-standards/issues/15) retains schema 3 while adding dedicated semantic-gap rules and bounded APG specializations.

Schema 3 recognizes the complete set of 86 WCAG 2.2 Level A, AA, and AAA criterion identifiers and validates each criterion's canonical level and official WCAG and Understanding URLs. Known authorities are pinned to their declared source metadata, semantic WCAG citations require a paired informative Understanding citation, and unknown authorities fail closed. JSON Schema provides structural validation while runtime invariants enforce identifier-to-level-to-URL relationships. Packaged schemas are themselves source-contract inputs, so changing a schema changes the source digest.

Related: [semantic and pattern model](./semantic-pattern-model.md), [consumer projections](./consumer-projections.md), the [original delivery plan](../plans/2026-08-30-shared-accessibility-standards-delivery.md), the [WCAG 2.2 expansion plan](../plans/2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md), and the [semantic-gap coverage plan](../plans/2026-08-31-phase-2-wcag-2-2-semantic-gap-coverage-v3-1-0-996e626c58.md).
