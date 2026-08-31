import assert from 'node:assert/strict';
import test from 'node:test';
import { buildArtifacts } from '../../lib/render.mjs';
import { buildProjectionManifest } from '../../lib/build-manifest.mjs';
import { compileApplicability, evaluate, resolveUiPatternBindings, resolutionStates, triggerStates } from '../../lib/compile-applicability.mjs';
import { loadStandards } from '../../lib/load.mjs';
import { profileContractDigest, sourceContractDigest } from '../../lib/provenance.mjs';
import { validateStandards } from '../../lib/validate.mjs';

test('source contracts validate with stable IDs and complete dependencies', async () => {
  const data = await loadStandards();
  const result = validateStandards(data);
  assert.equal(result.records, data.foundations.length + data.semantics.length + data.patterns.length + data.policies.length);
  assert.equal(result.semantics, data.semantics.length);
  assert.equal(result.patterns, data.patterns.length);
  assert.equal(result.applicability, data.matrix.rows.length);
  assert.equal(result.uiPatternBindings, data.uiDesignBrainBindings.source.pattern_count);
  assert.equal(result.wcagCriteria, 55);
  assert.equal(new Set(data.semantics.map(({ id }) => id)).size, data.semantics.length);
  assert.equal(new Set(data.patterns.map(({ id }) => id)).size, data.patterns.length);
});

test('source validation fails closed for malformed authority and applicability contracts', async () => {
  const data = await loadStandards();
  const expectInvalid = (mutate, pattern) => {
    const candidate = structuredClone(data);
    mutate(candidate);
    assert.throws(() => validateStandards(candidate), pattern);
  };

  expectInvalid((candidate) => { delete candidate.semantics[0].requirement; }, /has no requirement/);
  expectInvalid((candidate) => { delete candidate.patterns[0].product_decisions; }, /product decisions must be a non-empty array/);
  expectInvalid((candidate) => { candidate.matrix.rows[0].when.equals.value = 'true'; }, /must be boolean/);
  expectInvalid((candidate) => { candidate.matrix.rows.push(structuredClone(candidate.matrix.rows[0])); }, /Duplicate applicability row/);
  expectInvalid((candidate) => {
    candidate.evidence.proof_kinds.foo = { purpose: 'unsupported', required_capability: 'foo' };
    candidate.semantics[0].proof.push('foo');
  }, /Evidence routes must be exactly unit, axe, e2e, and human/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'button').baseline_semantic_ids = []; }, /baseline-only mapping must declare at least one baseline semantic/);
  expectInvalid((candidate) => { candidate.semantics[0].unexpected = true; }, /has unsupported fields: unexpected/);
  expectInvalid((candidate) => { candidate.patterns[0].unexpected = true; }, /has unsupported fields: unexpected/);
  expectInvalid((candidate) => { candidate.semantics[0] = null; }, /Malformed semantic record/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings[0] = null; }, /Malformed UI Design Brain binding/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings.find(({ pattern_ids }) => pattern_ids).pattern_ids = 42; }, /pattern_ids must be an array/);
  expectInvalid((candidate) => { candidate.wcagCoverage.criteria[0].semantic_ids = 42; }, /semantic_ids must be an array/);
  expectInvalid((candidate) => {
    candidate.sources.authorities.push({ id: 'example-standard', url: 'https://example.com/', normative: false });
    candidate.sources.precedence.push('example-standard');
  }, /Unsupported standards authority example-standard/);
});

test('applicability uses deterministic states and allowed expressions', async () => {
  const data = await loadStandards();
  const result = compileApplicability(data.matrix, data.facts, { 'component.ui_pattern_ids': ['modal'] });
  assert.equal(result.find(({ id }) => id === 'applicability.overlays').trigger_state, 'applicable');
  assert.equal(result.find(({ id }) => id === 'applicability.overlays').resolution_state, 'resolved');
  assert.deepEqual(triggerStates, ['unobserved', 'not_applicable', 'candidate', 'applicable']);
  assert.deepEqual(resolutionStates, ['skipped', 'needs_confirmation', 'needs_input', 'resolved', 'deferred', 'conflict']);
  assert.equal(evaluate({ all: [{ exists: { fact: 'x' } }, { equals: { fact: 'x', value: true } }] }, { x: true }), true);
  assert.throws(() => compileApplicability(data.matrix, data.facts, { 'artifact.page_context': 'true' }), /Observed value for artifact.page_context must be boolean/);
  assert.throws(() => resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': ['select'], 'component.selection_model': 42 }), /Observed value for component.selection_model must be string/);
});

test('form validation is independently applicable and creates no inactive boilerplate', async () => {
  const data = await loadStandards();
  const withoutValidation = compileApplicability(data.matrix, data.facts, {
    'component.has_form_fields': true,
    'component.has_validation': false
  });
  assert.deepEqual(withoutValidation.find(({ id }) => id === 'applicability.forms').outcomes, ['pattern.field']);
  assert.equal(withoutValidation.find(({ id }) => id === 'applicability.validation').trigger_state, 'not_applicable');
  const withValidation = compileApplicability(data.matrix, data.facts, {
    'component.has_form_fields': true,
    'component.has_validation': true
  });
  assert.equal(withValidation.find(({ id }) => id === 'applicability.validation').trigger_state, 'applicable');
  assert.deepEqual(withValidation.find(({ id }) => id === 'applicability.validation').outcomes, ['pattern.validation']);
});

test('all UI Design Brain slugs are explicitly classified and modal maps to dialog', async () => {
  const data = await loadStandards();
  const expectedIds = 'accordion,alert,avatar,badge,breadcrumbs,button,button-group,card,carousel,checkbox,color-picker,combobox,comparison-table,context-menu,date-input,datepicker,drawer,dropdown-menu,empty-state,error-message,eyebrow,fieldset,file,file-upload,filter,footer,form,header,heading,helper-text,hero,icon,image,in-page-navigation,label,link,list,logo-bar,marquee,masthead,media-object,mega-menu,modal,navigation,number-input,pagination,popover,progress-bar,progress-indicator,quote,radio-button,rating,rich-text,rich-text-editor,search-input,search-overlay,section-header,segmented-control,select,separator,sidebar,skeleton,skip-link,slider,spinner,stack,stat,stepper,table,tabs,text-input,textarea,toast,toggle,tooltip,tree-view,utility-bar,video,visually-hidden,wizard'.split(',');
  assert.deepEqual(data.uiDesignBrainBindings.bindings.map(({ ui_pattern_id }) => ui_pattern_id), expectedIds);
  assert.deepEqual(
    Object.fromEntries(['direct', 'candidate', 'baseline-only'].map((classification) => [classification, data.uiDesignBrainBindings.bindings.filter((binding) => binding.classification === classification).length])),
    { direct: 32, candidate: 13, 'baseline-only': 35 }
  );
  assert.deepEqual(data.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'modal'), {
    ui_pattern_id: 'modal',
    classification: 'direct',
    pattern_ids: ['pattern.dialog']
  });
  assert.ok(data.uiDesignBrainBindings.bindings.filter(({ classification }) => classification === 'baseline-only').every(({ baseline_semantic_ids }) => baseline_semantic_ids?.length));
  assert.deepEqual(resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': ['button'] }).semantic_ids, [
    'semantics.accessible-name',
    'semantics.focus.visible',
    'semantics.keyboard',
    'semantics.name-role-value',
    'semantics.native-elements',
    'semantics.target-size'
  ]);
});

test('UI pattern resolution preserves caller order and stable-sorts expanded patterns', async () => {
  const data = await loadStandards();
  const result = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['tabs', 'modal', 'tabs']
  });
  assert.deepEqual(result.ui_pattern_ids, ['tabs', 'modal']);
  assert.deepEqual(result.pattern_ids, ['pattern.dialog', 'pattern.tabs']);
});

test('candidate UI mappings expose missing discriminators and resolve without prose inference', async () => {
  const data = await loadStandards();
  const unresolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['select']
  });
  assert.deepEqual(unresolved.pattern_ids, ['pattern.field']);
  assert.deepEqual(unresolved.candidate_evaluations.map(({ pattern_id, trigger_state, resolution_state, missing_facts }) => ({ pattern_id, trigger_state, resolution_state, missing_facts })), [
    { pattern_id: 'pattern.combobox', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.selection_model'] },
    { pattern_id: 'pattern.listbox', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.selection_model'] }
  ]);

  const resolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['select'],
    'component.selection_model': 'listbox'
  });
  assert.deepEqual(resolved.pattern_ids, ['pattern.field', 'pattern.listbox']);
  assert.equal(resolved.candidate_evaluations.find(({ pattern_id }) => pattern_id === 'pattern.listbox').resolution_state, 'resolved');
  assert.throws(() => resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': ['dialog'] }), /Unknown UI Design Brain pattern IDs: dialog/);
});

test('profile projections are byte stable and semantics precede patterns', async () => {
  const data = await loadStandards();
  const first = buildArtifacts(data, 'ai-orchestration');
  const second = buildArtifacts(data, 'ai-orchestration');
  assert.deepEqual([...first], [...second]);
  const implementation = first.get('implementation');
  assert.ok(implementation.indexOf('semantics.accessible-name') < implementation.indexOf('pattern.dialog'));
  for (const profile of ['conductor', 'ai-orchestration']) {
    const artifacts = buildArtifacts(data, profile);
    const bindings = JSON.parse(artifacts.get('uiDesignBrainBindings'));
    assert.equal(bindings.schema_version, 3);
    assert.equal(bindings.binding_schema_version, 1);
    assert.equal(bindings.source.package_version, '1.16.0');
    assert.equal(bindings.source.catalog_authority_version, '1.15.1');
    assert.equal(bindings.source.source_digest, 'sha256:1eda596fe341786b5ada25742b6487bc06685fff17cbd582bc1b58302097e3ff');
    assert.equal(bindings.source.manifest_digest, 'sha256:63a0bc8d9537d6d4c0aef8fd8a539bf4a9181a50d0761bd63eae6fe59b4eddc9');
    assert.match(bindings.binding_digest, /^[a-f0-9]{64}$/);
    assert.equal(bindings.bindings.length, bindings.source.pattern_count);
    const coverage = JSON.parse(artifacts.get('coverageManifest'));
    assert.equal(coverage.ui_design_brain.binding_digest, bindings.binding_digest);
    assert.deepEqual(coverage.ui_pattern_ids, bindings.bindings.map(({ ui_pattern_id }) => ui_pattern_id));
  }
});

test('canonical projections ignore JSON object insertion order', async () => {
  const data = await loadStandards();
  const reordered = structuredClone(data);
  reordered.facts.facts = Object.fromEntries(Object.entries(reordered.facts.facts).reverse());
  reordered.evidence.proof_kinds = Object.fromEntries(Object.entries(reordered.evidence.proof_kinds).reverse());
  reordered.semantics[0] = Object.fromEntries(Object.entries(reordered.semantics[0]).reverse());
  reordered.patterns[0].activation = Object.fromEntries(Object.entries(reordered.patterns[0].activation).reverse());
  reordered.uiDesignBrainBindings.bindings[0] = Object.fromEntries(Object.entries(reordered.uiDesignBrainBindings.bindings[0]).reverse());

  assert.equal(sourceContractDigest(reordered), sourceContractDigest(data));
  for (const profile of ['conductor', 'ai-orchestration']) {
    assert.deepEqual([...buildArtifacts(reordered, profile)], [...buildArtifacts(data, profile)]);
  }
});

test('provenance covers all authority inputs while keeping source compatibility cross-profile', async () => {
  const data = await loadStandards();
  const sourceDigest = sourceContractDigest(data);
  assert.equal(sourceDigest, sourceContractDigest(data));
  assert.notEqual(profileContractDigest(data, 'conductor'), profileContractDigest(data, 'ai-orchestration'));
  const changedTemplate = structuredClone(data);
  changedTemplate.profileTemplates.conductor['semantics/README.md'] += '\nChanged projection guidance.\n';
  assert.notEqual(profileContractDigest(changedTemplate, 'conductor'), profileContractDigest(data, 'conductor'));
  assert.notEqual(sourceContractDigest(changedTemplate), sourceDigest);
  const changedFacts = structuredClone(data);
  changedFacts.facts.facts['test.valid_flag'] = { type: 'boolean' };
  assert.notEqual(sourceContractDigest(changedFacts), sourceDigest);
  const changedSchema = structuredClone(data);
  changedSchema.schemas['semantic.schema.json'].description = 'Changed published schema contract.';
  assert.notEqual(sourceContractDigest(changedSchema), sourceDigest);

  const artifacts = buildArtifacts(data, 'conductor');
  const coverage = JSON.parse(artifacts.get('coverageManifest'));
  const manifest = buildProjectionManifest({ data, profile: 'conductor', config: {}, routes: {}, artifacts });
  const aiManifest = buildProjectionManifest({ data, profile: 'ai-orchestration', config: {}, routes: {}, artifacts: buildArtifacts(data, 'ai-orchestration') });
  assert.equal(manifest.digests.source, sourceDigest);
  assert.equal(aiManifest.digests.source, manifest.digests.source);
  assert.notEqual(aiManifest.digests.profile, manifest.digests.profile);
  assert.deepEqual(manifest.lane_coverage, coverage.lane_coverage);
  assert.ok(manifest.lane_coverage.e2e.includes('semantics.form-label'));
  assert.ok(manifest.lane_coverage.axe.includes('semantics.native-elements'));
  const semantics = JSON.parse(artifacts.get('semanticsJson'));
  assert.equal(semantics.foundations.length, 3);
  assert.equal(semantics.policies.length, 2);
  const applicability = JSON.parse(artifacts.get('applicabilityMatrix'));
  assert.deepEqual(Object.keys(applicability.evidence.proof_kinds).sort(), ['axe', 'e2e', 'human', 'unit']);
});
