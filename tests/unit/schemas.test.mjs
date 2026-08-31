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
  assertValid(ajv, 'applicability-matrix.schema.json', data.matrix, 'applicability matrix');
  assertValid(ajv, 'ui-design-brain-bindings.schema.json', data.uiDesignBrainBindings, 'UI Design Brain bindings');
  for (const profile of Object.values(data.profiles)) assertValid(ajv, 'profile.schema.json', profile, profile.name);

  const config = {
    package: '@verndale/accessibility-standards@3.0.0',
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
  const corrupt = structuredClone(manifest);
  corrupt.digests.source = 'not-a-digest';
  assert.equal(ajv.getSchema('projection-manifest.schema.json')(corrupt), false);
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
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
