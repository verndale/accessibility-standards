---
date: 2026-09-29
topics: [sync-and-enforcement]
issue: https://github.com/verndale/accessibility-standards/issues/30
issues: ["https://github.com/verndale/accessibility-standards/issues/30"]
---
# Focus wiki Quality and harden bot replay

Wiki-only bot PRs and main pushes used the complete package gate despite the separate Wiki integrity check. Quality now keeps its named result but runs the existing wiki check for changes confined to `wiki/` and generated graph data. Code, workflow, manual, empty, and unavailable ranges still use `verify:ci`.

Both wiki workflows previously used GitHub CLI GraphQL lookup/edit calls for existing bot PRs. The same pattern failed with repository-scoped BOT_TOKEN during a verified UI Design Library replay. They now use repository REST endpoints for lookup, reopening, and title/body updates while preserving reviewable branches and the Monday issue schedule.

The npm Release policy and the full substantive gate remain unchanged. Verify the focused path on the next wiki bot PR and main push.
