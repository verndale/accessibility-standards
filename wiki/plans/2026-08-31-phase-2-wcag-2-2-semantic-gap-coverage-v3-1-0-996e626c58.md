---
status: "implemented"
executed: true
evidence: ["GitHub issue https://github.com/verndale/accessibility-standards/issues/15", "src/coverage/wcag-2.2.yml: 37 covered, 8 partial, 10 gap", "node --test tests/unit/*.test.mjs: 50 passing"]
source_tool: "repository"
source: "/private/tmp/accessibility-standards-phase-2-plan.md"
topics: ["standards-authority", "semantic-pattern-model", "ui-pattern-bindings", "consumer-projections"]
digest: "996e626c583b0c4ca18b7cd5b090b66bc79338dc23dee0c65cb616c0c3ad8f35"
---

# Phase 2: WCAG 2.2 Semantic-Gap Coverage — v3.1.0

## Summary

- File and verify the Phase 2 feature issue, then create its issue-linked local branch from current `main`.
- Deliver an additive `3.1.0` contract while preserving schema generation 3 and existing stable IDs.
- Add 21 dedicated WCAG 2.2 semantic obligations and discriminator-gated `switch`, `alert-dialog`, and `toolbar` patterns.
- Keep `grid` and `treegrid` deferred for a later issue after their interaction models are decision-complete.

## Contract and implementation changes

- Add dedicated semantics for WCAG 1.4.3, 1.4.10–1.4.13, 2.1.4, 2.2.1, 2.4.1–2.4.5, 2.5.1, 2.5.2, 2.5.4, 3.1.1, 3.1.2, and 3.2.1–3.2.4 with paired normative WCAG and informative Understanding references.
- Add typed applicability facts and fail-closed routes for rendered interfaces, links, hover/focus content, shortcuts, pointer activation, motion actuation, time limits, context changes, and repeated page-set navigation/components.
- Gate `pattern.switch`, `pattern.alert-dialog`, and `pattern.toolbar` behind exact candidate discriminator values while preserving existing field, dialog, and button-group outcomes.
- Update the coverage inventory to 37 covered, 8 partial, and 10 gaps; retain only grid/treegrid as the required deferred APG backlog.
- Update package/profile/provenance contracts to 3.1.0 without changing schema generation or the pinned UI Design Brain catalog.

## Test and delivery plan

- Test complete criterion wording, exact references, proof lanes, reachability, and bidirectional coverage mapping.
- Test every new boolean fact across applicable, not-applicable, missing, and invalid states; test candidate bindings across matching, nonmatching, missing, and invalid discriminator states.
- Test APG roles, states, focus, keyboard behavior, baseline preservation, deterministic projections, packaged schemas, and consumer compatibility.
- Archive the executed plan, add the journal and topic updates, rebuild the graph, and run the full CI/wiki/graph verification suite.

## Assumptions

- GitHub issue 15 is the delivery tracker and the local branch remains unpushed.
- WCAG is normative; Understanding WCAG and APG are informative.
- No grid/treegrid issue, pull request, merge, or publication is part of this delivery.
