# Authoring

Records are JSON-compatible YAML with stable, globally unique IDs. Semantic records own element, role, name, state, keyboard, focus, live-region, form, table, and media obligations. Pattern records compose those IDs and add activation facts, interaction behavior, product decisions, artifact bindings, implementation outcomes, and evidence routes.

Applicability conditions may use only `all`, `any`, `not`, `equals`, `contains`, and `exists`. Questions are limited to missing trigger facts or product-owned decisions; standards-owned outcomes are automatic.

## UI pattern bindings

`src/applicability/ui-design-brain-bindings.yml` pins one immutable UI Design Brain catalog manifest. Keep its 80 canonical slugs sorted and classify every slug exactly once:

- `direct` adds its sorted accessibility `pattern_ids` automatically.
- `candidate` may add unconditional `pattern_ids`, but every conditional candidate must name the exact typed discriminator facts used by its applicability expression.
- `baseline-only` selects no specialized accessibility pattern from the UI name alone and must declare sorted `baseline_semantic_ids` for the capabilities implied by that canonical UI pattern; matrix facts still apply afterward.

Do not add aliases to this file. UI Design Brain resolves an alias to a canonical slug before the accessibility resolver runs. Unknown slugs, unknown or incorrectly typed facts, missing semantic/pattern IDs, baseline-only entries without semantic outcomes, duplicate bindings, unsorted IDs, or candidate expressions whose referenced facts differ from `discriminator_facts` fail validation.
