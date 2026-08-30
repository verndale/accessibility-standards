---
aliases: [accessibility sync, generated projection, hooks]
covers: []
---
# Sync and enforcement

Consumer hooks execute only the exact lockfile-installed package. `sync --if-needed` compares source, config, route, and output digests; it performs no network or upgrade operation. Rendering occurs in temporary storage and only marker-owned, unmodified targets may be promoted. `check` is read-only and blocks stale or invalid projections.

Source CI uses Node 24.14.0, pnpm 11.1.1, full history, deterministic verification, clean tarball installation, and public semantic-release publication with provenance. Wiki writers use reviewable `bot/wiki-*` PRs.

Related: [consumer projections](./consumer-projections.md) and the [delivery plan](../plans/2026-08-30-shared-accessibility-standards-delivery.md).
