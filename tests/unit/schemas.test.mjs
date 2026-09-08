import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { buildProjectionManifest } from '../../lib/build-manifest.mjs';
import { buildDistribution } from '../../lib/build.mjs';
import { digest } from '../../lib/digest.mjs';
import { loadStandards, packageRoot } from '../../lib/load.mjs';
import { buildArtifacts } from '../../lib/render.mjs';

async function schemaValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const root = join(packageRoot, 'schemas');
  for (const name of (await readdir(root)).filter((entry) => entry.endsWith('.schema.json')).sort()) {
    ajv.addSchema(JSON.parse(await readFile(join(root, name), 'utf8')));
  }
  return ajv;
}

function assertValid(ajv, schema, value, label) {
  const validate = ajv.getSchema(schema);
  assert.ok(validate, `missing compiled schema ${schema}`);
  assert.equal(validate(value), true, `${label}: ${ajv.errorsText(validate.errors)}`);
}

function assertInvalid(ajv, schema, value, label) {
  const validate = ajv.getSchema(schema);
  assert.ok(validate, `missing compiled schema ${schema}`);
  assert.equal(validate(value), false, `${label} unexpectedly passed ${schema}`);
}

test('every source and consumer contract validates against its published JSON schema', async () => {
  const ajv = await schemaValidator();
  const data = await loadStandards();
  assertValid(ajv, 'contract.schema.json', data.contract, 'contract');
  for (const semantic of data.semantics) assertValid(ajv, 'semantic.schema.json', semantic, semantic.id);
  for (const pattern of data.patterns) assertValid(ajv, 'pattern.schema.json', pattern, pattern.id);
  const emptySemantic = structuredClone(data.semantics[0]);
  emptySemantic.requirement = '   ';
  assertInvalid(ajv, 'semantic.schema.json', emptySemantic, 'blank semantic requirement');
  const extraSemantic = structuredClone(data.semantics[0]);
  extraSemantic.unexpected = true;
  assertInvalid(ajv, 'semantic.schema.json', extraSemantic, 'semantic extra field');
  const malformedPattern = structuredClone(data.patterns[0]);
  malformedPattern.scope = 42;
  malformedPattern.activation = {};
  assertInvalid(ajv, 'pattern.schema.json', malformedPattern, 'malformed pattern fields');
  const inventedCriterion = structuredClone(data.semantics[0]);
  inventedCriterion.standards_refs[0] = {
    authority: 'wcag-2.2', identifier: '9.9.9', url: 'https://www.w3.org/TR/WCAG22/#invented', normative: true, level: 'A'
  };
  assertInvalid(ajv, 'semantic.schema.json', inventedCriterion, 'invented WCAG criterion');
  assertValid(ajv, 'wcag-coverage.schema.json', data.wcagCoverage, 'WCAG coverage');
  assertValid(ajv, 'apg-coverage.schema.json', data.apgCoverage, 'WAI-ARIA APG coverage');
  const incompleteApgCoverage = structuredClone(data.apgCoverage);
  incompleteApgCoverage.patterns.pop();
  assertInvalid(ajv, 'apg-coverage.schema.json', incompleteApgCoverage, 'incomplete APG pattern coverage');
  const wrongApgPatternId = structuredClone(data.apgCoverage);
  wrongApgPatternId.patterns[0].id = 'accordion-alternative';
  assertInvalid(ajv, 'apg-coverage.schema.json', wrongApgPatternId, 'wrong canonical APG pattern ID');
  const reorderedApgPatterns = structuredClone(data.apgCoverage);
  [reorderedApgPatterns.patterns[0], reorderedApgPatterns.patterns[1]] = [reorderedApgPatterns.patterns[1], reorderedApgPatterns.patterns[0]];
  assertInvalid(ajv, 'apg-coverage.schema.json', reorderedApgPatterns, 'reordered APG patterns');
  const invalidApgCoverageModel = structuredClone(data.apgCoverage);
  invalidApgCoverageModel.patterns[0].coverage = 'deferred';
  assertInvalid(ajv, 'apg-coverage.schema.json', invalidApgCoverageModel, 'invalid APG coverage model');
  const wrongApgCoverageClass = structuredClone(data.apgCoverage);
  wrongApgCoverageClass.patterns[0].coverage = 'baseline-semantics';
  assertInvalid(ajv, 'apg-coverage.schema.json', wrongApgCoverageClass, 'wrong canonical APG coverage class');
  const wrongApgPracticeId = structuredClone(data.apgCoverage);
  wrongApgPracticeId.practices[0].id = 'landmark-navigation';
  assertInvalid(ajv, 'apg-coverage.schema.json', wrongApgPracticeId, 'wrong canonical APG practice ID');
  const reorderedApgPractices = structuredClone(data.apgCoverage);
  [reorderedApgPractices.practices[0], reorderedApgPractices.practices[1]] = [reorderedApgPractices.practices[1], reorderedApgPractices.practices[0]];
  assertInvalid(ajv, 'apg-coverage.schema.json', reorderedApgPractices, 'reordered APG practices');

  const futureDeferredPattern = structuredClone(data.wcagCoverage);
  futureDeferredPattern.deferred_patterns.push({ id: 'future-pattern', reason: 'Added by a future APG release.' });
  assertValid(ajv, 'wcag-coverage.schema.json', futureDeferredPattern, 'unknown future APG deferral');
  for (const id of ['breadcrumb', 'button', 'table']) {
    const currentDeferredPattern = structuredClone(data.wcagCoverage);
    currentDeferredPattern.deferred_patterns.push({ id, reason: 'Already covered by schema 4.' });
    assertInvalid(ajv, 'wcag-coverage.schema.json', currentDeferredPattern, `current canonical APG deferral ${id}`);
  }

  const ariaInHtmlReference = {
    authority: 'aria-in-html',
    identifier: 'author-conformance',
    url: 'https://www.w3.org/TR/html-aria/',
    normative: true,
  };
  assertValid(ajv, 'standards-reference.schema.json', ariaInHtmlReference, 'ARIA in HTML author-conformance reference');
  const wrongAriaInHtmlIdentifier = { ...ariaInHtmlReference, identifier: 'roles' };
  assertInvalid(ajv, 'standards-reference.schema.json', wrongAriaInHtmlIdentifier, 'wrong ARIA in HTML identifier');
  const wrongAriaInHtmlUrl = { ...ariaInHtmlReference, url: 'https://www.w3.org/TR/html-aria/#docconformance' };
  assertInvalid(ajv, 'standards-reference.schema.json', wrongAriaInHtmlUrl, 'noncanonical ARIA in HTML URL');
  const leveledAriaInHtmlReference = { ...ariaInHtmlReference, level: 'A' };
  assertInvalid(ajv, 'standards-reference.schema.json', leveledAriaInHtmlReference, 'ARIA in HTML reference with WCAG level');

  const htmlInertReference = {
    authority: 'html',
    identifier: 'inert',
    url: 'https://html.spec.whatwg.org/multipage/interaction.html#the-inert-attribute',
    normative: true,
  };
  assertValid(ajv, 'standards-reference.schema.json', htmlInertReference, 'HTML inert reference');
  assertInvalid(ajv, 'standards-reference.schema.json', { ...htmlInertReference, identifier: 'hidden' }, 'wrong HTML identifier');
  assertInvalid(ajv, 'standards-reference.schema.json', { ...htmlInertReference, url: 'https://html.spec.whatwg.org/multipage/interaction.html#inert' }, 'noncanonical HTML inert URL');
  assertInvalid(ajv, 'standards-reference.schema.json', { ...htmlInertReference, level: 'A' }, 'HTML inert reference with WCAG level');
  assertInvalid(ajv, 'standards-reference.schema.json', { ...htmlInertReference, normative: false }, 'nonnormative HTML inert reference');

  const waiAriaReferences = [...new Map(
    [...data.foundations, ...data.semantics, ...data.patterns, ...data.policies]
      .flatMap(({ standards_refs = [] }) => standards_refs)
      .filter(({ authority }) => authority === 'wai-aria-1.2')
      .map((reference) => [`${reference.identifier}\u0000${reference.url}`, reference]),
  ).values()].sort((left, right) => left.identifier.localeCompare(right.identifier));
  assert.equal(waiAriaReferences.length, 34, 'the source must use exactly the 34 pinned WAI-ARIA 1.2 identifier/URL pairs');
  for (const reference of waiAriaReferences) {
    assert.equal(reference.url, `https://www.w3.org/TR/wai-aria-1.2/#${reference.identifier}`);
    assertValid(ajv, 'standards-reference.schema.json', reference, `WAI-ARIA 1.2 ${reference.identifier} reference`);
  }

  const busyReference = waiAriaReferences.find(({ identifier }) => identifier === 'aria-busy');
  const busySemantic = data.semantics.find(({ id }) => id === 'semantics.busy-state');
  const assertInvalidWaiAriaReference = (reference, label) => {
    assertInvalid(ajv, 'standards-reference.schema.json', reference, label);
    const semantic = structuredClone(busySemantic);
    semantic.standards_refs[semantic.standards_refs.findIndex(({ authority }) => authority === 'wai-aria-1.2')] = reference;
    assertInvalid(ajv, 'semantic.schema.json', semantic, `${label} in source semantic`);
  };
  assertInvalidWaiAriaReference({
    ...busyReference,
    identifier: 'aria-invented',
    url: 'https://www.w3.org/TR/wai-aria-1.2/#aria-invented',
  }, 'invented WAI-ARIA 1.2 identifier');
  assertInvalidWaiAriaReference({
    ...busyReference,
    url: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden',
  }, 'mismatched WAI-ARIA 1.2 identifier and URL');
  assertInvalidWaiAriaReference({ ...busyReference, level: 'A' }, 'WAI-ARIA 1.2 reference with WCAG level');
  assertValid(ajv, 'applicability-matrix.schema.json', data.matrix, 'applicability matrix');
  assertValid(ajv, 'ui-design-brain-bindings.schema.json', data.uiDesignBrainBindings, 'UI Design Brain bindings');
  const renamedUiSlug = structuredClone(data.uiDesignBrainBindings);
  renamedUiSlug.bindings[0].ui_pattern_id = 'accordion-renamed';
  assert.deepEqual(renamedUiSlug.source, data.uiDesignBrainBindings.source, 'renamed-slug schema negative must retain pinned provenance');
  assertInvalid(ajv, 'ui-design-brain-bindings.schema.json', renamedUiSlug, 'renamed canonical UI Design Brain slug');
  const reorderedUiSlugs = structuredClone(data.uiDesignBrainBindings);
  [reorderedUiSlugs.bindings[0], reorderedUiSlugs.bindings[1]] = [reorderedUiSlugs.bindings[1], reorderedUiSlugs.bindings[0]];
  assert.deepEqual(reorderedUiSlugs.source, data.uiDesignBrainBindings.source, 'reordered-slug schema negative must retain pinned provenance');
  assertInvalid(ajv, 'ui-design-brain-bindings.schema.json', reorderedUiSlugs, 'reordered canonical UI Design Brain slugs');
  for (const profile of Object.values(data.profiles)) assertValid(ajv, 'profile.schema.json', profile, profile.name);

  const config = {
    package: '@verndale/accessibility-standards@4.0.0',
    profile: 'conductor',
    routes: 'accessibility-standards.routes.json',
    outputRoot: '.',
  };
  const routes = { version: 1, outputs: { source: 'accessibility.source.json' } };
  assertValid(ajv, 'consumer-config.schema.json', config, 'consumer config');
  assertValid(ajv, 'consumer-routes.schema.json', routes, 'consumer routes');

  const artifacts = buildArtifacts(data, config.profile);
  const manifest = buildProjectionManifest({ data, profile: config.profile, config, routes, artifacts });
  manifest.output_paths = Object.fromEntries([...artifacts.keys(), 'source'].sort().map((key) => [key, `${key}.generated`]));
  manifest.manifest_digest = digest(manifest);
  assertValid(ajv, 'projection-manifest.schema.json', manifest, 'consumer projection manifest');
  assert.equal(manifest.ui_pattern_ids.length, 80);
  assert.deepEqual(manifest.ui_pattern_ids, data.uiDesignBrainBindings.bindings.map(({ ui_pattern_id }) => ui_pattern_id));
  for (const [label, mutate] of [
    ['corrupt source digest', (candidate) => { candidate.digests.source = 'not-a-digest'; }],
    ['empty profile digest', (candidate) => { candidate.digests.profile = ''; }],
    ['wrong UI source package metadata', (candidate) => { candidate.ui_design_brain.package_version = '1.16.0'; }],
    ['corrupt UI source digest', (candidate) => { candidate.ui_design_brain.source_digest = '0'.repeat(64); }],
    ['empty UI binding digest', (candidate) => { candidate.ui_design_brain.binding_digest = ''; }],
    ['empty output paths', (candidate) => { candidate.output_paths = {}; }],
    ['empty output digests', (candidate) => { candidate.output_digests = {}; }],
  ]) {
    const candidate = structuredClone(manifest);
    mutate(candidate);
    assertInvalid(ajv, 'projection-manifest.schema.json', candidate, `consumer projection manifest: ${label}`);
  }

  for (const [label, mutate] of [
    ['renamed canonical UI pattern ID', (candidate) => { candidate.ui_pattern_ids[0] = 'accordion-renamed'; }],
    ['reordered canonical UI pattern IDs', (candidate) => {
      [candidate.ui_pattern_ids[0], candidate.ui_pattern_ids[1]] = [candidate.ui_pattern_ids[1], candidate.ui_pattern_ids[0]];
    }],
    ['incomplete canonical UI pattern IDs', (candidate) => { candidate.ui_pattern_ids.pop(); }],
  ]) {
    const candidate = structuredClone(manifest);
    mutate(candidate);
    assertInvalid(ajv, 'projection-manifest.schema.json', candidate, `consumer projection manifest: ${label}`);
  }

  assert.equal(manifest.projected_ids.length, 156);
  const truncatedProjectedIds = structuredClone(manifest);
  truncatedProjectedIds.projected_ids.pop();
  assertInvalid(ajv, 'projection-manifest.schema.json', truncatedProjectedIds, 'consumer projection manifest with truncated projected_ids');
  const substitutedProjectedIds = structuredClone(manifest);
  substitutedProjectedIds.projected_ids[0] = 'semantics.unknown-projected-record';
  assertInvalid(ajv, 'projection-manifest.schema.json', substitutedProjectedIds, 'consumer projection manifest with substituted projected_ids');

  assert.deepEqual(
    Object.fromEntries(Object.entries(manifest.lane_coverage).map(([lane, ids]) => [lane, ids.length])),
    { axe: 76, e2e: 101, human: 108, unit: 60 },
  );
  for (const lane of ['axe', 'e2e', 'human', 'unit']) {
    const truncatedLane = structuredClone(manifest);
    truncatedLane.lane_coverage[lane].pop();
    assertInvalid(ajv, 'projection-manifest.schema.json', truncatedLane, `consumer projection manifest with truncated ${lane} lane`);

    const substitutedLane = structuredClone(manifest);
    substitutedLane.lane_coverage[lane][0] = `semantics.unknown-${lane}-lane-record`;
    assertInvalid(ajv, 'projection-manifest.schema.json', substitutedLane, `consumer projection manifest with substituted ${lane} lane`);
  }

  for (const profile of ['conductor', 'ai-orchestration']) {
    const profileConfig = { ...config, profile };
    const profileArtifacts = buildArtifacts(data, profile);
    const profileManifest = buildProjectionManifest({ data, profile, config: profileConfig, routes, artifacts: profileArtifacts });
    profileManifest.output_paths = Object.fromEntries([...profileArtifacts.keys(), 'source'].sort().map((key) => [key, `${key}.generated`]));
    profileManifest.manifest_digest = digest(profileManifest);
    assertValid(ajv, 'projection-manifest.schema.json', profileManifest, `${profile} consumer projection manifest`);

    for (const [field, retainSource] of [['output_paths', true], ['output_digests', false]]) {
      const keys = Object.keys(profileManifest[field]).filter((key) => !retainSource || key !== 'source');
      assert.ok(keys.length > 0, `${profile} ${field} must expose its complete generated output set`);

      const missing = structuredClone(profileManifest);
      delete missing[field][keys[0]];
      assertInvalid(ajv, 'projection-manifest.schema.json', missing, `${profile} consumer manifest missing ${field} key`);

      const substituted = structuredClone(profileManifest);
      const value = substituted[field][keys[0]];
      delete substituted[field][keys[0]];
      substituted[field].arbitraryOutput = value;
      assertInvalid(ajv, 'projection-manifest.schema.json', substituted, `${profile} consumer manifest with arbitrary ${field} key`);
    }
  }
});

test('clean package distribution manifests validate against their published schemas', async () => {
  const ajv = await schemaValidator();
  const root = await mkdtemp(join(tmpdir(), 'accessibility-schema-build-'));
  try {
    await cp(join(packageRoot, 'package.json'), join(root, 'package.json'));
    await cp(join(packageRoot, 'src'), join(root, 'src'), { recursive: true });
    await cp(join(packageRoot, 'profiles'), join(root, 'profiles'), { recursive: true });
    await cp(join(packageRoot, 'schemas'), join(root, 'schemas'), { recursive: true });
    await buildDistribution(root);
    const manifest = JSON.parse(await readFile(join(root, 'dist', 'manifest.json'), 'utf8'));
    const projections = JSON.parse(await readFile(join(root, 'dist', 'projection-manifest.json'), 'utf8'));
    assertValid(ajv, 'manifest.schema.json', manifest, 'distribution manifest');
    assertValid(ajv, 'projection-manifest.schema.json', projections, 'distribution projection manifest');

    for (const [label, mutate] of [
      ['empty profile digest', (candidate) => { candidate.profile_digests.conductor = ''; }],
      ['corrupt UI source metadata', (candidate) => { candidate.ui_design_brain.manifest_path = 'catalog-manifest.json'; }],
      ['corrupt UI source digest', (candidate) => { candidate.ui_design_brain.source_digest = 'sha256:not-a-digest'; }],
      ['empty UI manifest digest', (candidate) => { candidate.ui_design_brain.manifest_digest = ''; }],
      ['corrupt UI binding digest', (candidate) => { candidate.ui_design_brain.binding_digest = 'sha256:' + '0'.repeat(64); }],
      ['wrong canonical record ID', (candidate) => { candidate.records[0].id = 'semantics.accessible-name'; }],
      ['empty record digest', (candidate) => { candidate.records[0].digest = ''; }],
      ['duplicate record ID', (candidate) => { candidate.records[1] = structuredClone(candidate.records[0]); }],
    ]) {
      const candidate = structuredClone(manifest);
      mutate(candidate);
      assertInvalid(ajv, 'manifest.schema.json', candidate, `distribution manifest: ${label}`);
    }

    for (const [label, mutate] of [
      ['corrupt profile digest', (candidate) => { candidate.profile_digests['ai-orchestration'] = 'not-a-digest'; }],
      ['empty projected profile digest', (candidate) => { candidate.profiles.conductor.profile_digest = ''; }],
      ['corrupt UI source metadata', (candidate) => { candidate.ui_design_brain.repository = 'https://example.com/ui-design-brain'; }],
      ['empty UI source digest', (candidate) => { candidate.ui_design_brain.source_digest = ''; }],
      ['corrupt UI manifest digest', (candidate) => { candidate.ui_design_brain.manifest_digest = '0'.repeat(64); }],
      ['empty UI binding digest', (candidate) => { candidate.ui_design_brain.binding_digest = ''; }],
      ['empty projected output map', (candidate) => { candidate.profiles.conductor.outputs = {}; }],
    ]) {
      const candidate = structuredClone(projections);
      mutate(candidate);
      assertInvalid(ajv, 'projection-manifest.schema.json', candidate, `distribution projection manifest: ${label}`);
    }

    for (const profile of ['conductor', 'ai-orchestration']) {
      const outputKeys = Object.keys(projections.profiles[profile].outputs);
      assert.ok(outputKeys.length > 0, `${profile} distribution profile must expose its complete output set`);

      const missingOutput = structuredClone(projections);
      delete missingOutput.profiles[profile].outputs[outputKeys[0]];
      assertInvalid(ajv, 'projection-manifest.schema.json', missingOutput, `${profile} distribution profile missing output key`);

      const substitutedOutput = structuredClone(projections);
      const digestValue = substitutedOutput.profiles[profile].outputs[outputKeys[0]];
      delete substitutedOutput.profiles[profile].outputs[outputKeys[0]];
      substitutedOutput.profiles[profile].outputs.arbitraryOutput = digestValue;
      assertInvalid(ajv, 'projection-manifest.schema.json', substitutedOutput, `${profile} distribution profile with arbitrary output key`);
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
