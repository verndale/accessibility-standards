---
aliases: [Conductor projection, ai-orchestration projection, accessibility sidecar]
covers: []
---
# Consumer projections

Conductor projects source contracts into Functional Specification and Acceptance Criteria semantics, patterns, matrix evaluations, AX bindings, and evidence sidecars. ai-orchestration consumes that contract and projects implementation, testing, and review lanes without downgrading COS outcomes.

Each projection is identified by exact package, profile, schema, and content digests. COS interview snapshots preserve active-session behavior; implementation handoff transports the sidecar to the driver. Public prose remains readable but cannot override structured IDs.

Schema 2 adds the exact-version [UI pattern binding](./ui-pattern-bindings.md) to both profiles. COS preserves ordered canonical UI IDs, resolves candidate discriminators, and snapshots the UI manifest and binding digests. ai-orchestration validates that provenance and consumes the same resolved accessibility IDs. The stable load order is UI catalog, accessibility binding/contracts, then the separate project component index.

Tracking: [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47), [GitHub issue 609](https://github.com/verndale/ai-orchestration/issues/609), and [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17).
