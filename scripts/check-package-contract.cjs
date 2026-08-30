#!/usr/bin/env node

'use strict';

const { readFileSync } = require('node:fs');
const { join } = require('node:path');

function validatePackageContract({ pkg, contract, profiles }) {
  const failures = [];
  if (pkg.name !== '@verndale/accessibility-standards') failures.push(`unexpected package name ${pkg.name ?? '<missing>'}`);
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version ?? '')) failures.push(`invalid package version ${pkg.version ?? '<missing>'}`);
  if (pkg.version !== contract.package_version) failures.push(`package.json ${pkg.version} does not match src/contract.yml ${contract.package_version}`);
  if (contract.schema_version !== 2) failures.push(`unsupported contract schema ${contract.schema_version ?? '<missing>'}`);
  for (const [name, profile] of Object.entries(profiles)) {
    if (profile.name !== name || profile.version !== pkg.version) failures.push(`${name} profile ${profile.version ?? '<missing>'} does not match package ${pkg.version}`);
  }
  return failures;
}

if (require.main === module) {
  const root = process.cwd();
  const input = {
    pkg: JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')),
    contract: JSON.parse(readFileSync(join(root, 'src', 'contract.yml'), 'utf8')),
    profiles: Object.fromEntries(['conductor', 'ai-orchestration'].map((name) => [
      name,
      JSON.parse(readFileSync(join(root, 'profiles', name, 'profile.json'), 'utf8')),
    ])),
  };
  const failures = validatePackageContract(input);
  if (failures.length) {
    for (const failure of failures) process.stderr.write(`FAIL ${failure}\n`);
    process.exit(1);
  }
  process.stdout.write(`PASS package, contract, and profiles target ${input.pkg.version}.\n`);
}

module.exports = { validatePackageContract };
