import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { loadStandards, packageRoot } from '../../lib/load.mjs';
import { sourceContractDigest } from '../../lib/provenance.mjs';
import { buildArtifacts } from '../../lib/render.mjs';
import { validateStandards } from '../../lib/validate.mjs';

const expectedIds = '1.1.1,1.2.1,1.2.2,1.2.3,1.2.4,1.2.5,1.3.1,1.3.2,1.3.3,1.3.4,1.3.5,1.4.1,1.4.2,1.4.3,1.4.4,1.4.5,1.4.10,1.4.11,1.4.12,1.4.13,2.1.1,2.1.2,2.1.4,2.2.1,2.2.2,2.3.1,2.4.1,2.4.2,2.4.3,2.4.4,2.4.5,2.4.6,2.4.7,2.4.11,2.5.1,2.5.2,2.5.3,2.5.4,2.5.7,2.5.8,3.1.1,3.1.2,3.2.1,3.2.2,3.2.3,3.2.4,3.2.6,3.3.1,3.3.2,3.3.3,3.3.4,3.3.7,3.3.8,4.1.2,4.1.3'.split(',');

async function schemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const root = join(packageRoot, 'schemas');
  for (const name of (await readdir(root)).filter((entry) => entry.endsWith('.schema.json')).sort()) {
    ajv.addSchema(JSON.parse(await readFile(join(root, name), 'utf8')));
  }
  return ajv;
}

function captureError(callback) {
  let caught;
  try {
    callback();
  } catch (error) {
    caught = error;
  }
  assert.ok(caught, 'expected callback to throw');
  return caught;
}

test('WCAG 2.2 inventory contains exactly the canonical Level A and AA criteria', async () => {
  const data = await loadStandards();
  assert.equal(data.wcagCoverage.version, 1);
  assert.equal(data.wcagCoverage.authority, 'wcag-2.2');
  assert.deepEqual(data.wcagCoverage.criteria.map(({ id }) => id), expectedIds);
  assert.deepEqual(
    Object.fromEntries(['A', 'AA'].map((level) => [level, data.wcagCoverage.criteria.filter((criterion) => criterion.level === level).length])),
    { A: 31, AA: 24 },
  );
  assert.deepEqual(
    Object.fromEntries(['covered', 'partial', 'gap'].map((status) => [status, data.wcagCoverage.criteria.filter((criterion) => criterion.status === status).length])),
    { covered: 55, partial: 0, gap: 0 },
  );
  assert.equal(data.wcagCoverage.criteria.some(({ id }) => id === '4.1.1'), false);
});

test('complete WCAG 2.2 semantic coverage and the completed APG backlog remain explicit', async () => {
  const data = await loadStandards();
  assert.ok(data.wcagCoverage.criteria.every(({ status, note }) => status === 'covered' && note === undefined));
  const mapped = Object.fromEntries(data.wcagCoverage.criteria.map((criterion) => [criterion.id, criterion.semantic_ids]));
  const phaseThreeMappings = {
    '1.1.1': ['semantics.non-text-alternative', 'semantics.non-text-content'],
    '1.2.1': ['semantics.media-alternatives', 'semantics.media.prerecorded-audio-video-only-alternatives'],
    '1.2.2': ['semantics.media-alternatives', 'semantics.media.captions-prerecorded'],
    '1.2.3': ['semantics.media-alternatives', 'semantics.media.audio-description-or-alternative-prerecorded'],
    '1.2.4': ['semantics.media.captions-live'],
    '1.2.5': ['semantics.media-alternatives', 'semantics.media.audio-description-prerecorded'],
    '1.3.1': ['semantics.collection-metadata', 'semantics.data-table', 'semantics.form-label', 'semantics.form-required', 'semantics.headings', 'semantics.info-relationships', 'semantics.landmarks', 'semantics.sort-state'],
    '1.3.2': ['semantics.meaningful-sequence'],
    '1.3.3': ['semantics.sensory-characteristics'],
    '1.3.4': ['semantics.orientation'],
    '1.3.5': ['semantics.input-purpose'],
    '1.4.1': ['semantics.use-of-color'],
    '1.4.2': ['semantics.audio-control'],
    '1.4.4': ['semantics.resize-text'],
    '1.4.5': ['semantics.images-of-text'],
    '2.3.1': ['semantics.flash-threshold'],
    '2.4.6': ['semantics.headings', 'semantics.headings-labels-purpose'],
    '3.3.2': ['semantics.form-label', 'semantics.form-required', 'semantics.input-labels-instructions'],
  };
  for (const [criterion, semanticIds] of Object.entries(phaseThreeMappings)) {
    assert.equal(data.wcagCoverage.criteria.find(({ id }) => id === criterion).status, 'covered');
    assert.deepEqual(mapped[criterion], semanticIds);
  }
  const phaseTwoMappings = {
    '1.4.3': ['semantics.contrast-minimum'],
    '1.4.10': ['semantics.reflow'],
    '1.4.11': ['semantics.non-text-contrast'],
    '1.4.12': ['semantics.text-spacing'],
    '1.4.13': ['semantics.content-on-hover-or-focus'],
    '2.1.4': ['semantics.character-key-shortcuts'],
    '2.2.1': ['semantics.timing-adjustable'],
    '2.4.1': ['semantics.bypass-blocks'],
    '2.4.2': ['semantics.page-title'],
    '2.4.3': ['semantics.focus-order'],
    '2.4.4': ['semantics.link-purpose'],
    '2.4.5': ['semantics.multiple-ways'],
    '2.5.1': ['semantics.pointer-gestures'],
    '2.5.2': ['semantics.pointer-cancellation'],
    '2.5.4': ['semantics.motion-actuation'],
    '3.1.1': ['semantics.language.page'],
    '3.1.2': ['semantics.language.parts'],
    '3.2.1': ['semantics.context-change.focus'],
    '3.2.2': ['semantics.context-change.input'],
    '3.2.3': ['semantics.consistent-navigation'],
    '3.2.4': ['semantics.consistent-identification'],
  };
  for (const [criterion, semanticIds] of Object.entries(phaseTwoMappings)) {
    assert.equal(data.wcagCoverage.criteria.find(({ id }) => id === criterion).status, 'covered');
    assert.deepEqual(mapped[criterion], semanticIds);
  }
  assert.deepEqual(mapped['2.5.7'], ['semantics.dragging-alternative']);
  assert.deepEqual(mapped['3.2.6'], ['semantics.consistent-help']);
  assert.deepEqual(mapped['3.3.7'], ['semantics.redundant-entry']);
  assert.deepEqual(mapped['3.3.8'], ['semantics.accessible-authentication']);
  assert.deepEqual(mapped['4.1.2'], ['semantics.accessible-name', 'semantics.disabled-readonly', 'semantics.expanded-state', 'semantics.name-role-value', 'semantics.native-dialog', 'semantics.pressed-state', 'semantics.roles-states-properties', 'semantics.selected-state']);
  assert.deepEqual(data.wcagCoverage.deferred_patterns, []);
  assert.ok(data.patterns.some(({ id }) => id === 'pattern.grid'));
  assert.ok(data.patterns.some(({ id }) => id === 'pattern.treegrid'));
  assert.ok(!Object.hasOwn(data.facts.facts, 'component.has_data_table_or_grid'));
  assert.deepEqual(data.facts.facts['component.has_data_table'], { type: 'boolean' });
  assert.deepEqual(data.facts.facts['component.table_model'], { type: 'string', values: ['data-table', 'grid', 'treegrid'] });
  assert.doesNotMatch(data.semantics.find(({ id }) => id === 'semantics.data-table').requirement, /interactive grid/i);
});

test('coverage source validates and is projected unchanged in both profiles', async () => {
  const data = await loadStandards();
  const ajv = await schemaValidator();
  const validateWcag = ajv.getSchema('wcag-coverage.schema.json');
  const validateApg = ajv.getSchema('apg-coverage.schema.json');
  assert.ok(validateWcag);
  assert.ok(validateApg);
  assert.equal(validateWcag(data.wcagCoverage), true, ajv.errorsText(validateWcag.errors));
  assert.equal(validateApg(data.apgCoverage), true, ajv.errorsText(validateApg.errors));
  for (const profile of ['conductor', 'ai-orchestration']) {
    const profileArtifacts = buildArtifacts(data, profile);
    const manifest = JSON.parse(profileArtifacts.get('coverageManifest'));
    assert.equal(manifest.schema_version, 4);
    assert.deepEqual(manifest.wcag_2_2, data.wcagCoverage);
    assert.deepEqual(manifest.aria_apg, data.apgCoverage);

    const semantics = JSON.parse(profileArtifacts.get('semanticsJson')).semantics;
    assert.ok(semantics.every((semantic) => semantic.standards_refs?.length));
    assert.ok(semantics.some((semantic) => semantic.standards_refs.some(({ authority, normative }) => authority === 'wcag-2.2-understanding' && normative === false)));

    const patterns = JSON.parse(profileArtifacts.get('patternContracts')).patterns;
    assert.ok(patterns.every((pattern) => pattern.standards_refs?.length));
    assert.ok(patterns.every((pattern) => pattern.activation && typeof pattern.activation === 'object'));
  }
  const changed = structuredClone(data);
  changed.wcagCoverage.criteria[0].note = 'Changed traceability evidence.';
  assert.notEqual(sourceContractDigest(changed), sourceContractDigest(data));
});

test('coverage and standards traceability validation fail closed', async () => {
  const data = await loadStandards();
  const malformedCriterion = structuredClone(data);
  malformedCriterion.wcagCoverage.criteria[0].id = '4.1.1';
  assert.throws(() => validateStandards(malformedCriterion), /canonical WCAG 2\.2 A\/AA order|omits 1\.1\.1/);

  const unknownSemantic = structuredClone(data);
  unknownSemantic.wcagCoverage.criteria.find(({ id }) => id === '2.5.7').semantic_ids = ['semantics.unknown'];
  assert.throws(() => validateStandards(unknownSemantic), /references unknown semantic semantics\.unknown/);

  const inconsistentAuthority = structuredClone(data);
  inconsistentAuthority.patterns[0].standards_refs[0].normative = !inconsistentAuthority.patterns[0].standards_refs[0].normative;
  assert.throws(() => validateStandards(inconsistentAuthority), /has normative=.*expected/);

  const missingAaaLevel = structuredClone(data);
  delete missingAaaLevel.semantics.find(({ id }) => id === 'semantics.motion-control').standards_refs.find(({ identifier }) => identifier === '2.3.3').level;
  assert.throws(() => validateStandards(missingAaaLevel), /standards reference 2\.3\.3 must declare a WCAG level/);

  const duplicateReference = structuredClone(data);
  const duplicate = structuredClone(duplicateReference.semantics[0].standards_refs[0]);
  duplicate.url += '?duplicate';
  duplicateReference.semantics[0].standards_refs.splice(1, 0, duplicate);
  assert.throws(() => validateStandards(duplicateReference), /duplicate standards reference/);

  const unexplainedGap = structuredClone(data);
  Object.assign(unexplainedGap.wcagCoverage.criteria[0], { status: 'gap', semantic_ids: [] });
  assert.throws(() => validateStandards(unexplainedGap), /gap coverage must explain the shortfall/);

  const duplicateDeferred = structuredClone(data);
  duplicateDeferred.wcagCoverage.deferred_patterns.push(
    { id: 'future-pattern', reason: 'Not yet represented by the current APG inventory.' },
    { id: 'future-pattern', reason: 'Duplicated future entry.' },
  );
  assert.throws(() => validateStandards(duplicateDeferred), /Duplicate deferred APG pattern future-pattern/);

  const implementedDeferred = structuredClone(data);
  implementedDeferred.wcagCoverage.deferred_patterns.push({ id: 'grid', reason: 'Incorrectly left deferred after implementation.' });
  assert.throws(() => validateStandards(implementedDeferred), /Deferred APG pattern grid conflicts with the current complete APG coverage inventory/);

  for (const id of ['breadcrumb', 'button', 'table']) {
    const coveredWithoutDedicatedPattern = structuredClone(data);
    coveredWithoutDedicatedPattern.wcagCoverage.deferred_patterns.push({ id, reason: 'Incorrectly deferred despite current APG coverage.' });
    assert.throws(
      () => validateStandards(coveredWithoutDedicatedPattern),
      new RegExp(`Deferred APG pattern ${id} conflicts with the current complete APG coverage inventory`),
    );
  }

  const wrongUrl = structuredClone(data);
  wrongUrl.semantics.find(({ id }) => id === 'semantics.accessible-name').standards_refs.find(({ authority }) => authority === 'wcag-2.2').url = 'https://www.w3.org/TR/WCAG22/#wrong';
  assert.throws(() => validateStandards(wrongUrl), /URL must be https:\/\/www\.w3\.org\/TR\/WCAG22\/#/);

  const wrongUnderstandingUrl = structuredClone(data);
  wrongUnderstandingUrl.semantics[0].standards_refs.find(({ authority }) => authority === 'wcag-2.2-understanding').url = 'https://www.w3.org/WAI/WCAG22/Understanding/wrong.html';
  assert.throws(() => validateStandards(wrongUnderstandingUrl), /URL must be https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\//);

  const inventedCriterion = structuredClone(data);
  inventedCriterion.semantics.find(({ id }) => id === 'semantics.keyboard.escape').standards_refs.push({
    authority: 'wcag-2.2', identifier: '9.9.9', url: 'https://www.w3.org/TR/WCAG22/#invented', normative: true, level: 'A'
  });
  assert.throws(() => validateStandards(inventedCriterion), /is not a WCAG 2\.2 success criterion/);

  const nonWcagLevel = structuredClone(data);
  nonWcagLevel.semantics.find(({ id }) => id === 'semantics.keyboard.escape').standards_refs[0].level = 'AA';
  assert.throws(() => validateStandards(nonWcagLevel), /must not declare a WCAG level/);

  const missingUnderstanding = structuredClone(data);
  const paired = missingUnderstanding.semantics.find(({ id }) => id === 'semantics.accessible-name');
  paired.standards_refs = paired.standards_refs.filter(({ authority, identifier }) => !(authority === 'wcag-2.2-understanding' && identifier === '2.5.3'));
  assert.throws(() => validateStandards(missingUnderstanding), /WCAG 2\.5\.3 reference must include its Understanding document/);

  const rebasedAuthority = structuredClone(data);
  rebasedAuthority.sources.authorities.find(({ id }) => id === 'wcag-2.2').url = 'https://evil.example/';
  assert.throws(() => validateStandards(rebasedAuthority), /Standards authority wcag-2\.2 must use https:\/\/www\.w3\.org\/TR\/WCAG22\//);

  const incompleteApg = structuredClone(data);
  incompleteApg.apgCoverage.patterns.pop();
  assert.throws(() => validateStandards(incompleteApg), /WAI-ARIA APG pattern coverage must contain exactly 30 entries|coverage omits windowsplitter/);

  const unknownApgRecord = structuredClone(data);
  unknownApgRecord.apgCoverage.patterns.find(({ id }) => id === 'feed').record_ids = ['pattern.unknown'];
  assert.throws(() => validateStandards(unknownApgRecord), /WAI-ARIA APG pattern feed references unknown record pattern\.unknown/);

  const invalidApgModel = structuredClone(data);
  invalidApgModel.apgCoverage.patterns.find(({ id }) => id === 'grid').coverage = 'deferred';
  assert.throws(() => validateStandards(invalidApgModel), /WAI-ARIA APG pattern grid has invalid coverage deferred/);

  const missingApgTrace = structuredClone(data);
  missingApgTrace.patterns.find(({ id }) => id === 'pattern.grid').standards_refs[0] = {
    authority: 'aria-apg', identifier: 'feed', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/feed/', normative: false,
  };
  assert.throws(() => validateStandards(missingApgTrace), /WAI-ARIA APG pattern grid coverage has no mapped record with its canonical source reference/);

  const omittedDirectSource = structuredClone(data);
  const alertCoverage = omittedDirectSource.apgCoverage.patterns.find(({ id }) => id === 'alert');
  alertCoverage.record_ids = alertCoverage.record_ids.filter((id) => id !== 'semantics.alert');
  assert.throws(() => validateStandards(omittedDirectSource), /WAI-ARIA APG pattern alert coverage omits directly sourced record semantics\.alert/);

  const malformedApgRecords = structuredClone(data);
  malformedApgRecords.apgCoverage.patterns.find(({ id }) => id === 'feed').record_ids = 42;
  malformedApgRecords.patterns.find(({ id }) => id === 'pattern.feed').standards_refs = null;
  const aggregateError = captureError(() => validateStandards(malformedApgRecords));
  assert.ok(aggregateError instanceof Error);
  assert.equal(aggregateError instanceof TypeError, false);
  assert.match(aggregateError.message, /pattern\.feed standards_refs must be a non-empty array/);
  assert.match(aggregateError.message, /WAI-ARIA APG pattern feed record_ids must be an array of non-empty strings/);

  const nullApgReference = structuredClone(data);
  nullApgReference.patterns.find(({ id }) => id === 'pattern.feed').standards_refs = [null];
  const nullReferenceError = captureError(() => validateStandards(nullApgReference));
  assert.ok(nullReferenceError instanceof Error);
  assert.equal(nullReferenceError instanceof TypeError, false);
  assert.match(nullReferenceError.message, /pattern\.feed has a malformed standards reference/);
  assert.match(nullReferenceError.message, /WAI-ARIA APG pattern feed coverage has no mapped record with its canonical source reference/);

  const malformedSemanticReferences = structuredClone(data);
  malformedSemanticReferences.semantics.find(({ id }) => id === 'semantics.collection-metadata').standards_refs = null;
  const semanticError = captureError(() => validateStandards(malformedSemanticReferences));
  assert.ok(semanticError instanceof Error);
  assert.equal(semanticError instanceof TypeError, false);
  assert.match(semanticError.message, /semantics\.collection-metadata standards_refs must be a non-empty array/);
  assert.match(semanticError.message, /1\.3\.1 coverage maps semantics\.collection-metadata without a matching normative WCAG standards reference/);
});

test('completed APG coverage has no required deferrals while retaining an extensible future inventory', async () => {
  const data = await loadStandards();
  assert.deepEqual(data.wcagCoverage.deferred_patterns, []);
  data.wcagCoverage.deferred_patterns.push({ id: 'future-pattern', reason: 'Reserved for an APG pattern added after this contract release.' });
  assert.equal(validateStandards(data).wcagCriteria, 55);
  const ajv = await schemaValidator();
  const validate = ajv.getSchema('wcag-coverage.schema.json');
  assert.equal(validate(data.wcagCoverage), true, ajv.errorsText(validate.errors));
});

test('source validation rejects unreachable records and unused applicability facts without a fixed row count', async () => {
  const data = await loadStandards();

  const unreachablePattern = structuredClone(data);
  const pattern = structuredClone(unreachablePattern.patterns[0]);
  pattern.id = 'pattern.unreachable-test';
  pattern.title = 'Unreachable test pattern';
  pattern.activation = { contains: { fact: 'component.accessibility_pattern_ids', value: pattern.id } };
  unreachablePattern.patterns.push(pattern);
  assert.throws(() => validateStandards(unreachablePattern), /Unreachable pattern: pattern\.unreachable-test/);

  const unreachableSemantic = structuredClone(data);
  const semantic = structuredClone(unreachableSemantic.semantics.find(({ id }) => id === 'semantics.keyboard.escape'));
  semantic.id = 'semantics.unreachable-test';
  semantic.title = 'Unreachable test semantic';
  unreachableSemantic.semantics.push(semantic);
  assert.throws(() => validateStandards(unreachableSemantic), /Unreachable semantic: semantics\.unreachable-test/);

  const unusedFact = structuredClone(data);
  unusedFact.facts.facts['test.unused'] = { type: 'boolean' };
  assert.throws(() => validateStandards(unusedFact), /Unused applicability fact: test\.unused/);
});

test('Markdown projections render standards references and pattern activation', async () => {
  const data = await loadStandards();
  for (const record of [...data.semantics, ...data.patterns]) assert.ok(record.standards_refs?.length, `${record.id} has no standards refs`);
  const artifacts = buildArtifacts(data, 'ai-orchestration');
  for (const semantic of data.semantics) {
    const markdown = artifacts.get(`semantic:${semantic.id}`);
    assert.match(markdown, /Standards:\n- \[/, semantic.id);
    if (semantic.standards_refs.some(({ normative }) => normative === false)) assert.match(markdown, /— informative/, semantic.id);
  }
  for (const pattern of data.patterns) {
    const markdown = artifacts.get(`pattern:${pattern.id}`);
    assert.match(markdown, /Standards:\n- \[/, pattern.id);
    assert.match(markdown, /Activation: `\{/, pattern.id);
    assert.match(markdown, /— (?:normative|informative)/, pattern.id);
  }

  for (const [profile, artifact] of [['conductor', 'semanticsMarkdown'], ['ai-orchestration', 'implementation']]) {
    const markdown = buildArtifacts(data, profile).get(artifact);
    assert.match(markdown, /## WCAG 2\.2 Level A\/AA coverage/);
    assert.doesNotMatch(markdown, /\| (?:partial|gap) \|/);
    assert.match(markdown, /\| 1\.2\.4 \| Captions \(Live\) \| AA \| covered \| semantics\.media\.captions-live \|/);
    assert.match(markdown, /\| 2\.5\.7 \| Dragging Movements \| AA \| covered \| semantics\.dragging-alternative \|/);
    assert.match(markdown, /### Deferred APG patterns\n\nNone\./);
    assert.match(markdown, /## WAI-ARIA APG coverage/);
    assert.match(markdown, /\| grid \| dedicated-pattern \| pattern\.grid \|/);
    assert.match(markdown, /\| names-and-descriptions \| semantics\.accessible-description, semantics\.accessible-name \|/);
  }
});

test('Markdown projections escape hostile schema-valid text while runtime APG traceability fails closed', async () => {
  const data = await loadStandards();
  data.wcagCoverage.criteria[0].note = 'line \\| injected\nnext <script>';
  const pattern = data.patterns.find(({ id }) => id === 'pattern.accordion');
  pattern.standards_refs[0].identifier = 'bad] label\nnext';
  pattern.standards_refs[0].url = 'https://www.w3.org/WAI/ARIA/apg/patterns/bad path)>';
  const ajv = await schemaValidator();
  const validatePattern = ajv.getSchema('pattern.schema.json');
  assert.equal(validatePattern(pattern), true, ajv.errorsText(validatePattern.errors));
  assert.throws(() => validateStandards(data), /references unknown WAI-ARIA APG entry bad\] label/);

  const artifacts = buildArtifacts(data, 'ai-orchestration');
  const implementation = artifacts.get('implementation');
  assert.match(implementation, /line &#92;\\\| injected<br>next &lt;script&gt;/);
  const patternMarkdown = artifacts.get('pattern:pattern.accordion');
  assert.match(patternMarkdown, /\[aria-apg bad\\\] label next\]\(<https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\/patterns\/bad%20path\)%3E>\)/);
});
