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

The source branch prepares a reviewable patch. Consumer migrations remain
blocked on publication of the corrected schema-3 package; no consumer bypass
or downgrade is accepted.

## Verification

`pnpm check`, the focused contract suite, and `pnpm build` pass before the full
CI and wiki gates.
