---
aliases: [accessibility semantics, pattern composition, applicability matrix]
covers: []
---
# Semantic and pattern model

Semantics own atomic platform and WCAG obligations. Patterns reference semantic IDs, then add activation facts, interaction behavior, product choices, Functional Spec bindings, implementation outcomes, and proof routes. This prevents consumers from carrying divergent copies of the same rule.

The validated applicability matrix evaluates typed facts with only six operators. Trigger and resolution states distinguish what has been observed from what still requires product input. Standards-owned consequences resolve automatically. Form presence selects `pattern.field`; the independent `component.has_validation` fact selects `pattern.validation`, so inactive validation produces no boilerplate. Schema 3 replaces a fixed row-count guard with reachability and unused-fact invariants.

Every semantic and pattern carries normalized standards references with authority, identifier, URL, normative status, and a WCAG level where applicable. The 55-entry WCAG 2.2 Level A/AA inventory now classifies 37 criteria as covered, 8 as partial, and 10 as gaps, and requires every non-gap semantic mapping to have a matching normative reference. Coverage is granted only through semantic mappings; pattern references record provenance without independently changing criterion status. The additive `3.1.0` phase adds 21 dedicated rules across visual presentation, navigation and focus, pointer and input behavior, language, timing, and context-change consistency. Typed applicability facts route those obligations only when the relevant interface capability or page-set condition is known, and missing or invalid facts fail closed.

The APG catalog includes menu, tree view, radio group, slider, spinbutton, checkbox, switch, alert dialog, and toolbar contracts. Each retains its own activation, interaction model, product decisions, implementation outcomes, and evidence lanes. Switch requires `role="switch"` for both native-checkbox and custom hosts while preserving the host-appropriate checked state; alert dialog retains urgent-response focus and dismissal behavior; toolbar defines a roving-focus keyboard model. Grid and treegrid are the only required deferred patterns and remain gated until their static-versus-interactive, selection, editing, and keyboard models are decision-complete; a data-table semantic is not used as a substitute for either contract.

Canonical UI names enter through the [UI pattern binding](./ui-pattern-bindings.md), never through alias text or arbitrary Markdown. The binding resolves each ordered UI Design Brain slug exactly once to direct patterns, fact-dependent candidates, or baseline-only handling. Pattern activations consume derived accessibility pattern IDs; `component.pattern` is not a supported fact.

Related: [standards authority](./standards-authority.md), [consumer projections](./consumer-projections.md), [sync enforcement](./sync-and-enforcement.md), the [WCAG 2.2 expansion plan](../plans/2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md), and the [semantic-gap coverage plan](../plans/2026-08-31-phase-2-wcag-2-2-semantic-gap-coverage-v3-1-0-996e626c58.md).
