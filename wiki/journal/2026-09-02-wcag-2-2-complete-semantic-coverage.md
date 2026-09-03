---
date: 2026-09-02
topics: [semantic-pattern-model, standards-authority, consumer-projections]
plans: [2026-09-02-phase-3-complete-wcag-2-2-a-aa-semantic-coverage-3-2-0-29791704c5.md]
issue: https://github.com/verndale/accessibility-standards/issues/20
branch: codex/gh-20-wcag-2-2-complete-semantic-coverage
---
# Complete WCAG 2.2 A/AA semantic coverage

Opened [issue 20](https://github.com/verndale/accessibility-standards/issues/20) with the `enhancement` and `documentation` labels and created the local branch `codex/gh-20-wcag-2-2-complete-semantic-coverage` from the fetched `origin/main`. The additive `3.2.0` delivery retains schema generation 3. The initial implementation excluded repository publication; a follow-up authorization committed and pushed the issue branch while pull-request creation, npm publication, and downstream consumer upgrades remain out of scope.

Added 18 criterion-specific semantic obligations to close the previous eight partial and ten gap entries. The WCAG 2.2 Level A/AA inventory now contains 55 covered, zero partial, and zero gap criteria. Every new obligation carries paired normative WCAG and informative Understanding references, criterion-specific conditions and exceptions, and its declared proof lanes. Formerly partial criteria retain their existing mapped IDs alongside the new complete semantic IDs.

The applicability model remains fail-closed and now combines existing broad artifact and component triggers with seven precise boolean facts for prerecorded audio-only, prerecorded video-only, prerecorded synchronized audio, prerecorded synchronized video, live synchronized audio, autoplay audio over three seconds, and user-information fields. Ten new routing rows preserve media-mode independence: false facts skip, missing facts require input, and incorrectly typed values fail validation.

The resulting authority source contains 68 semantics, 28 patterns, 38 applicability rows, 43 facts, and 80 UI bindings. Existing semantic and pattern IDs, requirements, UI bindings, and the deferred grid and treegrid entries are unchanged. Both profiles project the new records and complete coverage deterministically; generated `dist/` remains uncommitted.

Review against the normative WCAG 2.2 Recommendation confirmed the 18 new semantic contracts retain their criterion conditions and exceptions. The review also removed a stale `3.1.1` pin from packed-consumer verification by deriving the pin from current package metadata, and expanded the routing tests to prove every media discriminator remains independent and rejects invalid types.

Verification passed contract-version validation, source validation, all 53 unit tests, release-preflight self-tests, packed-tarball consumer installation, and the distribution build of 101 records across two profiles. Wiki and graph checks passed after archiving the plan and updating the semantic-pattern topic.
