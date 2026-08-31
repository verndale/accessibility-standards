---
aliases: [UI Design Brain binding, canonical UI slugs, accessibility pattern bridge]
covers: []
---
# UI pattern bindings

[UI Design Brain](https://github.com/verndale/ui-design-brain) remains the authority for canonical UI pattern names, aliases, and disambiguation. Accessibility Standards remains the authority for semantic obligations, accessibility pattern contracts, applicability, and evidence. The component index remains a third, project-local authority for reusable implementation inventory.

The accessibility-owned binding pins the UI Design Brain `1.16.0` projector and its `1.15.1` catalog-authority baseline, 80-entry manifest digest, and complete source digest. Every canonical slug is explicitly `direct`, `candidate`, or `baseline-only`. Direct mappings add accessibility patterns automatically. Candidate mappings expose exact typed discriminator facts and cannot infer from agent prose. Baseline-only means the UI name adds no specialized pattern, but it must add explicit capability-filtered `baseline_semantic_ids`; a plain `button`, for example, deterministically carries naming, native-element, name/role/value, keyboard, focus, and target-size semantics instead of producing an empty contract.

Canonical UI IDs preserve caller order after ordered de-duplication so COS can retain a primary pattern followed by sub-element patterns. Accessibility pattern IDs are expanded and sorted deterministically. `modal` always retains `pattern.dialog` and adds `pattern.alert-dialog` only when `component.dialog_purpose` is `urgent-response`; unknown slugs fail closed. Aliases never enter the applicability matrix.

The schema-3 expansion maps `context-menu` and `dropdown-menu` to the APG-backed menu behavior, `tree-view` to tree view, `radio-button` to radio group, `slider` to slider, `number-input` and `stepper` to spinbutton, and `checkbox` to checkbox. The additive `3.1.0` binding makes `toggle`, `modal`, and `button-group` candidates: exact string discriminators add switch, alert-dialog, or toolbar while missing, nonmatching, and invalid values cannot silently specialize the contract. Existing field, dialog, and button-group baseline outcomes remain intact. Link and skip-link baselines now add link-purpose and bypass-block obligations, and pagination, popover, and tooltip carry their corresponding Phase 2 semantic dependencies.

Both consumer profiles project `ui-design-brain-bindings.json` with the source package/version, source-manifest SHA-256, binding SHA-256, schema version, and all mappings. A common authority digest covers facts, sources, records, matrix, evidence, bindings, contract, and both profile contracts; a separate profile digest identifies each rendered projection without breaking cross-profile handoff compatibility. Loader order is UI catalog/provenance, accessibility binding, accessibility contracts, then the separate component index. Sync uses the exact installed package and never performs a dependency upgrade.

Delivery is tracked by [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47), [ai-orchestration issue 609](https://github.com/verndale/ai-orchestration/issues/609), and [COS Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17).

Related: [semantic and pattern model](./semantic-pattern-model.md), [consumer projections](./consumer-projections.md), [sync enforcement](./sync-and-enforcement.md), the [delivery plan](../plans/2026-08-30-shared-accessibility-standards-delivery.md), the [WCAG 2.2 expansion plan](../plans/2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md), and the [semantic-gap coverage plan](../plans/2026-08-31-phase-2-wcag-2-2-semantic-gap-coverage-v3-1-0-996e626c58.md).
