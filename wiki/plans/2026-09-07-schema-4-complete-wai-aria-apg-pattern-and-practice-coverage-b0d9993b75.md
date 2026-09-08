---
status: "implemented"
executed: true
evidence: ["GitHub issue https://github.com/verndale/accessibility-standards/issues/22", "Branch codex/22-complete-aria-apg-coverage from main 46a842860c24376ca07be464f6b1367aaa5396ec", "src/coverage/aria-apg.yml: 30 patterns and 7 practices with no current deferrals", "Adversarial review: a 27,631-case malformed-input sweep found 39 raw internal-error paths; guarded entry points and focused regressions now return domain errors", "pnpm check and pnpm contract:version:check passed", "pnpm test: 65 unit tests and release-preflight self-tests passed", "pnpm build: 118 records across 2 profiles", "Wiki graph: 24 nodes and 114 edges; wiki integrity passed"]
source_tool: "codex"
source: "Codex task: Complete WAI-ARIA APG pattern and practice coverage"
topics: ["standards-authority", "semantic-pattern-model", "ui-pattern-bindings", "consumer-projections"]
digest: "b0d9993b75fe820cb054a4d4b09817993ffd6c775487fa217c50694247b9589e"
---

# Schema 4: Complete WAI-ARIA APG Pattern and Practice Coverage

## Delivery setup

- Track the work in [verndale/accessibility-standards issue 22](https://github.com/verndale/accessibility-standards/issues/22), labeled `enhancement` and `documentation`.
- Implement on `codex/22-complete-aria-apg-coverage`, created from the unchanged `main` commit `46a842860c24376ca07be464f6b1367aaa5396ec`.
- Keep all work local and reviewable. Do not push, commit, open a pull request, publish the package, or update downstream consumers unless separately requested.

## Objective

Make this repository explicitly and verifiably cover every entry in the current WAI-ARIA Authoring Practices Guide pattern and practice indexes. The result must remain native-first, distinguish normative requirements from informative APG guidance, fail closed when component intent is ambiguous, and project deterministically to both consumer profiles.

Completion means:

- all 30 APG pattern-index entries resolve to a dedicated pattern, a composed contract, or an explicit native semantic baseline;
- all seven APG Practices entries resolve to semantic contracts with canonical source traceability;
- no APG pattern remains deferred;
- new and revised contracts encode naming, role/state, keyboard, focus, selection, value, ownership, visibility, and live-update behavior precisely enough to implement and test;
- schema, runtime validation, projections, documentation, versioning, tests, build output, and wiki history agree.

## Authority and conformance model

- Add [ARIA in HTML](https://www.w3.org/TR/html-aria/) as a normative author-conformance authority.
- Retain WCAG 2.2 and WAI-ARIA 1.2 as normative requirements.
- Retain the [APG patterns](https://www.w3.org/WAI/ARIA/apg/patterns/) and [APG Practices](https://www.w3.org/WAI/ARIA/apg/practices/) as informative implementation guidance.
- Preserve the native-first rule: use native HTML when it supplies the required semantics and interaction; use ARIA only where the host language cannot express the needed contract.
- Validate canonical authority metadata, identifiers, URLs, normative flags, source ordering, and reference sorting. Unknown or mismatched sources fail closed.

## Explicit APG coverage inventory

Add a versioned `src/coverage/aria-apg.yml` contract and JSON Schema. Pin the canonical pattern and practice indexes and require exact, ordered, duplicate-free coverage.

Pattern entries are classified as:

- `dedicated-pattern` when one pattern record owns the APG interaction contract;
- `composed` when a specialized pattern and shared semantics jointly cover the entry;
- `baseline-semantics` when native elements and atomic semantics are the correct implementation instead of a custom widget contract.

Runtime validation must reject omissions, unknown records, invalid classifications, wrong ordering, noncanonical URLs, false APG provenance, and a dedicated/composed classification whose mapped records do not match its declared shape. Project the inventory into `coverage-manifest.json` and both human-readable profile outputs.

## Pattern contracts

Add dedicated contracts for:

- `pattern.feed`
- `pattern.grid`
- `pattern.meter`
- `pattern.toggle-button`
- `pattern.treegrid`
- `pattern.window-splitter`

The new contracts must include complete scope boundaries, native alternatives, semantic dependencies, activation facts, keyboard and focus behavior, state/value synchronization, product decisions, Functional Specification bindings, implementation outcomes, and unit/axe/E2E/human evidence routes where applicable.

Strengthen the existing accordion, disclosure, alert, dynamic status, carousel, menu button, pagination, tabs, dialog, popover, tooltip, combobox, listbox, progress, field, validation, image, and media-player contracts. Keep APG-backed patterns aligned to their canonical pattern pages and keep repository-specific patterns tied to normative WCAG or WAI-ARIA sources without inventing APG provenance.

Critical distinctions include:

- grids and treegrids are composite widgets, not substitutes for static data tables;
- a feed manages article position/set metadata and busy updates without stealing reading focus;
- a meter reports a bounded scalar measurement and is not progress;
- a toggle button keeps its accessible label stable and exposes `aria-pressed`;
- a window splitter exposes orientation and bounded value while preserving access to both panes;
- modal dialogs make outside content inert and contain focus; nonmodal popovers do not claim modal behavior;
- live statuses and alerts are announced without moving focus unless a separate interaction requires it.

## Cross-cutting semantic contracts

Add semantic records for:

- accessible descriptions;
- busy state;
- collection metadata;
- composite focus;
- current state;
- disabled and read-only state;
- hidden and inert content;
- pressed state;
- range values;
- sort state;
- presentational roles.

Strengthen existing accessible-name, landmark, native-element, data-table, role/state/property, keyboard, focus, and selection semantics where the Practices guidance adds implementable constraints. Capture the full linked Practices guidance for landmark regions, names and descriptions, keyboard interfaces, grid/table properties, range-related properties, structural roles, and hiding semantics.

Every new semantic must be reachable from a pattern, a UI baseline, or an applicability row. Any semantic with a WCAG citation must be included in the corresponding WCAG coverage row, and every normative WCAG citation must retain its paired Understanding reference.

## Applicability and UI Design Brain bindings

Add typed, fail-closed discriminator facts for collection, table, separator, value-display, and toggle models. Bind the existing canonical UI Design Brain slugs without changing that external vocabulary:

- `list` selects feed only when its collection model is `feed`;
- `table` selects grid or treegrid only when its table model explicitly identifies the interactive widget;
- `separator` selects window splitter only when explicitly adjustable;
- `stat` selects meter only when it represents a bounded measurement;
- `toggle` selects toggle button or switch from the declared toggle model while retaining its field baseline.

Missing discriminator values remain `candidate`/`needs_input`; known nonmatching values skip specialization; invalid types or out-of-domain enum values fail validation. Static lists and tables must never be silently promoted to composite widgets.

## Versioning and projections

Treat the authority, behavior, schema, semantic-ID, pattern-ID, fact, binding, and manifest changes as a major release:

- bump package and profile contracts from `3.2.0` to `4.0.0`;
- bump the contract schema from 3 to 4;
- update package metadata, contract/profile/config/manifest schemas, validator constants, fixtures, sync expectations, and versioning/projection documentation together;
- include APG coverage in the common source digest and provenance so any coverage change invalidates stale projections;
- retain stable existing IDs and preserve deterministic serialization and projection ordering.

## Verification

Add focused tests that prove:

- the APG manifest structurally validates and contains exactly 30 patterns and seven practices in canonical order;
- every coverage record exists and has a canonical source trace;
- all new patterns are reachable and preserve their APG-specific keyboard, focus, state, and native-first distinctions;
- every new discriminator resolves, skips, needs input, and rejects invalid values as designed;
- no WCAG/APG deferred patterns remain;
- every semantic-to-WCAG mapping remains bidirectional and complete;
- generated JSON and Markdown expose identical APG coverage with deterministic provenance;
- package, profile, schema, sync, manifest, source digest, and clean-distribution contracts all target 4.0.0/schema 4.

Run `pnpm contract:version:check`, `pnpm check`, `pnpm test`, and `pnpm build`, plus focused schema and behavior tests. Review the final diff for unrelated changes and generated-output leakage.

## Wiki delivery

Archive this plan in `wiki/plans/`, add a dated journal entry, and update the standards-authority, semantic-pattern-model, UI-pattern-bindings, and consumer-projections topics. Rebuild the wiki graph and run `node scripts/wiki/check.cjs` in the same delivery. The journal must link issue 22, the branch, exact changed contract areas, and verification evidence.

## Risks and controls

- APG is informative and must not be mislabeled as normative; source validation enforces the boundary.
- ARIA can reduce native semantics when misapplied; native-element and ARIA-in-HTML rules guard host-language conformance.
- Composite widgets have large keyboard surfaces; behavior-specific tests pin focus movement, selection, expansion, editing, and boundary behavior.
- UI pattern names alone can be ambiguous; typed discriminators prevent static content from receiving interactive roles.
- New manifest fields break consumers that assume schema 3; the major version and schema bump makes the incompatibility explicit.
- The APG window-splitter example remains work in progress; the contract follows the published pattern specification and marks product decisions that cannot be inferred.

## Out of scope

- Publishing `4.0.0` to npm.
- Pushing the branch, committing, opening or merging a pull request, or closing issue 22.
- Updating `ui-design-brain`, COS, ai-orchestration, or any other downstream consumer.
- Claiming WCAG conformance from automated checks alone.
