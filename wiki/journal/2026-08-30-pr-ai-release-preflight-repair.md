---
date: 2026-08-30
topics: [sync-and-enforcement]
plans: [2026-08-30-repair-pr-ai-automation-and-release-preflight-704110024e.md]
issue: https://github.com/verndale/accessibility-standards/issues/6
pull_request: https://github.com/verndale/accessibility-standards/pull/7
branch: codex/fix-pr-ai-release-preflight
---
# PR AI automation and release-preflight repair

The `ai-commit` and `ai-pr` initializers were run using their default non-destructive mode. The PR workflow already existed, so initialization preserved it; it had supplied only `PR_BOT_TOKEN` to `ai-pr`, leaving the configured `PR_AI`, endpoint, model, and API key unavailable to the process. The workflow now maps those repository variables and secret explicitly, calls the generated `pr:create` script, tracks the environment template, and ignores local `.env` files.

PR 7 had already merged the v3 WCAG contract with commit `a94d3e3d731f76a4e07c7cd198600413dd4d2bc4`. That commit contains both a valid `feat(wcag)!` major-release header and a duplicate `BREAKING CHANGE:` footer. Release preflight intentionally rejects aggregate footers, so a strict one-time full-hash migration exception unblocks that historical commit without permitting any future footer. The regression test proves that a one-character hash change remains rejected.

Evidence: `pnpm release:preflight`, `pnpm release:preflight:selftest`, and `pnpm exec ai-pr --help` pass on the repair branch.
