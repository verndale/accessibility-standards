const OPS = new Set(['all', 'any', 'not', 'equals', 'contains', 'exists']);
const FACT_TYPES = new Set(['boolean', 'string', 'array']);

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertExactKeys(value, expected, label) {
  if (!isRecord(value)) throw new Error(`${label} requires an object operand`);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(required)) {
    throw new Error(`${label} requires exactly ${required.join(', ')}`);
  }
}

function assertValueType(value, fact, definition, op) {
  if (!FACT_TYPES.has(definition.type)) throw new Error(`Fact ${fact} has unsupported type ${definition.type ?? '<missing>'}`);
  if (op === 'contains') {
    if (definition.type !== 'array' && definition.type !== 'string') throw new Error(`contains is not valid for ${definition.type} fact ${fact}`);
    const expected = definition.type === 'array' ? definition.items : 'string';
    if (expected !== 'string') throw new Error(`Fact ${fact} has unsupported array item type ${expected ?? '<missing>'}`);
    if (typeof value !== expected) throw new Error(`${op} value for ${fact} must be ${expected}`);
    return;
  }
  if (definition.type === 'array') {
    if (definition.items !== 'string') throw new Error(`Fact ${fact} has unsupported array item type ${definition.items ?? '<missing>'}`);
    if (!Array.isArray(value) || value.some((item) => typeof item !== definition.items)) throw new Error(`${op} value for ${fact} must be an array of ${definition.items}`);
    return;
  }
  if (typeof value !== definition.type) throw new Error(`${op} value for ${fact} must be ${definition.type}`);
}

function assertObservedValueType(value, fact, definition) {
  if (!isRecord(definition) || !FACT_TYPES.has(definition.type)) throw new Error(`Fact ${fact} has unsupported type ${definition?.type ?? '<missing>'}`);
  if (definition.type === 'array') {
    if (definition.items !== 'string') throw new Error(`Fact ${fact} has unsupported array item type ${definition.items ?? '<missing>'}`);
    if (!Array.isArray(value) || value.some((item) => typeof item !== definition.items)) throw new Error(`Observed value for ${fact} must be an array of ${definition.items}`);
    return;
  }
  if (typeof value !== definition.type) throw new Error(`Observed value for ${fact} must be ${definition.type}`);
}

export function validateFactValues(catalog, values) {
  if (!isRecord(values)) throw new Error('Applicability fact values must be an object');
  const facts = catalog?.facts;
  if (!isRecord(facts)) throw new Error('Applicability fact catalog must be an object');
  for (const [fact, value] of Object.entries(values)) {
    if (value === undefined) continue;
    if (!facts[fact]) throw new Error(`Unknown observed applicability fact: ${fact}`);
    assertObservedValueType(value, fact, facts[fact]);
  }
}

export function validateExpression(expression, facts) {
  if (!isRecord(expression)) throw new Error('Applicability expression must be an object');
  const keys = Object.keys(expression ?? {});
  if (keys.length !== 1 || !OPS.has(keys[0])) throw new Error(`Unsupported applicability expression: ${keys.join(',') || '<empty>'}`);
  const [op] = keys;
  const operand = expression[op];
  if (op === 'all' || op === 'any') {
    if (!Array.isArray(operand) || !operand.length) throw new Error(`${op} requires a non-empty array`);
    operand.forEach((item) => validateExpression(item, facts));
    return;
  }
  if (op === 'not') {
    if (!isRecord(operand)) throw new Error('not requires an applicability expression');
    return validateExpression(operand, facts);
  }
  assertExactKeys(operand, op === 'exists' ? ['fact'] : ['fact', 'value'], op);
  const fact = operand?.fact;
  if (typeof fact !== 'string' || !facts?.[fact]) throw new Error(`Unknown applicability fact: ${fact ?? '<missing>'}`);
  const definition = facts[fact];
  if (!isRecord(definition) || !FACT_TYPES.has(definition.type)) throw new Error(`Fact ${fact} has unsupported type ${definition?.type ?? '<missing>'}`);
  if (definition.type === 'array' && definition.items !== 'string') throw new Error(`Fact ${fact} has unsupported array item type ${definition.items ?? '<missing>'}`);
  if (op !== 'exists') assertValueType(operand.value, fact, definition, op);
}

export function evaluate(expression, values) {
  const [op, operand] = Object.entries(expression)[0];
  if (op === 'all') return operand.every((item) => evaluate(item, values));
  if (op === 'any') return operand.some((item) => evaluate(item, values));
  if (op === 'not') return !evaluate(operand, values);
  const observed = values[operand.fact];
  if (op === 'exists') return observed !== undefined && observed !== null;
  if (op === 'equals') {
    if (Array.isArray(observed) && Array.isArray(operand.value)) {
      return observed.length === operand.value.length && observed.every((value, index) => value === operand.value[index]);
    }
    return observed === operand.value;
  }
  if (op === 'contains') {
    if (Array.isArray(observed)) return observed.includes(operand.value);
    return typeof observed === 'string' && observed.includes(operand.value);
  }
  throw new Error(`Unsupported operator: ${op}`);
}

export function resolveUiPatternBindings(contract, facts, values = {}) {
  validateFactValues(facts, values);
  const observed = values['component.ui_pattern_ids'];
  if (observed === undefined || observed === null) {
    return {
      source: contract.source,
      ui_pattern_ids: [],
      semantic_ids: [],
      pattern_ids: [],
      baseline_only_ui_pattern_ids: [],
      candidate_evaluations: []
    };
  }
  if (!Array.isArray(observed) || observed.some((value) => typeof value !== 'string' || !value)) {
    throw new Error('component.ui_pattern_ids must be an array of non-empty canonical UI Design Brain slugs');
  }
  const uiPatternIds = [...new Set(observed)];
  const byUiPatternId = new Map(contract.bindings.map((binding) => [binding.ui_pattern_id, binding]));
  const unknown = uiPatternIds.filter((id) => !byUiPatternId.has(id));
  if (unknown.length) throw new Error(`Unknown UI Design Brain pattern IDs: ${unknown.join(', ')}`);

  const patternIds = new Set();
  const semanticIds = new Set();
  const baselineOnly = [];
  const candidateEvaluations = [];
  for (const uiPatternId of uiPatternIds) {
    const binding = byUiPatternId.get(uiPatternId);
    for (const semanticId of binding.baseline_semantic_ids ?? []) semanticIds.add(semanticId);
    for (const patternId of binding.pattern_ids ?? []) patternIds.add(patternId);
    if (binding.classification === 'baseline-only') baselineOnly.push(uiPatternId);
    for (const candidate of binding.candidates ?? []) {
      const requiredFacts = referencedFacts(candidate.when).sort();
      const missingFacts = requiredFacts.filter((fact) => values[fact] === undefined);
      const applicable = !missingFacts.length && evaluate(candidate.when, values);
      if (applicable) patternIds.add(candidate.pattern_id);
      candidateEvaluations.push({
        ui_pattern_id: uiPatternId,
        pattern_id: candidate.pattern_id,
        discriminator_facts: requiredFacts,
        missing_facts: missingFacts,
        trigger_state: missingFacts.length ? 'candidate' : applicable ? 'applicable' : 'not_applicable',
        resolution_state: missingFacts.length ? 'needs_input' : applicable ? 'resolved' : 'skipped'
      });
    }
  }
  return {
    source: contract.source,
    ui_pattern_ids: uiPatternIds,
    semantic_ids: [...semanticIds].sort(),
    pattern_ids: [...patternIds].sort(),
    baseline_only_ui_pattern_ids: baselineOnly,
    candidate_evaluations: candidateEvaluations
  };
}

export function compileApplicability(matrix, facts, values = {}) {
  validateFactValues(facts, values);
  return matrix.rows.map((row, index) => {
    validateExpression(row.when, facts.facts);
    const observed = referencedFacts(row.when).every((fact) => values[fact] !== undefined);
    const applicable = observed && evaluate(row.when, values);
    return {
      ...row,
      order: index,
      trigger_state: observed ? (applicable ? 'applicable' : 'not_applicable') : 'unobserved',
      resolution_state: observed ? (applicable ? 'resolved' : 'skipped') : 'needs_input'
    };
  });
}

export function referencedFacts(expression) {
  const [op, operand] = Object.entries(expression)[0];
  if (op === 'all' || op === 'any') return [...new Set(operand.flatMap(referencedFacts))];
  if (op === 'not') return referencedFacts(operand);
  return [operand.fact];
}

export const triggerStates = ['unobserved', 'not_applicable', 'candidate', 'applicable'];
export const resolutionStates = ['skipped', 'needs_confirmation', 'needs_input', 'resolved', 'deferred', 'conflict'];
