---
date: 2026-08-30
topics: [standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections]
plans: [2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md]
issue: https://github.com/verndale/accessibility-standards/issues/6
branch: codex/gh-6-wcag-2-2-pattern-expansion
---
# WCAG 2.2 coverage and pattern expansion

Opened [issue 6](https://github.com/verndale/accessibility-standards/issues/6) as one umbrella feature for the audit and first implementation batch, verified its `enhancement` and `documentation` labels, and created the local branch `codex/gh-6-wcag-2-2-pattern-expansion` from the verified latest `main`. The branch remains local and uncommitted.

Established the breaking schema/package/profile 3 contract. Semantic and pattern records now carry normalized references with authority, identifier, URL, normative status, and WCAG level. WCAG 2.2 remains the normative source; Understanding WCAG and APG are recorded as informative sources. A canonical 55-entry Level A/AA inventory records 16 covered criteria, 8 partial criteria, and 31 explicit gaps, with bidirectional validation between non-gap rows and normative semantic references.

Added dedicated semantics and applicability routes for 2.5.7 Dragging Movements, 3.2.6 Consistent Help, 3.3.7 Redundant Entry, and 3.3.8 Accessible Authentication. Strengthened the existing 2.4.11 Focus Not Obscured and 2.5.8 Target Size requirements. Corrected rules are tested for applicable, inapplicable, unobserved, and invalid-type fact states.

Added APG-backed menu, tree view, radio group, slider, spinbutton, and checkbox patterns and wired the eight matching UI Design Brain bindings while retaining generic field behavior where applicable. Multi-thumb slider behavior remains an explicit product decision. Alert dialog, grid, treegrid, switch, and toolbar remain documented deferred candidates; the data-table semantic no longer claims interactive-grid behavior.

Both profiles now project the coverage inventory in JSON and render references, activation, coverage status, and deferred work in generated Markdown. Runtime validation rejects missing or inconsistent references, non-canonical coverage, unknown semantic links, unreachable records, and unused facts. Verification evidence is the repository's `pnpm verify:ci`, `pnpm wiki:check`, and `pnpm graph:check` suite.

## Adversarial follow-up

Three independent red-team passes reviewed standards accuracy, APG behavior, contract integrity, provenance, and projection delivery. No P0 release blocker was found. The review corrected optimistic coverage claims by moving 1.1.1 Non-text Content to partial and tightening the semantics for 3.3.4 Error Prevention, 4.1.2 Name, Role, Value, 3.3.3 Error Suggestion, 2.5.3 Label in Name, and 2.5.8 Target Size. Weak applicability routes for character-key shortcuts, orientation or sensory cues, and locale or bidirectional text were removed; Consistent Help now activates only when repeated help exists across a page set.

Menu and tree-view behavior now encode the relevant APG keyboard distinctions, selection models, disabled-item behavior, and popup-versus-menubar entry behavior. Slider and spinbutton explicitly preserve native-first implementation, and the spinbutton contract no longer contradicts its editable interaction model.

Contract validation now recognizes all 86 WCAG 2.2 A, AA, and AAA criterion identifiers, pins known source authorities, enforces exact criterion levels and official URLs, and requires paired normative WCAG and informative Understanding references for semantic mappings. Closed schemas and runtime guardrails reject malformed records with contract errors. Packaged schemas participate in the source digest; generated JSON uses canonical key ordering; Markdown escapes table and link content; deferred APG candidates remain extensible while retaining the required baseline backlog; and sync tests assert the coverage manifest and its provenance.
