---
status: partial
executed: true
date: 2026-08-30
evidence:
  - "Canonical repository https://github.com/verndale/accessibility-standards"
  - "Tracking issue https://github.com/verndale/ai-orchestration/issues/609"
  - "Azure Feature https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17"
  - "Implementation branch codex/bootstrap-accessibility-standards"
topics: [standards-authority, semantic-pattern-model, consumer-projections, sync-and-enforcement]
source_tool: codex
source: "Codex task: Shared Accessibility Standards Delivery Plan"
digest: "c7ab48b0fa13e58842ad4f29ce13cdc063d743fb7974755847efc5092331f1e0"
---
# Shared Accessibility Standards Delivery Plan

## Objective and authority

Publish the public repository [verndale/accessibility-standards](https://github.com/verndale/accessibility-standards) as `@verndale/accessibility-standards@1.0.0`. It is the single normative source for accessibility foundations, semantic contracts, composed patterns, applicability, policies, and evidence routing. Consumer-specific prose is a projection and cannot add, omit, downgrade, or override obligations.

The deterministic delivery chain is:

```text
foundations → semantics → patterns → applicability matrix
→ COS Functional Spec/AC contract → ai-orchestration Build Pack
→ implementation → tests/evidence → review
```

Determinism covers selected IDs, semantic dependencies, ordering, package/profile/schema versions, source/config/route/output digests, managed generated files, loader order, and proof routes.

## Repository and branch setup

- Bootstrap `main` with only `README.md` and `.gitignore`, then implement on `codex/bootstrap-accessibility-standards`.
- Track ai-orchestration through [GitHub issue 609](https://github.com/verndale/ai-orchestration/issues/609) and `codex/gh-609-accessibility-standards` from `origin/main`.
- Track COS through [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17) and `codex/ado-17-accessibility-contract` from `origin/staging`.
- Consumer branches are created only after fetching, verifying the base, requiring a clean tree, and confirming absence locally/remotely. Consumer setup does not push or commit.

## Canonical source structure

```text
accessibility-standards/
├── .github/workflows/{commitlint,pr,quality,release,wiki-check,wiki-sync,wiki-issue-sync}.yml
├── .husky/{prepare-commit-msg,commit-msg,pre-commit,pre-push}
├── docs/{authoring,projection-contract,versioning}.md
├── schemas/{record,semantic,pattern,applicability-matrix,profile,projection-manifest,consumer-config,consumer-routes,manifest}.schema.json
├── src/
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
│   ├── applicability/{facts,matrix}.yml
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

`dist/` is package-only generated output and is not committed. It contains source and projection manifests, requirements-to-implementation mapping, and the two profiles.

## Semantic, pattern, applicability, and evidence contracts

Semantic records own native element, role, accessible name, state/property, heading, landmark, keyboard, focus, live-region, form, table, and media rules. Patterns compose stable semantic IDs. Each pattern also declares activation facts, scope, behavior, product decisions, Functional Spec bindings, implementation outcomes, and evidence routes.

The applicability DSL permits only validated `all`, `any`, `not`, `equals`, `contains`, and `exists` expressions over typed facts. Its 18 ordered rows cover page context, non-text content, media, forms, consequential submission, dynamic status, overlays, motion/timing, complex pointer input, character shortcuts, orientation/sensory cues, target size, focus obstruction, authentication/CAPTCHA, redundant entry, consistent help, locale/bidi, and data table/grid. Standards-owned results are automatic; interview questions collect only missing trigger discriminators and product-owned decisions.

Proof kinds are exactly unit, axe, E2E, and human. Tool availability may change the route but never applicability. Missing required tooling is a blocker. Automated scanning is evidence, not conformance.

## Projection and synchronization contract

Each consumer commits an exact package pin, `accessibility-standards.config.json`, `accessibility-standards.routes.json`, and provenance containing package/profile/schema versions, all digests, projected IDs, and lane coverage.

Supported commands are `sync`, `sync --if-needed`, and read-only `check`. Hooks run only the lockfile-installed package; they never contact npm, install, or upgrade. Sync renders into temporary storage, validates the complete projection, then promotes managed files. It refuses unmarked files and locally modified generated targets. Checks fail for missing dependencies, orphan patterns, unknown IDs, dead lanes, duplicate authority, unsupported routes, stale outputs, or wrong loader order.

ai-orchestration uses post-checkout/post-merge repair, blocking pre-commit check, and pre-push `verify:push` plus check. COS uses Lefthook post-checkout/post-merge repair, read-only pre-commit check, and affected pre-push checks plus check. COS lifecycle order is accessibility sync, Conductor sync, frontend-ai sync where applicable, then dev/build; mutating sync never runs in parallel pre-commit jobs.

## Workflow and release standard

The source repository follows BA Cockpit and ai-orchestration: Node 24.14.0, Corepack, pnpm 11.1.1, frozen lockfile, full-history checkout, and required jobs `Commit message lint / commitlint`, `Quality / quality`, and `Wiki integrity / check`. Writer jobs are `Sync context wiki / sync` and `Sync wiki issue state / sync`.

Commitlint is `@verndale/ai-commit@2.7.0`. PR automation uses `@verndale/ai-pr`, `PR_BOT_TOKEN`, draft-by-default PRs, and ignores `bot/wiki-*`. Quality runs only `pnpm verify:ci`. Release verifies, packs and clean-installs, then uses semantic-release for public npm publication with provenance, tag, changelog, and GitHub release. UI Design Brain, start-pack, Slack, Python, and consumer-only workflows are excluded.

Initial version is 1.0.0. Authority, behavior, schema, or ID-removal changes are major; additive stable records are minor; editorial changes are patch. Older same-major contracts may reference only IDs available then; newer or major-incompatible contracts fail. Unstamped legacy artifacts warn, while new or revised artifacts require a contract.

## COS/Conductor projection

Generate shared skill references, structured semantics, pattern files/contracts, applicability matrix, coverage/provenance, and `apps/shell/src/generated/conductor-accessibility.ts`. One resolver serves Agent BA, live BA, optional deterministic generation, built-in rollback generation, AC generation, Implementation Spec/handoff, spec review, and feedback revision.

Resolution order is required pattern semantics, capability-filtered baseline semantics, triggered outcomes, product decisions/TBDs, then evidence routes. The interview adds an accessibility stage after behavior/pattern discovery and before requiredness. Trigger states are `unobserved`, `not_applicable`, `candidate`, `applicable`; resolution states are `skipped`, `needs_confirmation`, `needs_input`, `resolved`, `deferred`, `conflict`.

Deterministic state version 4 stores package/profile/digest, matrix snapshot, evidence, and evaluations. Versions 1–3 retain frozen legacy behavior. `AccessibilityContractV1` sidecars for Functional Spec and AC versions contain package/profile/schema versions, semantic/pattern/rule/outcome IDs, states, proof kinds, evidence references, and AX bindings. APIs and implementation handoff expose the sidecar while public artifact shapes otherwise remain stable except the visible standards-version stamp. A common finalizer enforces one copy of every applicable outcome and no inactive boilerplate.

## ai-orchestration projection

Always-mirrored provenance lives in `frontend-ai/driver/contracts/accessibility-source.json` and `accessibility-routing.json`. The driver fetches the COS sidecar, validates compatibility, preserves imported IDs, resolves only additional implementation facts without downgrade, writes byte-stable `accessibility-projection.json`, emits Build Pack `accessibility.md` in stable ID order, stamps the exact package, always loads implementation semantics, routes proof kinds to exact lanes, and requires test/review coverage for every outcome. Requirements are never Playwright-gated.

## Wiki delivery

The accessibility wiki owns this plan plus topics for standards authority, semantic/pattern modeling, consumer projections, and sync/enforcement, with one delivery journal entry. ai-orchestration receives a scoped plan, routing topic, affected current-state updates, one journal, and rebuilt graph. COS receives the meta-shell integration plan, deterministic-interview ownership update, authority/projection decision, and exactly one strict log row. All cross-repository evidence uses fully qualified GitHub or Azure URLs. BA Cockpit remains unchanged because it is a workflow reference rather than a package consumer.

## Verification and rollout

Tests cover schemas, cycles, IDs, all matrix rows/states, profile determinism, sync no-op/change/repair/refusal/atomic behavior, COS parity/replay/sidecars/APIs/handoff, ai-orchestration loading/proof/review order, wiki reachability/graph/workflows, and clean packed consumers. A cross-repository golden traces COS facts through pattern/semantic IDs, Functional Spec contract, AX bindings, handoff, Build Pack, implementation, proof, and review.

Rollout order: bootstrap authority and wiki; create tracking/cross-links and branches; build and publish 1.0.0; implement ai-orchestration; implement COS; run all golden/sync/workflow/wiki checks; remove duplicated normative guidance only after parity; merge reviewed PRs and let wiki reconciliation replace pending evidence.

## Risks and open completion work

- Package publication and consumer installation require the reviewed source release.
- Active COS sessions must keep snapshots while version 4 becomes the new default.
- Consumer duplicate guidance is retained until cross-repository parity proves safe removal.
- Azure status is explicit external evidence; GitHub issue-state automation cannot infer it.
