#!/usr/bin/env node

'use strict';

const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const BREAKING_BODY = /^BREAKING[ -]CHANGE:\s*/m;
const BREAKING_HEADER = /^[a-z]+(?:\([^)]+\))?!:/;
const CONVENTIONAL_HEADER = /^([a-z]+)(?:\([^)]+\))?(!)?:/;
const PATCH_TYPES = new Set(['build', 'chore', 'ci', 'docs', 'fix', 'perf', 'refactor', 'revert', 'style', 'test']);

function validateReleaseCommit({ subject, body }) {
  const failures = [];
  if (BREAKING_BODY.test(body)) {
    failures.push(
      'release commits must not carry a BREAKING CHANGE body; put ! in the PR title for an intentional breaking release',
    );
  }
  if (subject.includes('!:') && !BREAKING_HEADER.test(subject)) {
    failures.push('an intentional breaking release must use a conventional type(scope)!: or type!: subject');
  }
  return failures;
}

function git(args, cwd) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed`);
  return result.stdout.trim();
}

function readReleaseCommits(cwd = process.cwd()) {
  const tagResult = spawnSync(
    'git',
    ['describe', '--tags', '--match', 'v[0-9]*.[0-9]*.[0-9]*', '--abbrev=0'],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
  );
  if (tagResult.error) throw tagResult.error;
  const lastTag = tagResult.status === 0 ? tagResult.stdout.trim() : null;
  const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
  const output = git(['log', '--format=%H%x1f%s%x1f%b%x1e', range], cwd);
  const commits = output
    .split('\x1e')
    .map((record) => record.trim())
    .filter(Boolean)
    .map((record) => {
      const [hash = '', subject = '', ...body] = record.split('\x1f');
      return { hash: hash.trim(), subject: subject.trim(), body: body.join('\x1f').trim() };
    });
  return { lastTag, commits };
}

function validateReleaseCommits(commits) {
  return commits.flatMap((commit) =>
    validateReleaseCommit(commit).map(
      (message) => `${commit.hash.slice(0, 12)} ${JSON.stringify(commit.subject)}: ${message}`,
    ),
  );
}

function releaseType(subject) {
  const match = CONVENTIONAL_HEADER.exec(subject);
  if (!match) return null;
  if (match[2]) return 'major';
  if (match[1] === 'feat') return 'minor';
  if (PATCH_TYPES.has(match[1])) return 'patch';
  return null;
}

function computedNextVersion(lastTag, commits) {
  if (!lastTag) return '1.0.0';
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(lastTag);
  if (!match) throw new Error(`Unsupported release tag: ${lastTag}`);
  const releases = commits.map(({ subject }) => releaseType(subject));
  const release = releases.includes('major') ? 'major' : releases.includes('minor') ? 'minor' : releases.includes('patch') ? 'patch' : null;
  if (!release) return null;
  let [, major, minor, patch] = match.map(Number);
  if (release === 'major') { major += 1; minor = 0; patch = 0; }
  else if (release === 'minor') { minor += 1; patch = 0; }
  else patch += 1;
  return `${major}.${minor}.${patch}`;
}

function validateReleaseTarget({ lastTag, commits, targetVersion }) {
  const nextVersion = computedNextVersion(lastTag, commits);
  if (nextVersion !== targetVersion) {
    return [`release commits compute ${nextVersion ?? 'no release'} but package contract targets ${targetVersion}; use the exact conventional squash title required by the version policy`];
  }
  return [];
}

if (require.main === module) {
  try {
    const releaseRange = readReleaseCommits();
    const root = process.cwd();
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
    const contract = JSON.parse(readFileSync(join(root, 'src', 'contract.yml'), 'utf8'));
    const failures = [
      ...validateReleaseCommits(releaseRange.commits),
      ...(pkg.version === contract.package_version
        ? validateReleaseTarget({ ...releaseRange, targetVersion: pkg.version })
        : [`package.json ${pkg.version} does not match src/contract.yml ${contract.package_version}`]),
    ];
    if (failures.length > 0) {
      for (const failure of failures) process.stderr.write(`FAIL ${failure}\n`);
      process.exit(1);
    }
    process.stdout.write(
      `PASS ${releaseRange.commits.length} release commit(s) after ${releaseRange.lastTag || 'repository start'} are safe to analyze.\n`,
    );
  } catch (error) {
    process.stderr.write(`FAIL ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}

module.exports = { computedNextVersion, readReleaseCommits, validateReleaseCommit, validateReleaseCommits, validateReleaseTarget };
