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
