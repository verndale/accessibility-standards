---
date: 2026-08-31
topics: [ui-pattern-bindings]
plans: [2026-08-31-schema-3-ui-projector-provenance-alignment-2666644a2c.md]
issue: https://github.com/verndale/accessibility-standards/issues/17
branch: codex/gh-17-schema-3-ui-projector-provenance
---
# Schema-3 UI projector provenance alignment

## Why

The `3.1.0` schema-3 release retained UI Design Brain projector provenance
`1.16.0`, while COS and ai-orchestration intentionally pin the public `1.16.1`
projector. Both consumers rejected the mixed state as designed. Downgrading the
consumers or relaxing exact version and digest checks would reverse the public
projector migration and weaken deterministic provenance.

## What changed

The schema-3 binding source, JSON Schema constant, runtime validator, and
projection tests now require `1.16.1`. A negative mutation test proves stale
`1.16.0` provenance is rejected. Catalog authority `1.15.1`, the 80-entry
catalog, source and manifest digests, schema 3, and Phase 2 coverage are
unchanged.

## Release boundary

The provenance correction computes patch release `3.1.1`. The implementation
PR exposed the release preflight's target-version guard because the package,
profile, schema, and projection constants still declared `3.1.0`. Follow-up
branch `codex/gh-17-release-3-1-1` aligns those exact version surfaces so the
release can publish without weakening the guard. Consumer migrations remain
blocked until npm serves the corrected artifact; no consumer bypass or
downgrade is accepted.

## Verification

`pnpm release:preflight`, `pnpm verify:ci`, `pnpm wiki:check`, and
`pnpm graph:check` cover the combined provenance and release-target change.
The full CI verifier now begins with release preflight, so future source PRs
cannot merge a conventional release whose declared package contract disagrees
with the computed next version. The versioning guide also records the exact
consumer pin, sync, runtime-gate, and verification sequence.
