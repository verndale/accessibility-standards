---
status: "implemented"
executed: true
evidence: ["PR #7 merge commit a94d3e3d731f76a4e07c7cd198600413dd4d2bc4", "pnpm release:preflight", "pnpm release:preflight:selftest"]
source_tool: "codex"
source: "Codex repair request on 2026-08-30"
topics: ["sync-and-enforcement"]
digest: "704110024ec9dc7d387289f1bea5580ceb78e31cd3a7fabb6d5c71c5e53b65bb"
---

# Repair PR AI automation and release preflight

## Outcome

Enable the configured bounded PR AI summary in GitHub Actions and unblock the v3 release without rewriting merged `main` history.

## Steps

1. Run the repository's `ai-commit` and `ai-pr` initializers with their default non-destructive behavior.
2. Persist the `ai-pr` script, environment example, lockfile update, local environment ignore rules, and GitHub Actions mappings for the existing `PR_AI*` repository configuration.
3. Preserve future rejection of aggregate `BREAKING CHANGE:` commit bodies while allowing only the already-merged v3 commit that duplicated an otherwise valid `feat(wcag)!` release marker.
4. Add regression coverage, validate release preflight and PR automation availability, record the decision in the wiki, then verify and push a repair branch from merged `main`.
