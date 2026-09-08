---
aliases: [Conductor projection, ai-orchestration projection, accessibility sidecar]
covers: []
---
# Consumer projections

Conductor projects source contracts into Functional Specification and Acceptance Criteria semantics, patterns, matrix evaluations, AX bindings, and evidence sidecars. ai-orchestration consumes that contract and projects implementation, testing, and review lanes without downgrading COS outcomes.

Each projection is identified by exact package, profile, schema, and content digests. COS interview snapshots preserve active-session behavior; implementation handoff transports the sidecar to the driver. Public prose remains readable but cannot override structured IDs.

Schema 2 added the exact-version [UI pattern binding](./ui-pattern-bindings.md) to both profiles. Schema 3 added normalized standards references and the complete WCAG 2.2 Level A/AA coverage inventory. Schema 4 targets `4.0.0` and projects 79 semantics, 34 patterns, 38 applicability rows, and 80 UI bindings. Each profile's `coverage-manifest.json` carries all 55 WCAG 2.2 A/AA criteria plus an exact mapping of all 30 current APG patterns and seven Practices; APG coverage remains informative guidance, not a conformance claim.

The shared source digest covers authority inventories, citations, records, fact catalogs, matrices, evidence, bindings, packaged schemas, and profiles. Both binding artifacts embed the typed fact catalog, and their binding digest includes its enum domains. Schema-4 manifest contracts pin the full record, projected-ID, evidence-lane, canonical UI-slug, profile-specific output-path, and output-digest sets; truncation, substitution, malformed digests, or misleading upstream provenance fail validation. Generated Markdown escapes table/link content, and generated JSON and embedded JSON use canonical key ordering so equivalent source objects produce deterministic bytes. COS preserves ordered canonical UI IDs, resolves candidate discriminators, and snapshots the UI manifest and binding digests. ai-orchestration validates that provenance and consumes the same resolved accessibility IDs. The stable load order is UI catalog, accessibility binding/contracts, then the separate project component index.

Tracking: [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47), [GitHub issue 609](https://github.com/verndale/ai-orchestration/issues/609), and [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17).

WCAG 2.2 traceability and the first APG expansion are tracked by [accessibility-standards issue 6](https://github.com/verndale/accessibility-standards/issues/6) and its [executed plan](../plans/2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md). Phase 2 semantic-gap coverage is tracked by [accessibility-standards issue 15](https://github.com/verndale/accessibility-standards/issues/15) and its [executed plan](../plans/2026-08-31-phase-2-wcag-2-2-semantic-gap-coverage-v3-1-0-996e626c58.md).

Complete APG pattern/practice coverage and the schema-4 authority/projection contract are tracked by [accessibility-standards issue 22](https://github.com/verndale/accessibility-standards/issues/22) and the [executed schema-4 plan](../plans/2026-09-07-schema-4-complete-wai-aria-apg-pattern-and-practice-coverage-b0d9993b75.md).
