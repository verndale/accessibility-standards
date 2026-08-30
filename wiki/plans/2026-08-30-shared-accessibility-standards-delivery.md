---
status: partial
executed: true
date: 2026-08-30
evidence:
  - "Canonical repository https://github.com/verndale/accessibility-standards"
  - "UI Design Brain tracking issue https://github.com/verndale/ui-design-brain/issues/47"
  - "Tracking issue https://github.com/verndale/ai-orchestration/issues/609"
  - "Azure Feature https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17"
  - "Accessibility implementation branch codex/gh-47-ui-pattern-binding-release"
  - "Failed v1.0.0 publication https://github.com/verndale/accessibility-standards/actions/runs/33325307696"
topics: [standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections, sync-and-enforcement]
source_tool: codex
source: "Codex task: Shared Accessibility Standards Delivery Plan"
digest: "e99766100e6b196dc60038ff6b73b8f8351e4a0c278dc07884ebc6fd8ebe3a34"
---
# Shared Accessibility Standards Delivery Plan

## Objective and authority

Publish the public repository [verndale/accessibility-standards](https://github.com/verndale/accessibility-standards) as the single normative source for accessibility foundations, semantic contracts, composed patterns, applicability, policies, and evidence routing. Version `1.0.0` predates the UI binding; the schema-2 binding and projection target `@verndale/accessibility-standards@2.0.0`. Consumer-specific prose is a projection and cannot add, omit, downgrade, or override obligations.

[UI Design Brain](https://github.com/verndale/ui-design-brain) remains the separate normative source for canonical UI names, aliases, and pattern disambiguation. Accessibility Standards owns the exact-version bridge from canonical UI slugs to accessibility pattern IDs. A project component index remains separate implementation inventory.

The deterministic delivery chain is:

```text
UI Design Brain canonical IDs → accessibility binding
→ foundations → semantics → patterns → applicability matrix
→ COS Functional Spec/AC contract → ai-orchestration Build Pack
→ implementation → tests/evidence → review
```

Determinism covers ordered canonical UI IDs, selected accessibility IDs, semantic dependencies, ordering, package/profile/schema versions, UI source-manifest and binding digests, source/config/route/output digests, managed generated files, loader order, and proof routes.

## Repository and branch setup

- Bootstrap `main` with only `README.md` and `.gitignore`, then implement on `codex/bootstrap-accessibility-standards`.
- Track the UI vocabulary projection through [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47), `codex/gh-47-deterministic-projections` in UI Design Brain, and `codex/gh-47-ui-pattern-binding-release` in Accessibility Standards.
- Track ai-orchestration through [GitHub issue 609](https://github.com/verndale/ai-orchestration/issues/609) and `codex/gh-609-accessibility-standards` from `origin/main`.
- Track COS through [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17) and `codex/ado-17-accessibility-contract` from `origin/staging`.
- Consumer branches are created only after fetching, verifying the base, requiring a clean tree, and confirming absence locally/remotely. Consumer setup does not push or commit.

## Canonical source structure

```text
accessibility-standards/
├── .github/workflows/{commitlint,pr,quality,release,wiki-check,wiki-sync,wiki-issue-sync}.yml
├── .husky/{prepare-commit-msg,commit-msg,pre-commit,pre-push}
├── docs/{authoring,projection-contract,versioning}.md
├── schemas/{contract,record,semantic,pattern,applicability-matrix,ui-design-brain-bindings,profile,projection-manifest,consumer-config,consumer-routes,manifest}.schema.json
├── src/
│   ├── contract.yml
│   ├── sources.yml
│   ├── foundations/{standards-hierarchy,conformance-boundary,wcag-2.2}.yml
│   ├── semantics/{native-elements,accessible-names,roles-states-properties,headings-landmarks,keyboard-focus,live-regions,forms,tables,media}.yml
│   ├── patterns/
│   │   ├── disclosure/{accordion,disclosure}.yml
│   │   ├── overlays/{dialog,popover,tooltip}.yml
│   │   ├── navigation/{menu-button,pagination,tabs}.yml
│   │   ├── selection/{combobox,listbox}.yml
│   │   ├── feedback/{alert,dynamic-status,progress}.yml
│   │   ├── media/{carousel,image,media-player}.yml
│   │   └── forms/{field,validation,consequential-submission}.yml
│   ├── applicability/{facts,matrix,ui-design-brain-bindings}.yml
│   ├── policies/{target-size,enhanced-quality}.yml
│   └── evidence/proof-routing.yml
├── profiles/
│   ├── conductor/{profile.json,templates/{semantics,patterns,applicability,evidence}/}
│   └── ai-orchestration/{profile.json,templates/{semantics,patterns,implementation,testing,review}/}
├── lib/{load,validate,compile-applicability,render,build-manifest,sync,digest}.mjs
├── bin/accessibility-standards.mjs
├── scripts/{commit-pr,graph,wiki}/
├── tests/{unit,fixtures,golden,consumer-fixtures}/
├── wiki/{INDEX,MECHANICS,journal,plans,topics,connections}.md
└── package and operating files
```

`dist/` is package-only generated output and is not committed. It contains source and projection manifests, requirements-to-implementation mapping, and the two profiles. Both profiles contain `ui-design-brain-bindings.json` with schema version, UI package/version, manifest digest, binding digest, and all 80 mappings.

## Semantic, pattern, applicability, and evidence contracts

Semantic records own native element, role, accessible name, state/property, heading, landmark, keyboard, focus, live-region, form, table, and media rules. Patterns compose stable semantic IDs. Each pattern also declares activation facts, scope, behavior, product decisions, Functional Spec bindings, implementation outcomes, and evidence routes.

The applicability DSL permits only validated `all`, `any`, `not`, `equals`, `contains`, and `exists` expressions over typed facts. Its 19 ordered rows cover page context, non-text content, media, forms, validation, consequential submission, dynamic status, overlays, motion/timing, complex pointer input, character shortcuts, orientation/sensory cues, target size, focus obstruction, authentication/CAPTCHA, redundant entry, consistent help, locale/bidi, and data table/grid. Form fields and validation are separate rows so inactive validation creates no boilerplate. Standards-owned results are automatic; interview questions collect only missing trigger discriminators and product-owned decisions.

The UI binding pins the UI Design Brain `1.16.0` projector, its `1.15.1` catalog-authority baseline, and the source and parsed-manifest SHA-256 digests for its 80 entries. Every canonical slug is exactly one of `direct`, `candidate`, or `baseline-only`. Direct mappings add sorted accessibility pattern IDs. Candidate mappings declare every typed discriminator fact used by their expressions; unresolved facts remain explicit `candidate`/`needs_input`. Baseline-only slugs add no specialized pattern from the name alone and must add explicit, capability-filtered `baseline_semantic_ids`; this prevents recognized primitives such as `button` from yielding an empty structured contract. Alias resolution happens only in UI Design Brain. Canonical UI IDs preserve caller order after ordered de-duplication, expanded accessibility IDs sort, `modal` maps to `pattern.dialog`, and unknown slugs or incorrectly typed runtime facts fail closed.

Proof kinds are exactly unit, axe, E2E, and human. Tool availability may change the route but never applicability. Missing required tooling is a blocker. Automated scanning is evidence, not conformance.

## Projection and synchronization contract

Each consumer commits an exact package pin, `accessibility-standards.config.json`, `accessibility-standards.routes.json`, and provenance containing package/profile/schema versions, the UI Design Brain source/manifest and accessibility binding digests, all projection digests, projected IDs, and lane coverage. The common authority digest includes package/contract identity, source hierarchy, foundations, semantics, patterns, policies, typed facts, matrix, evidence, UI bindings, and both profile contracts; a separate selected-profile digest distinguishes projections while preserving cross-profile COS-to-ai-orchestration compatibility.

The deterministic loader order is UI Design Brain catalog/provenance, accessibility binding, accessibility semantic/pattern/applicability contracts, then the separate project component index. Raw Markdown and aliases cannot directly select accessibility obligations.

Supported commands are `sync`, `sync --if-needed`, and read-only `check`. Hooks run only the lockfile-installed package; they never contact npm, install, or upgrade. Sync renders every artifact into temporary storage, validates the complete projection, then promotes it transactionally with byte-for-byte rollback. It refuses unmarked files, locally modified generated targets, and provenance whose self-integrity digest no longer matches. Checks fail for malformed semantics/patterns, incorrectly typed expressions or observed facts, missing dependencies, orphan patterns, unknown/duplicate IDs, evidence lanes other than exactly unit/axe/E2E/human, dead lanes, duplicate authority, unsupported routes, stale outputs, or wrong loader order.

ai-orchestration uses post-checkout/post-merge repair, blocking pre-commit check, and pre-push `verify:push` plus check. COS uses Lefthook post-checkout/post-merge repair, read-only pre-commit check, and affected pre-push checks plus check. COS lifecycle order is UI Design Brain sync, accessibility sync, Conductor sync, frontend-ai sync where applicable, then dev/build; mutating sync never runs in parallel pre-commit jobs. UI Design Brain follows the same exact-package deterministic projection model; the ai-orchestration daily raw-copy cron is removed.

## Workflow and release standard

The source repository follows BA Cockpit and ai-orchestration: Node 24.14.0, Corepack, pnpm 11.1.1, frozen lockfile, full-history checkout, and required jobs `Commit message lint / commitlint`, `Quality / quality`, and `Wiki integrity / check`. Writer jobs are `Sync context wiki / sync` and `Sync wiki issue state / sync`.

Commitlint is `@verndale/ai-commit@2.7.0`. PR automation uses `@verndale/ai-pr`, `PR_BOT_TOKEN`, draft-by-default PRs, and ignores `bot/wiki-*`. Quality runs only `pnpm verify:ci`. Release verifies, packs and clean-installs, then uses semantic-release for public npm publication with provenance, tag, changelog, and GitHub release. UI Design Brain consumer sync, start-pack, Slack, Python, and consumer-only workflows are excluded.

The initial `v1.0.0` GitHub release [failed](https://github.com/verndale/accessibility-standards/actions/runs/33325307696) because npm OIDC cannot trust a package that does not exist. The verified tag tarball is now published as [@verndale/accessibility-standards@1.0.0](https://www.npmjs.com/package/@verndale/accessibility-standards), and npm trusted publishing is configured for `verndale/accessibility-standards`, `release.yml`, and `npm publish` only. The first OIDC rerun exposed a parser mismatch: the local preflight accepts `type(scope)!:`, but semantic-release's default Angular parser did not, attempted an unpublished 1.0.1, and the `prepack` guard rejected the contract mismatch. The repair tracked in [issue 4](https://github.com/verndale/accessibility-standards/issues/4) pins the Conventional Commits parser for analysis and release notes, tests the real analyzer, and uses a breaking repair commit so the retained `v1.0.1` Git tag advances deterministically to 2.0.0. No existing tag is deleted or rewritten.

Authority, behavior, schema, or ID-removal changes are major; additive stable records are minor; editorial changes are patch. Older same-major contracts may reference only IDs available then; newer or major-incompatible contracts fail. Unstamped legacy artifacts warn, while new or revised artifacts require a contract. `src/contract.yml` makes the schema-2/package-2.0.0 target explicit, and normal build/sync validation requires installed package metadata to match it.

## COS/Conductor projection

Generate shared skill references, structured semantics, pattern files/contracts, applicability matrix, coverage/provenance, and `apps/shell/src/generated/conductor-accessibility.ts`. One resolver serves Agent BA, live BA, optional deterministic generation, built-in rollback generation, AC generation, Implementation Spec/handoff, spec review, and feedback revision.

Resolution order is canonical UI ID binding, required pattern semantics, capability-filtered baseline semantics, triggered outcomes, product decisions/TBDs, then evidence routes. The interview adds an accessibility stage after behavior/pattern discovery and before requiredness. Trigger states are `unobserved`, `not_applicable`, `candidate`, `applicable`; resolution states are `skipped`, `needs_confirmation`, `needs_input`, `resolved`, `deferred`, `conflict`.

Deterministic state version 4 stores package/profile/digest, matrix snapshot, evidence, and evaluations. Versions 1–3 retain frozen legacy behavior. `AccessibilityContractV1` sidecars for Functional Spec and AC versions contain package/profile/schema versions, semantic/pattern/rule/outcome IDs, states, proof kinds, evidence references, and AX bindings. APIs and implementation handoff expose the sidecar while public artifact shapes otherwise remain stable except the visible standards-version stamp. A common finalizer enforces one copy of every applicable outcome and no inactive boilerplate.

## ai-orchestration projection

Always-mirrored provenance lives in `frontend-ai/driver/contracts/accessibility-source.json` and `accessibility-routing.json`. The driver first validates its exact UI Design Brain catalog provenance, then the accessibility binding/source provenance, fetches the COS sidecar, preserves ordered canonical UI IDs and imported accessibility IDs, resolves only additional implementation facts without downgrade, writes byte-stable `accessibility-projection.json`, emits Build Pack `accessibility.md` in stable accessibility-ID order, stamps the exact package, always loads implementation semantics, routes proof kinds to exact lanes, and requires test/review coverage for every outcome. The project component index loads afterward for reuse discovery. Requirements are never Playwright-gated.

## Wiki delivery

The accessibility wiki owns this plan plus topics for standards authority, semantic/pattern modeling, UI pattern bindings, consumer projections, and sync/enforcement, with one delivery journal entry. UI Design Brain records its deterministic projection and no-cron consumer decision against [issue 47](https://github.com/verndale/ui-design-brain/issues/47). ai-orchestration receives a scoped plan, routing topic, affected current-state updates, one journal, and rebuilt graph. COS receives the meta-shell integration plan, deterministic-interview ownership update, authority/projection decision, and exactly one strict log row. All cross-repository evidence uses fully qualified GitHub or Azure URLs. BA Cockpit remains unchanged because it is a workflow reference rather than a package consumer.

## Verification and rollout

Tests cover malformed record rejection, typed DSL operands and observed values, exact evidence lanes, cycles, stable/duplicate IDs, all 80 UI slug classifications, direct/candidate/baseline-only semantic resolution, caller-order preservation, candidate discriminator states, unknown-slug failure, all 19 matrix rows/states, common-source versus profile-digest determinism, identical lane coverage, foundation/policy/evidence projection, sync version mismatch/no-op/change/repair/dirty-provenance refusal/atomic rollback, exact release-target calculation, COS parity/replay/sidecars/APIs/handoff, ai-orchestration loading/proof/review order, wiki reachability/graph/workflows, and clean packed consumers. A cross-repository golden traces ordered UI IDs through binding, COS facts, pattern/semantic IDs, Functional Spec contract, AX bindings, handoff, Build Pack, implementation, proof, and review.

Rollout order: bootstrap authority and wiki; create tracking/cross-links and branches; recover the external 1.0.0 npm bootstrap; establish tokenless trusted publishing; implement and release UI Design Brain deterministic projections as 1.16.0; publish Accessibility Standards schema 2 as 2.0.0; implement ai-orchestration; implement COS; run all golden/sync/workflow/wiki checks; remove cron/raw copies and duplicated normative guidance only after parity; merge reviewed PRs and let wiki reconciliation replace pending evidence.

## Risks and open completion work

- `@verndale/accessibility-standards@1.0.0` is public and its trusted publisher is configured; the breaking release repair must publish the intended 2.0.0 from the retained, unpublished `v1.0.1` Git tag.
- UI Design Brain issue [47](https://github.com/verndale/ui-design-brain/issues/47), ai-orchestration issue [609](https://github.com/verndale/ai-orchestration/issues/609), and COS [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17) must converge on the same source/manifest/binding digests and loader order.
- Active COS sessions must keep snapshots while version 4 becomes the new default.
- Consumer duplicate guidance is retained until cross-repository parity proves safe removal.
- Azure status is explicit external evidence; GitHub issue-state automation cannot infer it.
