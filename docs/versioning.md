# Versioning

- Authority, behavior, schema changes, or ID removals are major.
- Additive stable records are minor.
- Editorial-only corrections are patch.

Consumers accept only compatible package/profile/schema versions. Older same-major source contracts may use only IDs available in that version. Newer sources and major mismatches fail closed. Legacy unstamped artifacts warn; new or revised artifacts require a contract.

The criterion-reference and WCAG coverage contract established schema 3 at `3.0.0`; the current additive package/profile target is `3.1.0` and retains schema 3. Schema 2 at `2.0.0` introduced deterministic UI Design Brain bindings but cannot express criterion-level provenance or coverage status. Version `1.0.0` predates those bindings and must never be used as provenance for generated binding outputs. A UI catalog version or manifest-digest change is an explicit dependency upgrade; a binding authority or schema change follows this package's major-version policy.
