# Context wiki

This wiki is the durable project record for decisions, executed plans, and substantive change history.

## Start here

- [Wiki mechanics](./MECHANICS.md) — authoring, plan capture, validation, and automation.
- [Plan ledger](./plans/INDEX.md) — executed-plan archives and historical audit results.
- `wiki/topics/` — durable decision and domain pages.
- `wiki/journal/` — chronological substantive-change entries.
- `wiki/connections.md` — generated relationship summary.

## Accessibility standards

- [Standards authority](./topics/standards-authority.md)
- [Semantic and pattern model](./topics/semantic-pattern-model.md)
- [UI pattern bindings](./topics/ui-pattern-bindings.md)
- [Consumer projections](./topics/consumer-projections.md)
- [Sync and enforcement](./topics/sync-and-enforcement.md)
- [Shared Accessibility Standards Delivery Plan](./plans/2026-08-30-shared-accessibility-standards-delivery.md) — partial
- [2026-08-31 schema-2 UI projector maintenance journal](./journal/2026-08-31-schema-2-ui-projector-maintenance.md)
- [2026-08-30 delivery journal](./journal/2026-08-30-shared-accessibility-standards.md)

For a direct single-topic history or rationale question, use the links above and open only the page they route to. Only for a cross-page question, run `node scripts/wiki/navigate.cjs --intent why --query "<terms>"` (or `wiring` / `impact`) and read only its byte-counted itinerary. Never bulk-load `wiki/` or `scripts/wiki/graph/data/graph.json`. If navigation returns candidates or no route, retry with exact Source and Target node IDs; if ambiguity remains, ask one focused question or use one targeted `rg`.

The interactive Sigma.js viewer starts at http://127.0.0.1:4173/ after `node scripts/wiki/build-graph.cjs` then `node scripts/wiki/serve-graph.cjs`. Its Source and Target controls use the same weighted route policy. If that port is occupied, the server selects the next available port and prints its URL; set `GRAPH_PORT` to require a specific port.
