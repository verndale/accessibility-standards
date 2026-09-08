# Accessibility Standards

`@verndale/accessibility-standards` is Verndale's canonical, versioned authority for accessibility semantics, interaction patterns, applicability decisions, and evidence routing.

UI Design Brain remains the separate authority for canonical UI pattern names and aliases. This package pins its catalog manifest and projects a validated binding from canonical UI slugs to accessibility pattern and capability-filtered baseline semantic IDs. The binding classifies every catalog slug as `direct`, `candidate`, or `baseline-only`; aliases and free-form Markdown never enter applicability evaluation.

The package projects the same source records into two purpose-specific profiles:

- `conductor` — Functional Specification and Acceptance Criteria contracts.
- `ai-orchestration` — implementation, testing, and review Build Pack contracts.

Consumers pin an exact package version and commit a config, route map, and generated provenance. Generated outputs are deterministic and carry a do-not-edit marker plus source/config/route digests.

The current schema-4 projection targets `@verndale/accessibility-standards@4.0.0`. Schema 4 retains complete semantic traceability for all 55 WCAG 2.2 Level A/AA criteria and adds the HTML `inert` contract, ARIA in HTML author-conformance authority, plus an explicit inventory for all 30 entries in the WAI-ARIA APG pattern index and all seven entries in its Practices index. Missing composite widgets, cross-cutting semantic rules, and fail-closed UI discriminators are now part of the versioned contract; no current APG pattern remains deferred.

## Commands

```sh
pnpm verify:ci
pnpm build
pnpm exec accessibility-standards sync --config accessibility-standards.config.json
pnpm exec accessibility-standards sync --if-needed --config accessibility-standards.config.json
pnpm exec accessibility-standards check --config accessibility-standards.config.json
```

See [authoring](docs/authoring.md), the [projection contract](docs/projection-contract.md), and [versioning](docs/versioning.md).
