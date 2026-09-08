# Projection contract

Every consumer pins the package exactly and supplies `accessibility-standards.config.json` plus `accessibility-standards.routes.json`. A generated `accessibility.source.json` records package/profile/schema versions, source/config/route digests, projected IDs, lane coverage, the pinned UI Design Brain source-manifest digest, and the accessibility-owned binding digest.

Both profiles also generate `coverage-manifest.json`. In schema 4 its `wcag_2_2` member carries the canonical 55-criterion Level A/AA inventory, including coverage status and linked semantic IDs, and its `aria_apg` member maps all 30 APG patterns and seven APG Practices to dedicated, composed, or baseline records. The WCAG inventory is normative traceability; the APG inventory is informative implementation guidance, not a conformance claim. Coverage rows expose gaps rather than treating missing automation as conformance, and the common source digest changes whenever either inventory, the HTML/ARIA authority catalog, packaged schemas, or cited records change.

Profile template files are contract inputs. Their stable paths and complete contents participate in both the profile digest and the common source digest, so changing packaged projection guidance invalidates every affected generated artifact.

Both profiles generate `ui-design-brain-bindings.json`. The artifact embeds the complete typed applicability fact catalog, including every closed string-enum domain used by candidate mappings. Its accessibility-owned `binding_digest` covers both the binding contract and that fact catalog, so changing a discriminator's accepted values invalidates downstream provenance. Consumers load inputs in this order:

1. The exact UI Design Brain catalog and provenance resolve names or aliases to ordered canonical slugs.
2. The accessibility binding resolves those slugs to sorted accessibility pattern IDs. Caller slug order is preserved after ordered de-duplication; candidate mappings expose missing discriminator facts rather than inferring from prose.
3. Accessibility semantics, patterns, and applicability expand the selected IDs, retaining their normalized standards references.
4. The project component index independently answers which real implementation component can be reused.

UI Design Brain, the accessibility binding, and the component index are separate authorities. A consumer must not substitute one for another or re-resolve aliases after step 1.

`sync --if-needed` compares these digests, renders to a sibling temporary directory, validates the full projection, and atomically promotes marker-owned files. Schema 4 pins the complete projected-ID, evidence-lane, UI-pattern, record, output-path, and output-digest inventories so partial or substituted manifests fail validation. Sync refuses to replace an unmarked or locally modified managed output. `check` is read-only.
