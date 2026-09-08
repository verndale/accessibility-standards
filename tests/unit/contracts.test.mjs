import assert from 'node:assert/strict';
import test from 'node:test';
import { buildArtifacts } from '../../lib/render.mjs';
import { buildProjectionManifest } from '../../lib/build-manifest.mjs';
import { compileApplicability, evaluate, resolveUiPatternBindings, resolutionStates, triggerStates, validateExpression } from '../../lib/compile-applicability.mjs';
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
  assert.deepEqual(result.apgCoverage, { patterns: 30, practices: 7 });
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
  expectInvalid((candidate) => { candidate.package.name = '@example/accessibility-standards'; }, /Installed package name @example\/accessibility-standards is invalid/);
  expectInvalid((candidate) => { delete candidate.patterns[0].product_decisions; }, /product decisions must be a non-empty array/);
  expectInvalid((candidate) => { candidate.matrix.rows[0].when.equals.value = 'true'; }, /must be boolean/);
  expectInvalid((candidate) => { candidate.matrix.rows.push(structuredClone(candidate.matrix.rows[0])); }, /Duplicate applicability row/);
  const malformedOutcome = structuredClone(data);
  malformedOutcome.matrix.rows[0].outcomes[0] = null;
  assert.throws(
    () => validateStandards(malformedOutcome),
    (error) => {
      assert.ok(error instanceof Error);
      assert.equal(error instanceof TypeError, false);
      assert.match(error.message, /outcomes must be a non-empty array of non-empty strings/);
      return true;
    },
  );
  expectInvalid((candidate) => {
    candidate.evidence.proof_kinds.foo = { purpose: 'unsupported', required_capability: 'foo' };
    candidate.semantics[0].proof.push('foo');
  }, /Evidence routes must be exactly unit, axe, e2e, and human/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'button').baseline_semantic_ids = []; }, /baseline-only mapping must declare at least one baseline semantic/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.source.package_version = '1.16.0'; }, /projector package version is invalid/);
  expectInvalid((candidate) => { candidate.semantics[0].unexpected = true; }, /has unsupported fields: unexpected/);
  expectInvalid((candidate) => { candidate.patterns[0].unexpected = true; }, /has unsupported fields: unexpected/);
  expectInvalid((candidate) => { candidate.semantics[0] = null; }, /Malformed semantic record/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings[0] = null; }, /Malformed UI Design Brain binding/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings.find(({ pattern_ids }) => pattern_ids).pattern_ids = 42; }, /pattern_ids must be an array/);
  expectInvalid((candidate) => { candidate.wcagCoverage.criteria[0].semantic_ids = 42; }, /semantic_ids must be an array/);
  expectInvalid((candidate) => {
    candidate.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'table').candidates[0].when.equals.value = 'spreadsheet';
  }, /equals value for component\.table_model must be one of data-table, grid, treegrid/);
  expectInvalid((candidate) => {
    candidate.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'table').candidates[0].when = {
      contains: { fact: 'component.table_model', value: 'grid' },
    };
  }, /contains is not valid for enumerated string fact component\.table_model; use equals/);
  expectInvalid((candidate) => {
    candidate.sources.authorities.push({ id: 'example-standard', url: 'https://example.com/', normative: false });
    candidate.sources.precedence.push('example-standard');
  }, /Unsupported standards authority example-standard/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.source.manifest_path = 'catalog-manifest.json'; }, /UI Design Brain binding manifest path is invalid/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.unexpected = true; }, /UI Design Brain binding contract has unsupported fields: unexpected/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.source.unexpected = true; }, /UI Design Brain binding source has unsupported fields: unexpected/);
  expectInvalid((candidate) => { candidate.uiDesignBrainBindings.bindings[0].unexpected = true; }, /UI Design Brain binding accordion has unsupported fields: unexpected/);
  expectInvalid((candidate) => {
    candidate.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'button-group').candidates[0].unexpected = true;
  }, /UI Design Brain binding button-group candidate pattern\.toolbar has unsupported fields: unexpected/);
});

test('public contract helpers reject malformed structures with domain errors', async () => {
  const data = await loadStandards();
  const expectDomainError = (operation, pattern) => {
    assert.throws(operation, (error) => {
      assert.ok(error instanceof Error);
      assert.equal(error instanceof TypeError, false);
      assert.match(error.message, pattern);
      assert.doesNotMatch(error.message, /Cannot (?:read properties|convert undefined or null)/);
      return true;
    });
  };

  expectDomainError(() => validateStandards(null), /Accessibility standards contract must be an object/);
  const malformedRow = structuredClone(data);
  malformedRow.matrix.rows[0] = null;
  expectDomainError(() => validateStandards(malformedRow), /Applicability row at index 0 must be an object/);
  expectDomainError(() => compileApplicability(null, data.facts), /Applicability matrix must contain a rows array/);
  expectDomainError(() => compileApplicability({ rows: [null] }, data.facts), /Applicability row at index 0 must be an object/);
  expectDomainError(() => resolveUiPatternBindings(null, data.facts), /UI Design Brain binding contract must contain a bindings array/);

  const malformedBinding = structuredClone(data.uiDesignBrainBindings);
  malformedBinding.bindings[0] = null;
  expectDomainError(
    () => resolveUiPatternBindings(malformedBinding, data.facts, { 'component.ui_pattern_ids': ['accordion'] }),
    /UI Design Brain binding at index 0 must be an object with a canonical UI pattern ID/,
  );

  const malformedCandidate = structuredClone(data.uiDesignBrainBindings);
  malformedCandidate.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'select').candidates[0].when = null;
  expectDomainError(
    () => resolveUiPatternBindings(malformedCandidate, data.facts, { 'component.ui_pattern_ids': ['select'] }),
    /Applicability expression must be an object/,
  );
  expectDomainError(() => evaluate(null, {}), /Applicability expression must be an object/);
});

test('runtime validation pins the canonical UI Design Brain slug inventory and order', async () => {
  const data = await loadStandards();
  assert.equal(data.uiDesignBrainBindings.bindings.length, 80);

  const renamed = structuredClone(data);
  renamed.uiDesignBrainBindings.bindings[0].ui_pattern_id = 'accordion-renamed';
  assert.deepEqual(renamed.uiDesignBrainBindings.source, data.uiDesignBrainBindings.source, 'the negative must retain pinned upstream provenance');
  assert.throws(
    () => validateStandards(renamed),
    /UI Design Brain bindings must exactly match the pinned canonical pattern inventory and order/,
  );

  const reordered = structuredClone(data);
  [reordered.uiDesignBrainBindings.bindings[0], reordered.uiDesignBrainBindings.bindings[1]] = [
    reordered.uiDesignBrainBindings.bindings[1],
    reordered.uiDesignBrainBindings.bindings[0],
  ];
  assert.deepEqual(reordered.uiDesignBrainBindings.source, data.uiDesignBrainBindings.source, 'the negative must retain pinned upstream provenance');
  assert.throws(
    () => validateStandards(reordered),
    /UI Design Brain bindings must exactly match the pinned canonical pattern inventory and order/,
  );
});

test('standards sources preserve canonical authority and precedence order', async () => {
  const data = await loadStandards();
  assert.deepEqual(data.sources.authorities.map(({ id }) => id), [
    'html',
    'aria-in-html',
    'wcag-2.2',
    'wai-aria-1.2',
    'wcag-2.2-understanding',
    'aria-apg',
  ]);
  assert.deepEqual(data.sources.precedence, [
    'platform-semantics',
    'html',
    'aria-in-html',
    'wcag-2.2',
    'wai-aria-1.2',
    'wcag-2.2-understanding',
    'aria-apg',
    'product-policy',
  ]);
  const reordered = structuredClone(data);
  [reordered.sources.authorities[1], reordered.sources.authorities[2]] = [reordered.sources.authorities[2], reordered.sources.authorities[1]];
  assert.throws(() => validateStandards(reordered), /Standards authorities must be ordered exactly html, aria-in-html, wcag-2\.2, wai-aria-1\.2, wcag-2\.2-understanding, aria-apg/);
});

test('HTML references use only inert at the canonical attribute URL', async () => {
  const data = await loadStandards();
  const semantic = data.semantics.find(({ id }) => id === 'semantics.hidden-inert');
  const reference = semantic.standards_refs.find(({ authority }) => authority === 'html');
  assert.deepEqual(reference, {
    authority: 'html',
    identifier: 'inert',
    url: 'https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute',
    normative: true,
  });

  const expectInvalidHtmlReference = (mutate, pattern) => {
    const candidate = structuredClone(data);
    const ref = candidate.semantics.find(({ id }) => id === semantic.id).standards_refs.find(({ authority }) => authority === 'html');
    mutate(ref);
    assert.throws(() => validateStandards(candidate), pattern);
  };
  expectInvalidHtmlReference((ref) => { ref.identifier = 'hidden'; }, /HTML reference identifier must be inert/);
  expectInvalidHtmlReference((ref) => { ref.url = 'https://html.spec.whatwg.org/multipage/interaction.html#inert'; }, /HTML inert reference URL must be https:\/\/html\.spec\.whatwg\.org\/multipage\/interaction\.html#the-inert-attribute/);
  expectInvalidHtmlReference((ref) => { ref.level = 'A'; }, /standards reference html inert must not declare a WCAG level/);
  expectInvalidHtmlReference((ref) => { ref.normative = false; }, /standards reference html inert has normative=false; expected true/);
});

test('ARIA in HTML references use only author-conformance at the canonical base URL', async () => {
  const data = await loadStandards();
  const semantic = data.semantics.find(({ id }) => id === 'semantics.native-elements');
  const reference = semantic.standards_refs.find(({ authority }) => authority === 'aria-in-html');
  assert.deepEqual(reference, {
    authority: 'aria-in-html',
    identifier: 'author-conformance',
    url: 'https://www.w3.org/TR/html-aria/',
    normative: true,
  });

  const wrongIdentifier = structuredClone(data);
  wrongIdentifier.semantics.find(({ id }) => id === semantic.id).standards_refs.find(({ authority }) => authority === 'aria-in-html').identifier = 'roles';
  assert.throws(() => validateStandards(wrongIdentifier), /ARIA in HTML reference identifier must be author-conformance/);

  const wrongUrl = structuredClone(data);
  wrongUrl.semantics.find(({ id }) => id === semantic.id).standards_refs.find(({ authority }) => authority === 'aria-in-html').url = 'https://www.w3.org/TR/html-aria/#docconformance';
  assert.throws(() => validateStandards(wrongUrl), /ARIA in HTML reference URL must be https:\/\/www\.w3\.org\/TR\/html-aria\//);

  const improperLevel = structuredClone(data);
  improperLevel.semantics.find(({ id }) => id === semantic.id).standards_refs.find(({ authority }) => authority === 'aria-in-html').level = 'A';
  assert.throws(() => validateStandards(improperLevel), /standards reference aria-in-html author-conformance must not declare a WCAG level/);
});

test('WAI-ARIA 1.2 references reject unknown, mismatched, and leveled entries at runtime', async () => {
  const data = await loadStandards();
  const busyState = data.semantics.find(({ id }) => id === 'semantics.busy-state');
  const mutateBusyReference = (mutate) => {
    const candidate = structuredClone(data);
    const reference = candidate.semantics.find(({ id }) => id === busyState.id).standards_refs
      .find(({ authority }) => authority === 'wai-aria-1.2');
    mutate(reference);
    return candidate;
  };

  assert.throws(
    () => validateStandards(mutateBusyReference((reference) => {
      reference.identifier = 'aria-invented';
      reference.url = 'https://www.w3.org/TR/wai-aria-1.2/#aria-invented';
    })),
    /references unknown WAI-ARIA 1\.2 entry aria-invented/,
  );
  assert.throws(
    () => validateStandards(mutateBusyReference((reference) => {
      reference.url = 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden';
    })),
    /WAI-ARIA 1\.2 reference aria-busy URL must be https:\/\/www\.w3\.org\/TR\/wai-aria-1\.2\/#aria-busy/,
  );
  assert.throws(
    () => validateStandards(mutateBusyReference((reference) => { reference.level = 'A'; })),
    /standards reference wai-aria-1\.2 aria-busy must not declare a WCAG level/,
  );
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

test('enumerated string facts reject substring expressions and invalid observed values', async () => {
  const data = await loadStandards();
  for (const [fact, valid, invalid, values] of [
    ['component.collection_model', 'feed', 'timeline', 'feed, static-list'],
    ['component.separator_model', 'static', 'divider', 'static, window-splitter'],
    ['component.table_model', 'grid', 'spreadsheet', 'data-table, grid, treegrid'],
    ['component.toggle_model', 'button', 'toggle', 'button, checkbox, switch'],
    ['component.value_display_model', 'meter', 'progress', 'meter, static'],
  ]) {
    assert.throws(
      () => validateExpression({ contains: { fact, value: valid } }, data.facts.facts),
      new RegExp(`contains is not valid for enumerated string fact ${fact.replaceAll('.', '\\.')}; use equals`),
    );
    assert.throws(
      () => resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': [], [fact]: invalid }),
      new RegExp(`Observed value for ${fact.replaceAll('.', '\\.') } must be one of ${values}`),
    );
  }
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

test('all UI Design Brain slugs are explicitly classified and modal retains its dialog base pattern', async () => {
  const data = await loadStandards();
  const expectedIds = 'accordion,alert,avatar,badge,breadcrumbs,button,button-group,card,carousel,checkbox,color-picker,combobox,comparison-table,context-menu,date-input,datepicker,drawer,dropdown-menu,empty-state,error-message,eyebrow,fieldset,file,file-upload,filter,footer,form,header,heading,helper-text,hero,icon,image,in-page-navigation,label,link,list,logo-bar,marquee,masthead,media-object,mega-menu,modal,navigation,number-input,pagination,popover,progress-bar,progress-indicator,quote,radio-button,rating,rich-text,rich-text-editor,search-input,search-overlay,section-header,segmented-control,select,separator,sidebar,skeleton,skip-link,slider,spinner,stack,stat,stepper,table,tabs,text-input,textarea,toast,toggle,tooltip,tree-view,utility-bar,video,visually-hidden,wizard'.split(',');
  assert.deepEqual(data.uiDesignBrainBindings.bindings.map(({ ui_pattern_id }) => ui_pattern_id), expectedIds);
  assert.deepEqual(
    Object.fromEntries(['direct', 'candidate', 'baseline-only'].map((classification) => [classification, data.uiDesignBrainBindings.bindings.filter((binding) => binding.classification === classification).length])),
    { direct: 30, candidate: 20, 'baseline-only': 30 }
  );
  assert.deepEqual(data.uiDesignBrainBindings.bindings.find(({ ui_pattern_id }) => ui_pattern_id === 'modal'), {
    ui_pattern_id: 'modal',
    classification: 'candidate',
    pattern_ids: ['pattern.dialog'],
    discriminator_facts: ['component.dialog_purpose'],
    candidates: [
      { pattern_id: 'pattern.alert-dialog', when: { equals: { fact: 'component.dialog_purpose', value: 'urgent-response' } } }
    ]
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
    assert.equal(bindings.schema_version, 4);
    assert.equal(bindings.binding_schema_version, 1);
    assert.equal(bindings.source.package_version, '1.16.1');
    assert.equal(bindings.source.catalog_authority_version, '1.15.1');
    assert.equal(bindings.source.source_digest, 'sha256:1eda596fe341786b5ada25742b6487bc06685fff17cbd582bc1b58302097e3ff');
    assert.equal(bindings.source.manifest_digest, 'sha256:63a0bc8d9537d6d4c0aef8fd8a539bf4a9181a50d0761bd63eae6fe59b4eddc9');
    assert.match(bindings.binding_digest, /^[a-f0-9]{64}$/);
    assert.deepEqual(bindings.facts, data.facts.facts);
    assert.equal(bindings.bindings.length, bindings.source.pattern_count);
    const coverage = JSON.parse(artifacts.get('coverageManifest'));
    assert.equal(coverage.ui_design_brain.binding_digest, bindings.binding_digest);
    assert.deepEqual(coverage.ui_pattern_ids, bindings.bindings.map(({ ui_pattern_id }) => ui_pattern_id));
    assert.deepEqual(coverage.aria_apg, data.apgCoverage);
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
  const changedApgCoverage = structuredClone(data);
  changedApgCoverage.apgCoverage.patterns.find(({ id }) => id === 'grid').record_ids = ['pattern.treegrid'];
  assert.notEqual(sourceContractDigest(changedApgCoverage), sourceDigest);

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
