---
date: 2026-08-31
topics: [standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections]
plans: [2026-08-31-phase-2-wcag-2-2-semantic-gap-coverage-v3-1-0-996e626c58.md]
issue: https://github.com/verndale/accessibility-standards/issues/15
branch: codex/gh-15-wcag-2-2-semantic-gap-coverage
---
# WCAG 2.2 semantic-gap coverage

Opened [issue 15](https://github.com/verndale/accessibility-standards/issues/15) with `enhancement` and `documentation` labels and created the local branch `codex/gh-15-wcag-2-2-semantic-gap-coverage` from the verified latest `main`. This additive `3.1.0` delivery retains schema generation 3 and leaves publication, pull-request creation, and downstream dependency upgrades out of scope.

Added 21 dedicated WCAG 2.2 semantic obligations covering contrast and visual presentation, hover or focus content, page navigation and focus, link purpose, language, character shortcuts, timing, pointer input, motion actuation, context changes, and page-set consistency. Each rule has exact normative WCAG and informative Understanding references, criterion-specific exceptions, a declared proof lane, and a typed applicability route. The coverage inventory is now 37 covered, 8 partial, and 10 gaps.

Added APG-backed switch, alert-dialog, and toolbar contracts. UI Design Brain mappings specialize `toggle`, `modal`, and `button-group` only when exact discriminator facts match, while preserving their existing baseline outcomes. Switch semantics require `role="switch"` on both native-checkbox and custom hosts; alert dialog preserves urgent-response focus behavior; toolbar defines its composite keyboard and focus model. Link, skip-link, pagination, popover, and tooltip routes now carry their related Phase 2 semantics.

Grid and treegrid remain the only required deferred APG patterns. They will not be added until static-versus-interactive classification, selection, editing, and keyboard models are separately decision-complete. No follow-up issue was filed in this phase.

Validation covers exact criterion references and proof lanes, all new applicability states, matching and nonmatching candidate discriminators, missing and invalid discriminator values, APG behavior distinctions, deterministic projections, packaged schemas, and consumer compatibility. The implementation is verified by the repository unit, validation, build, release-contract, wiki, and graph checks and is committed only to the local issue branch.
