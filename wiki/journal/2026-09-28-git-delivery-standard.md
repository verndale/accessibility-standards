---
date: 2026-09-28
topics: [sync-and-enforcement]
plans: [2026-09-29-standardize-git-delivery-in-accessibility-standards-f273f98bb6.md]
issue: https://github.com/verndale/accessibility-standards/issues/24
branch: codex/24-git-delivery
---
# Deterministic Git delivery

Issue [24](https://github.com/verndale/accessibility-standards/issues/24) tracks the replacement of AI commit and PR tools. The repository now uses standalone Commitlint, an issue-linked PR template and body validator, and an AGENTS flow from updated `main` to an open review PR. The push-triggered PR Action and AI environment example are removed. Wiki Actions use `BOT_TOKEN` and their existing direct `gh` PR calls.

Release now follows successful Quality on a push to `main`, checks the tested revision, and refuses untested substantive descendants. Tooling commits are nonreleasing; public npm publication remains available for release-eligible commits. Existing wiki bot branches and issue-state reconciliation remain reviewable. Issue-state reconciliation follows the example repository's Monday 11:30 UTC schedule.

Verification includes release-preflight self-tests, release analyzer checks, Commitlint, wiki validation, and `pnpm run verify:ci`. The PR is left open for review; no merge or package publication is part of this delivery.
