---
status: "implemented"
executed: true
evidence: ["GitHub issue https://github.com/verndale/accessibility-standards/issues/6", "Local branch codex/gh-6-wcag-2-2-pattern-expansion", "src/coverage/wcag-2.2.yml", "pnpm verify:ci"]
source_tool: "codex"
source: "Codex task: WCAG 2.2 Coverage and Pattern Expansion"
topics: ["standards-authority", "semantic-pattern-model", "ui-pattern-bindings", "consumer-projections"]
digest: "9afa9d1d04b7ee1546d6e67a6ffe1c8b1ecacd129d84dccb0d9e60efa06e6c39"
---

# WCAG 2.2 Coverage and Pattern Expansion

## Summary

Create one GitHub feature issue covering a v3 contract correction and a bounded first implementation batch. The repository currently has 19 interaction patterns, 25 semantic rules, 19 applicability rows, and 80 UI bindings, but no criterion-level mapping to the 55 WCAG 2.2 Level A/AA success criteria.

## GitHub Issue and Branch

- Repository: `verndale/accessibility-standards`
- Title: `[Feature] Expand accessibility patterns with WCAG 2.2 coverage`
- Labels: `enhancement`, `documentation`
- Use the issue creator’s required five-section body:
  - `Summary`: Establish WCAG traceability, correct inaccurate WCAG 2.2 mappings, and add the first high-confidence APG patterns.
  - `Context`: Document current record counts and cite [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [Understanding WCAG 2.2](https://www.w3.org/WAI/WCAG22/Understanding/), and the [WAI-ARIA APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/).
  - `Details`: Include the implementation work below.
  - `Expected Outcome`: Require validated criterion coverage, accurate applicability, reachable patterns, generated artifacts, and passing checks.
  - `Additional Notes`: Mark the work as a v3 breaking contract change; clarify that WCAG is normative while Understanding and APG are informative.
- Verify both labels after filing.
- Derive the issue number from the returned URL, then create local branch `codex/gh-<issue-number>-wcag-2-2-pattern-expansion` from the verified latest `main`.
- Do not push the branch, commit, or open a pull request.

## Implementation Contract Recorded in the Issue

- Introduce schema/package/profile version 3 with normalized per-record standards references and criterion level, URL, authority, and normative status.
- Add a 55-entry WCAG 2.2 A/AA coverage inventory to the existing coverage manifest, classifying each criterion as covered, partial, or gap and linking it to applicable semantic IDs.
- Add the Understanding collection as an informative source, render references and pattern activation in generated Markdown, and replace hard-coded record counts with coverage and reachability invariants.
- Correct these WCAG 2.2 mappings with dedicated semantics and evidence:
  - 2.5.7 Dragging Movements
  - 3.2.6 Consistent Help
  - 3.3.7 Redundant Entry
  - 3.3.8 Accessible Authentication
- Explicitly map and strengthen existing coverage for 2.4.11 Focus Not Obscured and 2.5.8 Target Size.
- Add six APG-backed patterns:
  - `pattern.menu`
  - `pattern.tree-view`
  - `pattern.radio-group`
  - `pattern.slider`, with multi-thumb behavior as a product decision
  - `pattern.spinbutton`
  - `pattern.checkbox`
- Update existing UI bindings for context/dropdown menus, tree view, radio button, slider, number input, stepper, and checkbox. Preserve generic field semantics where they remain applicable.
- Record remaining WCAG gaps and deferred APG candidates—such as grid/treegrid, toolbar, switch, and alert dialog—in the coverage inventory rather than adding weak or ambiguous mappings.

## Test and Acceptance Plan

- Validate standards-reference schemas, all 55 unique A/AA criteria, coverage statuses, and referenced record IDs.
- Test each corrected applicability rule for applicable, inapplicable, missing-fact, and invalid-type cases.
- Test new direct/candidate bindings, semantic dependencies, pattern reachability, and evidence lanes.
- Verify generated JSON and Markdown include references, activation, coverage data, and remain deterministic.
- Run `pnpm verify:ci`, `pnpm wiki:check`, and `pnpm graph:check`.
- Complete the repository’s required plan archive and wiki journal updates with the implementation.

## Assumptions

- The issue remains one umbrella issue for the audit plus first implementation batch.
- Breaking corrections are intentionally delivered as v3 rather than constrained to additive v2 changes.
- Native HTML and baseline semantics remain preferred; patterns are added only for distinct interaction behavior.
- The branch remains local until implementation is committed or a pull request is requested.
