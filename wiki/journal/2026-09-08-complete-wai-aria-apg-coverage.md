---
date: 2026-09-08
topics: [standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections]
plans: [2026-09-07-schema-4-complete-wai-aria-apg-pattern-and-practice-coverage-b0d9993b75.md]
issue: https://github.com/verndale/accessibility-standards/issues/22
branch: codex/22-complete-aria-apg-coverage
---
# Complete WAI-ARIA APG coverage and schema 4

Opened [issue 22](https://github.com/verndale/accessibility-standards/issues/22) with the `enhancement` and `documentation` labels and created `codex/22-complete-aria-apg-coverage` from the exact `main` commit `46a842860c24376ca07be464f6b1367aaa5396ec`. The official execution plan is archived with its immutable body digest and an implemented audit status. Following the separately authorized adversarial review, the delivery is committed and published on `origin/codex/22-complete-aria-apg-coverage` for review. No pull request, package publication, downstream update, issue closure, or merge was performed.

Reviewed the complete W3C Authoring Practices Guide [pattern index](https://www.w3.org/WAI/ARIA/apg/patterns/), [Practices index](https://www.w3.org/WAI/ARIA/apg/practices/), and the linked pattern and practice guidance. Schema 4 adds an exact, ordered coverage contract for all 30 current APG patterns and seven Practices. Twenty-five entries map to dedicated patterns, four map to native semantic baselines, and button maps to a composed contract. Every entry has a canonical direct source trace, and no current APG entry remains deferred.

Added dedicated feed, grid, meter, toggle-button, treegrid, and window-splitter contracts, plus eleven cross-cutting semantic contracts for accessible descriptions, busy state, collection metadata, composite focus, current state, disabled/read-only state, hidden/inert content, pressed state, range values, sort state, and presentational roles. Existing pattern and semantic contracts were strengthened for accessible naming and description, landmark structure, keyboard and focus behavior, static-table versus interactive-grid boundaries, live updates, value and collection metadata, modal inertness, and native-first host-language behavior.

The authority model now distinguishes the normative HTML Standard, ARIA in HTML, WCAG 2.2, and WAI-ARIA 1.2 sources from informative Understanding WCAG and APG guidance. Published schemas and runtime validation pin canonical source ordering, identifier/URL pairs, direct APG traces, the exact 80-slug UI catalog, and generated manifest inventories. Malformed or mismatched provenance fails closed, and APG completeness is not represented as a WCAG conformance claim.

Typed applicability now uses closed enum facts for collection, table, separator, bounded-value display, and toggle models. Static lists and tables are not promoted to composite widgets without explicit intent; missing discriminators remain candidates, and invalid or out-of-domain values fail. The projected UI binding artifact embeds the 47-fact catalog, and its digest includes both mappings and fact definitions so enum-domain changes invalidate stale projections.

## Adversarial review

The semantic review retraced the APG pattern and Practices indexes and their linked guidance against ARIA in HTML, WAI-ARIA 1.2, and the HTML and WCAG requirements already represented by the contract. It found no additional coverage omission or authority mismatch requiring a broader model change. Window splitter remains explicitly bounded by APG's caveated example status; the repository does not overstate APG guidance as normative conformance.

| ID | Severity | Finding | Resolution and regression evidence |
| --- | --- | --- | --- |
| AR-01 | Medium | A deeper 27,631-case malformed-input sweep found 39 paths where a null root or applicability row could leak JavaScript `TypeError` text. Direct probes found the same failure class at the exported matrix, binding, expression, and evaluation seams. | Added narrow object/array guards at the existing validation and applicability entry points. Null roots, rows, bindings, candidates, and expressions now produce stable domain `Error` messages. The focused public-helper probe reports zero raw internal errors, and the new regression test covers each repaired seam. |

The major contract target is now package `4.0.0`, schema 4. Final validation reports 79 semantic records, 34 pattern contracts, 38 applicability rows, and 80 UI bindings. `pnpm check`, `pnpm contract:version:check`, all 65 unit tests, release-preflight self-tests, and `pnpm build` passed; the build produced 118 records across both consumer profiles. Manifest and inventory truncation and substitution checks fail closed as intended. The regenerated wiki graph contains 24 nodes and 114 edges, and the wiki integrity check passed.

Updated the [standards authority](../topics/standards-authority.md), [semantic and pattern model](../topics/semantic-pattern-model.md), [UI pattern bindings](../topics/ui-pattern-bindings.md), and [consumer projections](../topics/consumer-projections.md) records to preserve the rationale and compatibility boundary for future work.
