---
status: "implemented"
executed: true
evidence: ["GitHub issue https://github.com/verndale/accessibility-standards/issues/17; src/applicability/ui-design-brain-bindings.yml; pnpm check; node --test tests/unit/contracts.test.mjs; pnpm build"]
source_tool: "repository"
source: "/private/tmp/accessibility-standards-gh-17-plan.md"
topics: ["ui-pattern-bindings"]
digest: "2666644a2c9c8c96cd6d96fa14aee1e3340f581dd8565a696d007833122d50af"
---

# Schema-3 UI Projector Provenance Alignment

## Goal

Align the schema-3 accessibility binding with the public UI Design Brain
`1.16.1` projector already adopted by both consumers, without weakening exact
provenance validation or changing catalog authority and digest evidence.

## Implementation

1. Change the schema-3 binding source to projector `1.16.1`.
2. Update the binding schema constant and runtime validator together.
3. Update projection and rejection tests so `1.16.1` is emitted and the stale
   `1.16.0` provenance fails closed.
4. Preserve schema 3, catalog authority `1.15.1`, catalog bytes, and source and
   manifest digests.
5. Record the release-line correction in the wiki and validate the graph.

## Verification

- `pnpm check`
- `node --test tests/unit/contracts.test.mjs`
- `pnpm build`
- `pnpm verify:ci`
- `pnpm wiki:check`
- `pnpm graph:check`

## Release boundary

Prepare and push a reviewable source branch. Merging and publishing the patch
release remain separate authorized actions. Consumer migrations resume only
after the corrected schema-3 package is available from npm.
