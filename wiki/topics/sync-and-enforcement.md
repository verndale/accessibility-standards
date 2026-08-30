---
aliases: [accessibility sync, generated projection, hooks]
covers: []
---
# Sync and enforcement

Consumer hooks execute only the exact lockfile-installed package. `sync --if-needed` compares common authority, profile, config, route, and output digests; it performs no network or upgrade operation. Rendering occurs in temporary storage and only marker-owned, unmodified targets may be promoted. Every provenance sidecar has a self-integrity digest, so editing the marked sidecar is refused just like editing any other managed output. Promotion is transactional and restores all prior bytes on failure. `check` is read-only and blocks stale or invalid projections.

The UI Design Brain catalog follows the same explicit-upgrade model. Raw cron copying is not part of the consumer contract. A reviewed version change updates the catalog pin and source-manifest digest; sync then repairs the generated catalog/binding outputs from installed packages. Binding checks reject unknown UI IDs, incomplete 80-slug coverage, undeclared candidate facts, stale projections, or source/binding digest mismatches.

Source CI uses Node 24.14.0, pnpm 11.1.1, full history, deterministic verification, clean tarball installation, and public semantic-release publication with provenance. Release preflight computes the next version from the full post-tag commit range and requires it to equal `package.json` and `src/contract.yml`; `prepack` rechecks package, schema, and both profile versions after semantic-release preparation. The `2.0.0` merge therefore requires a conventional breaking squash title such as `feat(standards)!: add deterministic UI pattern accessibility bindings`. The original `v1.0.0` publication [failed in GitHub Actions](https://github.com/verndale/accessibility-standards/actions/runs/33325307696): npm OIDC returned package-not-found and fallback authentication returned `EOTP`. The tag exists while the npm package is absent. The replacement workflow uses tokenless npm trusted publishing modeled on ui-design-library; the one-time `1.0.0` bootstrap and npm trusted-publisher configuration remain external release steps. Schema 2 and the UI binding target the subsequent breaking `2.0.0` package/profile contract. Wiki writers use reviewable `bot/wiki-*` PRs.

Related: [UI pattern bindings](./ui-pattern-bindings.md), [consumer projections](./consumer-projections.md), and the [delivery plan](../plans/2026-08-30-shared-accessibility-standards-delivery.md).
