import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const releaseConfig = require('../../release.config.cjs');
const { analyzeCommits } = await import('@semantic-release/commit-analyzer');

const logger = { log() {} };
const analyzer = releaseConfig.plugins.find(
  ([plugin]) => plugin === '@semantic-release/commit-analyzer',
);
const notes = releaseConfig.plugins.find(
  ([plugin]) => plugin === '@semantic-release/release-notes-generator',
);

test('analyzes a conventional breaking header as a major release', async () => {
  assert.ok(analyzer, 'commit analyzer configuration is present');
  const [, options] = analyzer;
  const releaseType = await analyzeCommits(options, {
    commits: [{ message: 'feat(standards)!: revise authority contract' }],
    logger,
  });

  assert.equal(releaseType, 'major');
});

test('generates notes with the same conventional commit parser', () => {
  assert.ok(notes, 'release notes generator configuration is present');
  const [, options] = notes;
  assert.deepEqual(options, {
    preset: 'conventionalcommits',
    presetConfig: {},
  });
});
