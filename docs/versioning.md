# Versioning

- Authority, behavior, schema changes, or ID removals are major.
- Additive stable records are minor.
- Editorial-only corrections are patch.

Consumers accept only compatible package/profile/schema versions. Older same-major source contracts may use only IDs available in that version. Newer sources and major mismatches fail closed. Legacy unstamped artifacts warn; new or revised artifacts require a contract.

Schema 4 is established at `4.0.0`. It adds the HTML Standard and ARIA in HTML as normative authorities, complete WAI-ARIA APG pattern/practice traceability, new semantic and pattern IDs, enumerated applicability facts, new UI candidates, fact-inclusive binding provenance, strict manifest inventories, and an `aria_apg` projection member. Those authority, behavior, and output-shape changes are intentionally major. Schema 3 was established at `3.0.0`; version `3.2.0` completed semantic traceability for all 55 WCAG 2.2 Level A/AA criteria. Schema 2 at `2.0.0` introduced deterministic UI Design Brain bindings but cannot express criterion-level provenance or coverage status. Version `1.0.0` predates those bindings and must never be used as provenance for generated binding outputs. A UI catalog version or manifest-digest change is an explicit dependency upgrade; a binding authority or schema change follows this package's major-version policy.

## Release and consumer update path

Before a source PR merges, set the package, contract, profile, schema, validator,
and projection-test versions to the release computed from its conventional
commits. `pnpm verify:ci` starts with the same release preflight used by the
main-branch publisher, so a missing target alignment fails on the PR instead
of after merge.

After npm publishes the release, each consumer performs one explicit update:

1. Pin the exact package version in its dependency manifest and
   `accessibility-standards.config.json` in the same change.
2. Run the repository-native `accessibility:sync` command and review every
   marker-owned generated output; never edit those outputs manually.
3. Update consumer runtime schema/version gates only when the published
   contract requires it.
4. Run `accessibility:check` and the repository's full verification command
   before commit and again in CI.

Sync uses only the exact installed package, validates config and routes, and
promotes the complete projection atomically. Package identity, profile and
schema versions, source/config/route digests, UI Design Brain provenance, and
binding digests fail closed, making repeated syncs byte-stable no-ops.
