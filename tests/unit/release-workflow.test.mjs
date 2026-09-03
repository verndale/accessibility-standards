import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = new URL('../../.github/workflows/release.yml', import.meta.url);
const releaseConfig = new URL('../../release.config.cjs', import.meta.url);
const packageFile = new URL('../../package.json', import.meta.url);
const packedConsumerVerifier = new URL('../../scripts/verify-packed-consumer.mjs', import.meta.url);

test('release uses tokenless trusted publishing after complete package verification', async () => {
  const source = await readFile(workflow, 'utf8');
  assert.match(source, /id-token: write/);
  assert.match(source, /pnpm verify:ci/);
  assert.match(source, /verify-packed-consumer\.mjs/);
  assert.match(source, /npm publish --dry-run --ignore-scripts --tag development/);
  assert.match(source, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
  assert.doesNotMatch(source, /NPM_TOKEN|NODE_AUTH_TOKEN|registry-url/);
});

test('release metadata matches the public GitHub repository and version policy', async () => {
  const config = await readFile(releaseConfig, 'utf8');
  const pkg = JSON.parse(await readFile(packageFile, 'utf8'));
  assert.match(pkg.scripts['verify:ci'], /^pnpm release:preflight && /);
  assert.equal(pkg.repository.url, 'git+https://github.com/verndale/accessibility-standards.git');
  assert.deepEqual(pkg.publishConfig, { access: 'public', provenance: true });
  assert.match(config, /\{ breaking: true, release: 'major' \}/);
  assert.match(config, /\{ type: 'feat', release: 'minor' \}/);
  assert.match(config, /assets: \['CHANGELOG\.md'\]/);
  assert.doesNotMatch(config, /package\.json', 'pnpm-lock\.yaml/);
});

test('packed-consumer verification derives the consumer pin from current package metadata', async () => {
  const source = await readFile(packedConsumerVerifier, 'utf8');
  assert.match(source, /const packageId = `\$\{packageManifest\.name\}@\$\{packageManifest\.version\}`/);
  assert.match(source, /package: packageId/);
  assert.doesNotMatch(source, /@verndale\/accessibility-standards@\d+\.\d+\.\d+/);
});
