---
date: 2026-08-31
topics: [semantic-pattern-model, sync-and-enforcement]
plans: [2026-08-31-phase-2-wcag-2-2-review-and-hardening-2d3c64a3c5.md]
issue: https://github.com/verndale/accessibility-standards/issues/15
branch: codex/gh-15-wcag-2-2-semantic-gap-coverage
---
# WCAG 2.2 Phase 2 review and hardening

Reviewed the complete issue 15 change set against the normative [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/), the informative APG [switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/), [alert dialog](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/), and [toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/) contracts, the repository's fail-closed validation model, deterministic consumer projections, and every issue acceptance condition. No P0 release blocker was found. Two P1 contract findings and two P2 regression-coverage findings were resolved; no actionable finding remains open.

## Resolved findings

### P1 — Deferred and implemented patterns could contradict each other

The WCAG coverage validator required grid and treegrid to remain in the deferred backlog but did not reject a deferred ID when the matching `pattern.<id>` record was also implemented. That allowed a source contract to tell consumers that the same APG pattern was both shipped and deferred. Runtime validation now compares every deferred slug with implemented pattern IDs and fails closed on overlap. A mutation test proves that re-adding switch to the deferred list is rejected, while an unimplemented extensible deferred entry remains valid.

### P1 — Alert dialog was not self-contained at the semantic dependency layer

The alert-dialog behavior correctly described modal keyboard and focus handling, but its semantic dependency list relied too heavily on the base dialog mapping. A consumer activating `pattern.alert-dialog` directly would not receive the general keyboard, focus-order, and visible-focus obligations. The pattern now composes those three semantics in addition to initial focus, focus return, Escape handling, modal dialog semantics, and name/role/state requirements.

### P2 — Forbidden specialization paths lacked explicit regression guards

The binding design correctly avoided deriving alert dialog from passive alerts or toolbar from rich-text-editor and utility-bar, but tests did not state those prohibitions directly. A focused resolver test now proves that urgent passive alert content resolves only to `pattern.alert`, while rich-text-editor and utility-bar do not add `pattern.toolbar`.

### P2 — Acceptance totals and criterion-detail assertions were incomplete

Reference and proof-lane tests covered all 21 new semantics, but detailed requirement assertions covered only 13 and the exact 50-semantic, 28-pattern, 28-row, 36-fact, and 80-binding acceptance totals were not pinned together. The Phase 2 test now asserts every total and criterion-specific details for all 21 rules, including the simpler navigation, link, pointer, language, and context-change obligations. Switch tests also pin the native `checked` versus custom `aria-checked` state distinction.

## Verification

`pnpm contract:version:check`, `pnpm check`, `pnpm test`, and `pnpm build` pass after the fixes. The suite reports 50 passing unit tests, source validation reports 50 semantics, 28 patterns, 28 applicability rows, and 80 UI bindings, and the distribution build reports 83 records across two profiles. The wiki integrity and graph checks are part of the same delivery.
