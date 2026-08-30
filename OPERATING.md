# Operating contract

Source records under `src/` are normative. Patterns reference semantic IDs; they do not restate semantic rules. `dist/` and consumer projections are generated and are never edited manually.

UI Design Brain owns canonical UI names and aliases, not accessibility obligations. `src/applicability/ui-design-brain-bindings.yml` is the accessibility-owned, exact-version bridge. Only canonical `component.ui_pattern_ids` enter the resolver; aliases are resolved by the UI catalog first, unknown IDs fail closed, and candidate mappings ask only for their declared typed discriminator facts.

Changes must pass schema, dependency, applicability, projection, deterministic rendering, and wiki checks. A package upgrade is explicit; sync hooks only use the exact installed lockfile version and never contact a registry.
