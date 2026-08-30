# Accessibility Standards

`@verndale/accessibility-standards` is Verndale's canonical, versioned authority for accessibility semantics, interaction patterns, applicability decisions, and evidence routing.

The package projects the same source records into two purpose-specific profiles:

- `conductor` — Functional Specification and Acceptance Criteria contracts.
- `ai-orchestration` — implementation, testing, and review Build Pack contracts.

Consumers pin an exact package version and commit a config, route map, and generated provenance. Generated outputs are deterministic and carry a do-not-edit marker plus source/config/route digests.

## Commands

```sh
pnpm verify:ci
pnpm build
pnpm exec accessibility-standards sync --config accessibility-standards.config.json
pnpm exec accessibility-standards sync --if-needed --config accessibility-standards.config.json
pnpm exec accessibility-standards check --config accessibility-standards.config.json
```

See [authoring](docs/authoring.md), the [projection contract](docs/projection-contract.md), and [versioning](docs/versioning.md).
