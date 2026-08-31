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
    { covered: 37, partial: 8, gap: 10 },
  );
  assert.equal(data.wcagCoverage.criteria.some(({ id }) => id === '4.1.1'), false);
});

test('new WCAG 2.2 requirements and deferred APG backlog remain explicit', async () => {
  const data = await loadStandards();
  const nonText = data.wcagCoverage.criteria.find(({ id }) => id === '1.1.1');
  assert.equal(nonText.status, 'partial');
  for (const shortfall of ['controls and input', 'time-based media', 'tests', 'sensory experiences', 'CAPTCHA alternatives']) {
    assert.ok(nonText.note.includes(shortfall), `1.1.1 partial note omits ${shortfall}`);
  }
  const mapped = Object.fromEntries(data.wcagCoverage.criteria.map((criterion) => [criterion.id, criterion.semantic_ids]));
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
  assert.equal(data.wcagCoverage.criteria.find(({ id }) => id === '3.3.2').status, 'partial');
  assert.deepEqual(data.wcagCoverage.deferred_patterns.map(({ id }) => id), ['grid', 'treegrid']);
  assert.ok(data.wcagCoverage.deferred_patterns.every(({ reason }) => typeof reason === 'string' && reason.trim().length > 0));
  assert.ok(!Object.hasOwn(data.facts.facts, 'component.has_data_table_or_grid'));
  assert.deepEqual(data.facts.facts['component.has_data_table'], { type: 'boolean' });
  assert.doesNotMatch(data.semantics.find(({ id }) => id === 'semantics.data-table').requirement, /interactive grid/i);
});

test('coverage source validates and is projected unchanged in both profiles', async () => {
  const data = await loadStandards();
  const ajv = await schemaValidator();
  const validate = ajv.getSchema('wcag-coverage.schema.json');
  assert.ok(validate);
  assert.equal(validate(data.wcagCoverage), true, ajv.errorsText(validate.errors));
  for (const profile of ['conductor', 'ai-orchestration']) {
    const profileArtifacts = buildArtifacts(data, profile);
    const manifest = JSON.parse(profileArtifacts.get('coverageManifest'));
    assert.equal(manifest.schema_version, 3);
    assert.deepEqual(manifest.wcag_2_2, data.wcagCoverage);

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
  delete unexplainedGap.wcagCoverage.criteria.find(({ status }) => status === 'gap').note;
  assert.throws(() => validateStandards(unexplainedGap), /gap coverage must explain the shortfall/);

  const duplicateDeferred = structuredClone(data);
  duplicateDeferred.wcagCoverage.deferred_patterns[1] = structuredClone(duplicateDeferred.wcagCoverage.deferred_patterns[0]);
  assert.throws(() => validateStandards(duplicateDeferred), /Duplicate deferred APG pattern|must retain deferred APG pattern grid/);

  const wrongUrl = structuredClone(data);
  wrongUrl.semantics[0].standards_refs[0].url = 'https://www.w3.org/TR/WCAG22/#wrong';
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
});

test('deferred APG inventory is extensible while retaining the required backlog', async () => {
  const data = await loadStandards();
  data.wcagCoverage.deferred_patterns.splice(0, 0, { id: 'feed', reason: 'Deferred pending a product-backed use case.' });
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
    assert.match(markdown, /\| 2\.5\.7 \| Dragging Movements \| AA \| covered \| semantics\.dragging-alternative \|/);
    assert.match(markdown, /### Deferred APG patterns/);
    assert.match(markdown, /- grid: Deferred until/);
  }
});

test('Markdown projections escape hostile schema-valid reference and coverage text', async () => {
  const data = await loadStandards();
  const gap = data.wcagCoverage.criteria.find(({ status }) => status === 'gap');
  gap.note = 'line \\| injected\nnext <script>';
  const pattern = data.patterns.find(({ id }) => id === 'pattern.accordion');
  pattern.standards_refs[0].identifier = 'bad] label\nnext';
  pattern.standards_refs[0].url = 'https://www.w3.org/WAI/ARIA/apg/patterns/bad path)>';
  validateStandards(data);

  const artifacts = buildArtifacts(data, 'ai-orchestration');
  const implementation = artifacts.get('implementation');
  assert.match(implementation, /line &#92;\\\| injected<br>next &lt;script&gt;/);
  const patternMarkdown = artifacts.get('pattern:pattern.accordion');
  assert.match(patternMarkdown, /\[aria-apg bad\\\] label next\]\(<https:\/\/www\.w3\.org\/WAI\/ARIA\/apg\/patterns\/bad%20path\)%3E>\)/);
});
