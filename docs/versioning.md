# Versioning

- Authority, behavior, schema changes, or ID removals are major.
- Additive stable records are minor.
- Editorial-only corrections are patch.

Consumers accept only compatible package/profile/schema versions. Older same-major source contracts may use only IDs available in that version. Newer sources and major mismatches fail closed. Legacy unstamped artifacts warn; new or revised artifacts require a contract.
