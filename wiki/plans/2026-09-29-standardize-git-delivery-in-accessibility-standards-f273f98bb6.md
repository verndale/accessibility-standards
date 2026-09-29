---
status: "implemented"
executed: true
evidence: ["verndale/accessibility-standards#24; AGENTS.md; .github/workflows/release.yml; scripts/validate_pr_body.cjs"]
source_tool: "codex"
source: "2026-09-28 approved cross-repository Git delivery plan"
topics: ["sync-and-enforcement"]
digest: "f273f98bb63ddb265573b3db14f25358b5ec8af6ded4329a29fd78aa29a68427"
---

# Standardize Git delivery in accessibility-standards

- Remove ai-pr, ai-commit, pr:create, automatic PR creation, and legacy paths.
- Use standalone Commitlint and deterministic issue-linked PR title and body.
- Document the updated-main issue branch and open-PR flow in AGENTS.md.
- Keep wiki bot PRs on direct gh commands and BOT_TOKEN.
- Gate Release on successful Quality from a push to main, preserve npm trusted publishing, and make tooling commits nonreleasing.
- Verify hooks, Actions, release policy, wiki graph, and the full repository gate; open a PR without merging.
