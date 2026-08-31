---
date: 2026-08-31
topics: [ui-pattern-bindings, consumer-projections, sync-and-enforcement]
plans: [2026-08-30-shared-accessibility-standards-delivery.md]
issue: https://github.com/verndale/accessibility-standards/issues/9
issues: ["https://github.com/verndale/accessibility-standards/issues/9", "https://github.com/verndale/ai-orchestration/issues/609"]
pr: https://github.com/verndale/accessibility-standards/pull/11
---
# Schema-2 UI projector maintenance

Prepared `@verndale/accessibility-standards@2.0.1` from the `v2.0.0` schema-2
line. It retains the schema, records, matrix, and UI catalog/manifest digests,
but updates the exact UI Design Brain projector provenance to public `1.16.1`.

The release configuration now supports a `2.x` maintenance branch and npm
channel. This keeps the patch release available to exact-pinned schema-2
consumers without changing the schema-3 package on `latest`. COS and
ai-orchestration continue to reject mixed projector/binding provenance rather
than treating the patch version as implicitly compatible.

[PR 11](https://github.com/verndale/accessibility-standards/pull/11) merged the
maintenance contract into `2.x`, and the subsequent verified release published
[`2.0.1`](https://github.com/verndale/accessibility-standards/releases/tag/v2.0.1)
on npm's `release-2.x` channel while retaining `3.0.0` on `latest`. Duplicate
cross-major PRs [10](https://github.com/verndale/accessibility-standards/pull/10)
and [12](https://github.com/verndale/accessibility-standards/pull/12) were closed;
PR automation now excludes the long-lived `2.x` branch so schema-2 maintenance
cannot be proposed automatically against schema-3 `main`.

The automation exclusion is delivered as schema-2 patch `2.0.2`, following the
repository policy that CI and editorial corrections advance the package
contract. It does not change the accessibility schema, authority records, UI
catalog version, binding manifest, or compatibility semantics introduced by
`2.0.1`. Commitlint, quality, and wiki-integrity checks now run for pull
requests targeting either `main` or `2.x`.

Maintenance feature branches use `codex/2.x-*`; the draft-PR workflow routes
that prefix to `2.x` instead of its normal `main` target. This makes both the
long-lived branch exclusion and the maintenance PR base deterministic.
