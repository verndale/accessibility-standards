import assert from 'node:assert/strict';
import test from 'node:test';
import { buildArtifacts } from '../../lib/render.mjs';
import { compileApplicability, evaluate, resolutionStates, triggerStates } from '../../lib/compile-applicability.mjs';
import { loadStandards } from '../../lib/load.mjs';
import { validateStandards } from '../../lib/validate.mjs';

test('source contracts validate with stable IDs and complete dependencies', async () => {
  const data = await loadStandards();
  assert.deepEqual(validateStandards(data), { records: 49, semantics: 25, patterns: 19, applicability: 18 });
  assert.equal(new Set(data.semantics.map(({ id }) => id)).size, 25);
  assert.equal(new Set(data.patterns.map(({ id }) => id)).size, 19);
});

test('applicability uses deterministic states and allowed expressions', async () => {
  const data = await loadStandards();
  const result = compileApplicability(data.matrix, data.facts, { 'component.pattern': 'dialog' });
  assert.equal(result.find(({ id }) => id === 'applicability.overlays').trigger_state, 'applicable');
  assert.deepEqual(triggerStates, ['unobserved', 'not_applicable', 'candidate', 'applicable']);
  assert.deepEqual(resolutionStates, ['skipped', 'needs_confirmation', 'needs_input', 'resolved', 'deferred', 'conflict']);
  assert.equal(evaluate({ all: [{ exists: { fact: 'x' } }, { equals: { fact: 'x', value: true } }] }, { x: true }), true);
});

test('profile projections are byte stable and semantics precede patterns', async () => {
  const data = await loadStandards();
  const first = buildArtifacts(data, 'ai-orchestration');
  const second = buildArtifacts(data, 'ai-orchestration');
  assert.deepEqual([...first], [...second]);
  const implementation = first.get('implementation');
  assert.ok(implementation.indexOf('semantics.accessible-name') < implementation.indexOf('pattern.dialog'));
});
