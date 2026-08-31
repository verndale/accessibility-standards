#!/usr/bin/env node

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const {
  MIGRATED_BREAKING_BODY_COMMIT,
  computedNextVersion,
  readReleaseCommits,
  validateReleaseCommit,
  validateReleaseCommits,
  validateReleaseTarget,
} = require('./check-release-commit.cjs');

assert.deepEqual(validateReleaseCommit({ subject: 'feat(standards): add stable records', body: '' }), []);
assert.deepEqual(validateReleaseCommit({ subject: 'feat(standards)!: revise authority contract', body: '' }), []);
assert.match(
  validateReleaseCommit({
    subject: 'ci: refresh release workflow',
    body: 'Combined changes\n\nBREAKING CHANGE: stale text from an earlier PR',
  })[0],
  /must not carry a BREAKING CHANGE body/,
);
assert.deepEqual(
  validateReleaseCommit({
    hash: MIGRATED_BREAKING_BODY_COMMIT,
    subject: 'feat(wcag)!: Expand WCAG 2.2 coverage and APG patterns',
    body: 'BREAKING CHANGE: duplicated historical footer',
  }),
  [],
);
assert.match(
  validateReleaseCommit({
    hash: `${MIGRATED_BREAKING_BODY_COMMIT.slice(0, -1)}5`,
    subject: 'feat(wcag)!: Expand WCAG 2.2 coverage and APG patterns',
    body: 'BREAKING CHANGE: duplicated historical footer',
  })[0],
  /must not carry a BREAKING CHANGE body/,
);
assert.equal(
  computedNextVersion('v1.0.0', [{ subject: 'feat(standards)!: revise authority contract' }]),
  '2.0.0',
);
assert.deepEqual(
  validateReleaseTarget({
    lastTag: 'v1.0.0',
    commits: [{ subject: 'feat(standards)!: revise authority contract' }],
    targetVersion: '2.0.0',
  }),
  [],
);
assert.match(
  validateReleaseTarget({
    lastTag: 'v1.0.0',
    commits: [{ subject: 'docs: describe a breaking implementation' }],
    targetVersion: '2.0.0',
  })[0],
  /compute 1\.0\.1 but package contract targets 2\.0\.0/,
);
assert.match(
  validateReleaseCommit({ subject: 'feat(standards) !: malformed', body: '' })[0],
  /conventional type/,
);

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'accessibility-release-preflight-'));
try {
  const git = (...args) => execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  git('init', '-q');
  git('config', 'user.email', 'release@example.com');
  git('config', 'user.name', 'Release Fixture');
  git('commit', '--allow-empty', '-q', '-m', 'chore: published baseline');
  git('tag', 'v1.0.0');
  git('commit', '--allow-empty', '-q', '-m', 'feat: aggregated change', '-m', 'BREAKING CHANGE: stale footer');
  git('commit', '--allow-empty', '-q', '-m', 'fix: clean head');
  const releaseRange = readReleaseCommits(root);
  assert.equal(releaseRange.lastTag, 'v1.0.0');
  assert.equal(releaseRange.commits.length, 2);
  assert.match(validateReleaseCommits(releaseRange.commits)[0], /feat: aggregated change/);
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

process.stdout.write('PASS release commit preflight self-tests.\n');
