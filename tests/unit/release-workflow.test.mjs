import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = new URL('../../.github/workflows/release.yml', import.meta.url);
const prWorkflow = new URL('../../.github/workflows/pr.yml', import.meta.url);
const commitlintWorkflow = new URL('../../.github/workflows/commitlint.yml', import.meta.url);
const qualityWorkflow = new URL('../../.github/workflows/quality.yml', import.meta.url);
const wikiCheckWorkflow = new URL('../../.github/workflows/wiki-check.yml', import.meta.url);
const releaseConfig = new URL('../../release.config.cjs', import.meta.url);
const packageFile = new URL('../../package.json', import.meta.url);

test('release uses tokenless trusted publishing after complete package verification', async () => {
  const source = await readFile(workflow, 'utf8');
  assert.match(source, /id-token: write/);
  assert.match(source, /branches:\n\s+- main\n\s+- '2\.x'/);
  assert.match(source, /pnpm verify:ci/);
  assert.match(source, /verify-packed-consumer\.mjs/);
  assert.match(source, /npm publish --dry-run --ignore-scripts --tag development/);
  assert.match(source, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
  assert.doesNotMatch(source, /NPM_TOKEN|NODE_AUTH_TOKEN|registry-url/);
});

test('release metadata matches the public GitHub repository and version policy', async () => {
  const config = await readFile(releaseConfig, 'utf8');
  const pkg = JSON.parse(await readFile(packageFile, 'utf8'));
  assert.equal(pkg.repository.url, 'git+https://github.com/verndale/accessibility-standards.git');
  assert.deepEqual(pkg.publishConfig, { access: 'public', provenance: true });
  assert.match(config, /\{ breaking: true, release: 'major' \}/);
  assert.match(config, /\{ type: 'feat', release: 'minor' \}/);
  assert.match(config, /assets: \['CHANGELOG\.md'\]/);
  assert.doesNotMatch(config, /package\.json', 'pnpm-lock\.yaml/);
});

test('PR automation excludes long-lived release and wiki branches', async () => {
  const source = await readFile(prWorkflow, 'utf8');
  assert.match(source, /branches-ignore: \[main, "2\.x", "bot\/wiki-\*\*"\]/);
  assert.match(source, /github\.ref_name != '2\.x'/);
  assert.match(source, /startsWith\(github\.ref_name, 'codex\/2\.x-'\) && '2\.x'/);
});

test('required pull-request checks protect schema-2 maintenance changes', async () => {
  const [commitlint, quality, wikiCheck] = await Promise.all([
    readFile(commitlintWorkflow, 'utf8'),
    readFile(qualityWorkflow, 'utf8'),
    readFile(wikiCheckWorkflow, 'utf8'),
  ]);
  assert.match(commitlint, /branches: \[main, "2\.x"\]/);
  assert.match(quality, /branches: \[main, "2\.x"\]/);
  assert.match(wikiCheck, /pull_request:\n\s+branches: \[main, "2\.x"\]/);
});
