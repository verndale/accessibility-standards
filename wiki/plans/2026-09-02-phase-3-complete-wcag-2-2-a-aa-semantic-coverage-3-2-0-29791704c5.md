---
status: "implemented"
executed: true
evidence: ["GitHub issue https://github.com/verndale/accessibility-standards/issues/20", "src/coverage/wcag-2.2.yml: 55 covered, 0 partial, 0 gap", "pnpm check, pnpm test, and pnpm build passed"]
source_tool: "codex"
source: "Codex task: Phase 3 Complete WCAG 2.2 A/AA Semantic Coverage"
topics: ["semantic-pattern-model"]
digest: "29791704c5fedffb860142f7e4f5fbc108469d3e89de326ec42338b57681784d"
---

# Phase 3: Complete WCAG 2.2 A/AA Semantic Coverage (`3.2.0`)

## Delivery setup

- Create a feature issue in `verndale/accessibility-standards` using the repository's deterministic five-section template and the `enhancement` and `documentation` labels.
- Verify the issue and labels, then create `codex/gh-<issue-number>-wcag-2-2-complete-semantic-coverage` from the fetched `origin/main`.
- Do not push, commit, open a pull request, publish the package, or update consumers.

## Summary

Deliver an additive schema-3 release that moves the WCAG inventory from 37 covered, 8 partial, and 10 gaps to 55 covered, 0 partial, and 0 gaps. Preserve every existing semantic and pattern ID; add 18 criterion-specific semantics, seven boolean applicability facts, and ten routing rows based on the normative WCAG 2.2 Recommendation.

Target totals are 68 semantics, 28 patterns, 38 applicability rows, 43 facts, and 80 UI bindings.

## Semantic contracts

Add version-`1.0.0` records for:

- `semantics.non-text-content` (1.1.1; axe, human)
- `semantics.media.prerecorded-audio-video-only-alternatives` (1.2.1; E2E, human)
- `semantics.media.captions-prerecorded` (1.2.2; E2E, human)
- `semantics.media.audio-description-or-alternative-prerecorded` (1.2.3; E2E, human)
- `semantics.media.captions-live` (1.2.4; E2E, human)
- `semantics.media.audio-description-prerecorded` (1.2.5; E2E, human)
- `semantics.info-relationships` (1.3.1; axe, human)
- `semantics.meaningful-sequence` (1.3.2; E2E, human)
- `semantics.sensory-characteristics` (1.3.3; human)
- `semantics.orientation` (1.3.4; E2E, human)
- `semantics.input-purpose` (1.3.5; axe, human)
- `semantics.use-of-color` (1.4.1; human)
- `semantics.audio-control` (1.4.2; E2E, human)
- `semantics.resize-text` (1.4.4; E2E, human)
- `semantics.images-of-text` (1.4.5; human)
- `semantics.flash-threshold` (2.3.1; E2E, human)
- `semantics.headings-labels-purpose` (2.4.6; human)
- `semantics.input-labels-instructions` (3.3.2; axe, human)

Every requirement preserves the complete normative condition and exceptions, including non-text special cases, media-alternative exceptions, unconditional Level AA prerecorded audio description, essential orientation, the three-second autoplay threshold, 200-percent text resizing, image-of-text exceptions, and general/red flash thresholds. Pair every normative WCAG citation with its informative Understanding document.

## Applicability and coverage

Add boolean facts for prerecorded audio-only, prerecorded video-only, prerecorded synchronized audio, prerecorded synchronized video, live synchronized audio, autoplay audio over three seconds, and fields collecting information about the user.

Add ten fail-closed rows. Reuse existing non-text, page-context, rendered-interface, and form-field facts for general safeguards. Use the new facts for exact media-mode and input-purpose activation. Missing facts return `needs_input`, false facts skip, and invalid values fail validation.

Mark every coverage row `covered` and remove shortfall notes. Formerly partial rows retain their existing mapped semantic IDs and add the new complete semantic ID. Keep schema version 3, patterns, UI bindings, existing requirements, and the deferred grid/treegrid backlog unchanged.

## Versioning, testing, and wiki

- Update package, contract, profiles, schemas, validator constants, fixtures, and documentation from `3.1.1` to `3.2.0`.
- Project the new semantics, facts, rows, citations, and 55/0/0 coverage inventory deterministically into both profiles; keep `dist/` uncommitted.
- Pin exact counts and semantic clauses; test applicable, inapplicable, missing, mixed-media, and invalid-type routes; verify versioned schemas, sync, JSON, and Markdown projections.
- Run contract version, source validation, unit, build, wiki, and graph checks.
- Archive this plan, add a dated journal entry, update the semantic-pattern topic, rebuild the graph, and validate the wiki in the same delivery.

## Assumptions

The work is limited to the authority package and its tracking issue. npm publication, downstream COS or ai-orchestration adoption, new APG patterns, UI bindings, pushes, commits, and pull requests are outside this delivery.
