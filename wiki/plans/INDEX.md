# Plan ledger

| Plan | Status | Evidence |
|---|---|---|
| [Shared Accessibility Standards Delivery Plan](./2026-08-30-shared-accessibility-standards-delivery.md) | partial | [UI Design Brain issue 47](https://github.com/verndale/ui-design-brain/issues/47), [GitHub issue 609](https://github.com/verndale/ai-orchestration/issues/609), [Azure Feature 17](https://dev.azure.com/verndale/V00066-Cumulative-OperatingSystem/_workitems/edit/17), [release issue 4](https://github.com/verndale/accessibility-standards/issues/4) <!-- plan:e99766100e6b196dc60038ff6b73b8f8351e4a0c278dc07884ebc6fd8ebe3a34 --> |

Executed-plan bodies are archived beside this file. Every historical candidate remains represented here after audit, including candidates that were not implemented or were outside this repository.

| Date | Plan | Status | Evidence | Topics |
| --- | --- | --- | --- | --- |
| 2026-08-30 | [WCAG 2.2 Coverage and Pattern Expansion](./2026-08-30-wcag-2-2-coverage-and-pattern-expansion-9afa9d1d04.md) | implemented | GitHub issue https://github.com/verndale/accessibility-standards/issues/6; Local branch codex/gh-6-wcag-2-2-pattern-expansion; src/coverage/wcag-2.2.yml; pnpm verify:ci | standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections <!-- plan:9afa9d1d04b7ee1546d6e67a6ffe1c8b1ecacd129d84dccb0d9e60efa06e6c39 --> |
| 2026-08-30 | [Repair PR AI automation and release preflight](./2026-08-30-repair-pr-ai-automation-and-release-preflight-704110024e.md) | implemented | PR #7 merge commit a94d3e3d731f76a4e07c7cd198600413dd4d2bc4; pnpm release:preflight; pnpm release:preflight:selftest | sync-and-enforcement <!-- plan:704110024ec9dc7d387289f1bea5580ceb78e31cd3a7fabb6d5c71c5e53b65bb --> |
| 2026-08-31 | [Phase 2: WCAG 2.2 Semantic-Gap Coverage — v3.1.0](./2026-08-31-phase-2-wcag-2-2-semantic-gap-coverage-v3-1-0-996e626c58.md) | implemented | GitHub issue https://github.com/verndale/accessibility-standards/issues/15; src/coverage/wcag-2.2.yml: 37 covered, 8 partial, 10 gap; node --test tests/unit/*.test.mjs: 50 passing | standards-authority, semantic-pattern-model, ui-pattern-bindings, consumer-projections <!-- plan:996e626c583b0c4ca18b7cd5b090b66bc79338dc23dee0c65cb616c0c3ad8f35 --> |
<!-- wiki-plan-rows -->
