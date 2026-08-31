# Authoring

Records are JSON-compatible YAML with stable, globally unique IDs. Semantic records own element, role, name, state, keyboard, focus, live-region, form, table, and media obligations. Pattern records compose those IDs and add activation facts, interaction behavior, product decisions, artifact bindings, implementation outcomes, and evidence routes.

Semantic and pattern records declare `standards_refs`. Each reference names a source authority, stable identifier, official URL, and whether the source is normative; WCAG criterion references also declare their conformance level. WCAG success criteria are normative. WCAG Understanding documents and ARIA Authoring Practices Guide patterns are informative guidance and must not be represented as independent conformance requirements.

`src/coverage/wcag-2.2.yml` accounts for every WCAG 2.2 Level A and AA success criterion exactly once. A `covered` row maps to complete semantic obligations, `partial` identifies an intentionally visible shortfall, and `gap` records work not yet represented. Criterion coverage is granted only through mapped semantic obligations: a pattern-level standards reference records provenance but does not, by itself, change a coverage status. Pattern records inherit normative requirements through semantic dependencies, and adding an APG citation never changes WCAG coverage.

Applicability conditions may use only `all`, `any`, `not`, `equals`, `contains`, and `exists`. Questions are limited to missing trigger facts or product-owned decisions; standards-owned outcomes are automatic.

## UI pattern bindings

`src/applicability/ui-design-brain-bindings.yml` pins one immutable UI Design Brain catalog manifest. Keep every canonical slug from that manifest sorted and classify it exactly once:

- `direct` adds its sorted accessibility `pattern_ids` automatically.
- `candidate` may add unconditional `pattern_ids`, but every conditional candidate must name the exact typed discriminator facts used by its applicability expression.
- `baseline-only` selects no specialized accessibility pattern from the UI name alone and must declare sorted `baseline_semantic_ids` for the capabilities implied by that canonical UI pattern; matrix facts still apply afterward.

Do not add aliases to this file. UI Design Brain resolves an alias to a canonical slug before the accessibility resolver runs. Unknown slugs, unknown or incorrectly typed facts, missing semantic/pattern IDs, baseline-only entries without semantic outcomes, duplicate bindings, unsorted IDs, or candidate expressions whose referenced facts differ from `discriminator_facts` fail validation.

Every specialized pattern must be reachable from either a UI Design Brain binding or an applicability row. Prefer native HTML and baseline semantics when a component has no authored interaction state machine; do not create pattern records solely to mirror the APG catalog.
