const OPS = new Set(['all', 'any', 'not', 'equals', 'contains', 'exists']);

export function validateExpression(expression, facts) {
  const keys = Object.keys(expression ?? {});
  if (keys.length !== 1 || !OPS.has(keys[0])) throw new Error(`Unsupported applicability expression: ${keys.join(',') || '<empty>'}`);
  const [op] = keys;
  const operand = expression[op];
  if (op === 'all' || op === 'any') {
    if (!Array.isArray(operand) || !operand.length) throw new Error(`${op} requires a non-empty array`);
    operand.forEach((item) => validateExpression(item, facts));
    return;
  }
  if (op === 'not') return validateExpression(operand, facts);
  const fact = operand?.fact;
  if (!fact || !facts[fact]) throw new Error(`Unknown applicability fact: ${fact ?? '<missing>'}`);
  if (op !== 'exists' && !Object.hasOwn(operand, 'value')) throw new Error(`${op} requires value`);
}

export function evaluate(expression, values) {
  const [op, operand] = Object.entries(expression)[0];
  if (op === 'all') return operand.every((item) => evaluate(item, values));
  if (op === 'any') return operand.some((item) => evaluate(item, values));
  if (op === 'not') return !evaluate(operand, values);
  const observed = values[operand.fact];
  if (op === 'exists') return observed !== undefined && observed !== null;
  if (op === 'equals') return observed === operand.value;
  if (op === 'contains') {
    if (Array.isArray(operand.value)) return operand.value.includes(observed);
    if (Array.isArray(observed)) return observed.includes(operand.value);
    return typeof observed === 'string' && observed.includes(String(operand.value));
  }
  throw new Error(`Unsupported operator: ${op}`);
}

export function compileApplicability(matrix, facts, values = {}) {
  return matrix.rows.map((row, index) => {
    validateExpression(row.when, facts.facts);
    const observed = referencedFacts(row.when).every((fact) => Object.hasOwn(values, fact));
    return {
      ...row,
      order: index,
      trigger_state: observed ? (evaluate(row.when, values) ? 'applicable' : 'not_applicable') : 'unobserved',
      resolution_state: observed ? (evaluate(row.when, values) ? 'needs_confirmation' : 'skipped') : 'needs_input'
    };
  });
}

function referencedFacts(expression) {
  const [op, operand] = Object.entries(expression)[0];
  if (op === 'all' || op === 'any') return [...new Set(operand.flatMap(referencedFacts))];
  if (op === 'not') return referencedFacts(operand);
  return [operand.fact];
}

export const triggerStates = ['unobserved', 'not_applicable', 'candidate', 'applicable'];
export const resolutionStates = ['skipped', 'needs_confirmation', 'needs_input', 'resolved', 'deferred', 'conflict'];
