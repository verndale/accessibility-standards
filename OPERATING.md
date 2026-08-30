# Operating contract

Source records under `src/` are normative. Patterns reference semantic IDs; they do not restate semantic rules. `dist/` and consumer projections are generated and are never edited manually.

Changes must pass schema, dependency, applicability, projection, deterministic rendering, and wiki checks. A package upgrade is explicit; sync hooks only use the exact installed lockfile version and never contact a registry.
