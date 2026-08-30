import { compileApplicability } from './compile-applicability.mjs';

export function validateStandards(data) {
  const errors = [];
  const records = [...data.foundations, ...data.semantics, ...data.patterns, ...data.policies];
  const ids = new Set();
  for (const record of records) {
    if (!record.id || !record.version || !record.title) errors.push(`Malformed record: ${JSON.stringify(record)}`);
    if (ids.has(record.id)) errors.push(`Duplicate authority: ${record.id}`);
    ids.add(record.id);
  }
  const semanticIds = new Set(data.semantics.map(({ id }) => id));
  for (const pattern of data.patterns) {
    if (!pattern.requires?.length) errors.push(`Orphan pattern: ${pattern.id}`);
    for (const dependency of pattern.requires ?? []) if (!semanticIds.has(dependency)) errors.push(`${pattern.id} has missing semantic dependency ${dependency}`);
    if (!pattern.activation || !pattern.scope || !pattern.behavior?.length || !pattern.functional_spec_bindings?.length || !pattern.implementation_outcomes?.length || !pattern.evidence_routes?.length) errors.push(`Incomplete pattern contract: ${pattern.id}`);
  }
  const proofKinds = new Set(Object.keys(data.evidence.proof_kinds));
  for (const semantic of data.semantics) for (const route of semantic.proof ?? []) if (!proofKinds.has(route)) errors.push(`${semantic.id} uses unsupported proof route ${route}`);
  for (const pattern of data.patterns) for (const route of pattern.evidence_routes ?? []) if (!proofKinds.has(route)) errors.push(`${pattern.id} uses unsupported proof route ${route}`);
  for (const row of data.matrix.rows) {
    try { compileApplicability({ rows: [row] }, data.facts); } catch (error) { errors.push(`${row.id}: ${error.message}`); }
    for (const outcome of row.outcomes) if (!ids.has(outcome)) errors.push(`${row.id} references unknown outcome ${outcome}`);
    for (const route of row.evidence) if (!proofKinds.has(route)) errors.push(`${row.id} uses unsupported proof route ${route}`);
  }
  const lanes = new Set([...data.semantics.flatMap((item) => item.proof), ...data.patterns.flatMap((item) => item.evidence_routes), ...data.matrix.rows.flatMap((item) => item.evidence)]);
  for (const lane of proofKinds) if (!lanes.has(lane)) errors.push(`Dead evidence lane: ${lane}`);
  if (data.matrix.rows.length !== 18) errors.push(`Expected 18 applicability rows, found ${data.matrix.rows.length}`);
  if (errors.length) throw new Error(errors.join('\n'));
  return { records: records.length, semantics: data.semantics.length, patterns: data.patterns.length, applicability: data.matrix.rows.length };
}
