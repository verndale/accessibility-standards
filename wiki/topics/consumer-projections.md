---
aliases: [Conductor projection, ai-orchestration projection, accessibility sidecar]
covers: []
---
# Consumer projections

Conductor projects source contracts into Functional Specification and Acceptance Criteria semantics, patterns, matrix evaluations, AX bindings, and evidence sidecars. ai-orchestration consumes that contract and projects implementation, testing, and review lanes without downgrading COS outcomes.

Each projection is identified by exact package, profile, schema, and content digests. COS interview snapshots preserve active-session behavior; implementation handoff transports the sidecar to the driver. Public prose remains readable but cannot override structured IDs.

Schema 2 added the exact-version [UI pattern binding](./ui-pattern-bindings.md) to both profiles. Schema 3 adds normalized standards references and the complete WCAG 2.2 Level A/AA coverage inventory to each profile's `coverage-manifest.json`. The shared source digest covers inventory data, cited records, and packaged schemas. Generated Markdown renders semantic/pattern references, pattern activation, criterion coverage, and deferred APG work with escaped table and link content; generated JSON and embedded JSON use canonical key ordering so equivalent source objects produce deterministic bytes. Sync tests assert the coverage-manifest output, its 55 criteria, output path, and source provenance. COS preserves ordered canonical UI IDs, resolves candidate discriminators, and snapshots the UI manifest and binding digests. ai-orchestration validates that provenance and consumes the same resolved accessibility IDs. The stable load order is UI catalog, accessibility binding/contracts, then the separate project component index.

Tracking: [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47), [GitHub issue 609](https://github.com/verndale/ai-orchestration/issues/609), and [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17).

WCAG 2.2 traceability and the first APG expansion are tracked by [accessibility-standards issue 6](https://github.com/verndale/accessibility-standards/issues/6) and its [executed plan](../plans/2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md).
