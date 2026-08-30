# Projection contract

Every consumer pins the package exactly and supplies `accessibility-standards.config.json` plus `accessibility-standards.routes.json`. A generated `accessibility.source.json` records package/profile/schema versions, source/config/route digests, projected IDs, and lane coverage.

`sync --if-needed` compares these digests, renders to a sibling temporary directory, validates the full projection, and atomically promotes marker-owned files. It refuses to replace an unmarked or locally modified managed output. `check` is read-only.
