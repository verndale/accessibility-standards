# Versioning

- Authority, behavior, schema changes, or ID removals are major.
- Additive stable records are minor.
- Editorial-only corrections are patch.

Consumers accept only compatible package/profile/schema versions. Older same-major source contracts may use only IDs available in that version. Newer sources and major mismatches fail closed. Legacy unstamped artifacts warn; new or revised artifacts require a contract.

The UI Design Brain binding and schema-2 projection target package/profile version `2.0.2`. Version `1.0.0` was tagged before this binding existed and must never be used as provenance for generated binding outputs. A UI catalog version or manifest-digest change is an explicit dependency upgrade; a binding authority or schema change follows this package's major-version policy.

Schema-2 maintenance work branches from `2.x` and uses the `codex/2.x-*`
branch prefix. Draft-PR automation routes that prefix back to `2.x`; other
feature branches target `main`. Neither long-lived release branch is itself a
pull-request source.
