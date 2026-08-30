---
date: 2026-08-30
topics: [standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections, sync-and-enforcement]
plans: [2026-08-30-shared-accessibility-standards-delivery.md]
issue: https://github.com/verndale/ai-orchestration/issues/609
ui_design_brain_issue: https://github.com/verndale/ui-design-brain/issues/47
azure_feature: https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17
pr: https://github.com/verndale/accessibility-standards/pull/1
---
# Shared accessibility standards delivery

Established the public source repository, canonical wiki, semantic and pattern contracts, typed applicability matrix, evidence routes, deterministic projections, safe synchronization CLI, tests, and standardized GitHub workflows. Created the companion [ai-orchestration issue 609](https://github.com/verndale/ai-orchestration/issues/609) and [COS Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17) and their implementation branches.

Extended the delivery through [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47). The accessibility source now pins the UI projector/catalog source and manifest digests, classifies all 80 canonical UI slugs, maps `modal` directly to `pattern.dialog`, gives every baseline-only slug explicit capability-filtered semantic outcomes, preserves caller UI order, resolves candidate mappings only through declared typed facts, and projects the binding with schema-2/package-2.0.0 provenance to both consumers. Common authority and per-profile digests are separated so COS handoffs remain compatible with ai-orchestration while exact projections remain identifiable. Forms and validation remain separate applicability rows so inactive validation produces no boilerplate. UI vocabulary, accessibility authority, and the implementation component index remain independent layers; raw cron copying is replaced by exact-version local sync/check behavior.

The source validator now rejects incomplete records, duplicate matrix IDs, unsupported evidence lanes, and expression/runtime fact type mismatches. Atomic sync refuses edited outputs and edited provenance through a self-integrity digest. Generated Markdown/JSON and top-level distribution artifacts carry package/profile/schema/source provenance, and foundation/policy/evidence content is present in both projections. The release gate computes the exact version from commits and rechecks it during `prepack`.

The original `v1.0.0` npm publication [failed](https://github.com/verndale/accessibility-standards/actions/runs/33325307696) after OIDC package-not-found and fallback `EOTP`; its tag exists while npm is absent. The release workflow is ready for tokenless trusted publishing after the one-time exact-`1.0.0` npm bootstrap and trusted-publisher configuration, which remain external prerequisites.

Consumer integration, the UI Design Brain 1.16.0 release, npm bootstrap, Accessibility Standards 2.0.0 publication, and the cross-repository golden remain in progress; the canonical plan stays `partial` until both projections and parity pass.
