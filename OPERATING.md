# Operating contract

Source records under `src/` are canonical package inputs. Each standards reference declares whether its authority is normative; WCAG Understanding and APG guidance remain informative. Patterns reference semantic IDs rather than restating conformance rules, and the WCAG coverage inventory makes partial coverage and gaps explicit. `dist/` and consumer projections are generated and are never edited manually.

UI Design Brain owns canonical UI names and aliases, not accessibility obligations. `src/applicability/ui-design-brain-bindings.yml` is the accessibility-owned, exact-version bridge. Only canonical `component.ui_pattern_ids` enter the resolver; aliases are resolved by the UI catalog first, unknown IDs fail closed, and candidate mappings ask only for their declared typed discriminator facts.

Changes must pass schema, dependency, applicability, projection, deterministic rendering, and wiki checks. A package upgrade is explicit; sync hooks only use the exact installed lockfile version and never contact a registry.
