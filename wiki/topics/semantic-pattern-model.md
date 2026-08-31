---
aliases: [accessibility semantics, pattern composition, applicability matrix]
covers: []
---
# Semantic and pattern model

Semantics own atomic platform and WCAG obligations. Patterns reference semantic IDs, then add activation facts, interaction behavior, product choices, Functional Spec bindings, implementation outcomes, and proof routes. This prevents consumers from carrying divergent copies of the same rule.

The validated applicability matrix evaluates typed facts with only six operators. Trigger and resolution states distinguish what has been observed from what still requires product input. Standards-owned consequences resolve automatically. Form presence selects `pattern.field`; the independent `component.has_validation` fact selects `pattern.validation`, so inactive validation produces no boilerplate. Schema 3 replaces a fixed row-count guard with reachability and unused-fact invariants.

Every semantic and pattern carries normalized standards references with authority, identifier, URL, normative status, and a WCAG level where applicable. The 55-entry WCAG 2.2 Level A/AA inventory classifies 16 criteria as covered, 8 as partial, and 31 as gaps, and requires every non-gap semantic mapping to have a matching normative reference. Coverage is granted only through semantic mappings; pattern references record provenance without independently changing criterion status. Dedicated semantics now cover Dragging Movements, Consistent Help, Redundant Entry, and Accessible Authentication; Focus Not Obscured and Target Size have explicit strengthened mappings. The applicability model deliberately omits weak proxies for character-key shortcuts, orientation or sensory cues, and locale or bidirectional text, while Consistent Help activates only when repeated help exists across a page set.

The first APG expansion adds menu, tree view, radio group, slider, spinbutton, and checkbox contracts. Each retains its own activation, interaction model, product decisions, implementation outcomes, and evidence lanes. Menu and tree-view contracts preserve the relevant APG entry, arrow-key, selection-model, disabled-item, and dismissal distinctions. Slider and spinbutton state the native-first baseline; multi-thumb slider behavior remains an explicit product decision. Alert dialog, grid, treegrid, switch, and toolbar form the required baseline of an extensible deferred backlog; a data-table semantic is not used as a substitute for an interactive grid contract.

Canonical UI names enter through the [UI pattern binding](./ui-pattern-bindings.md), never through alias text or arbitrary Markdown. The binding resolves each ordered UI Design Brain slug exactly once to direct patterns, fact-dependent candidates, or baseline-only handling. Pattern activations consume derived accessibility pattern IDs; `component.pattern` is not a supported fact.

Related: [standards authority](./standards-authority.md), [consumer projections](./consumer-projections.md), [sync enforcement](./sync-and-enforcement.md), and the [WCAG 2.2 expansion plan](../plans/2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md).
