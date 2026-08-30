---
aliases: [accessibility semantics, pattern composition, applicability matrix]
covers: []
---
# Semantic and pattern model

Semantics own atomic platform and WCAG obligations. Patterns reference semantic IDs, then add activation facts, interaction behavior, product choices, Functional Spec bindings, implementation outcomes, and proof routes. This prevents consumers from carrying divergent copies of the same rule.

The validated 19-row applicability matrix evaluates typed facts with only six operators. Trigger and resolution states distinguish what has been observed from what still requires product input. Standards-owned consequences resolve automatically. Form presence selects `pattern.field`; the independent `component.has_validation` fact selects `pattern.validation`, so inactive validation produces no boilerplate.

Canonical UI names enter through the [UI pattern binding](./ui-pattern-bindings.md), never through alias text or arbitrary Markdown. The binding resolves each ordered UI Design Brain slug exactly once to direct patterns, fact-dependent candidates, or baseline-only handling. Pattern activations consume derived accessibility pattern IDs; `component.pattern` is not a supported fact.

Related: [standards authority](./standards-authority.md), [consumer projections](./consumer-projections.md), and [sync enforcement](./sync-and-enforcement.md).
