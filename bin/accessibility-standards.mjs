#!/usr/bin/env node
import { buildDistribution } from '../lib/build.mjs';
import { loadStandards } from '../lib/load.mjs';
import { projection } from '../lib/sync.mjs';
import { validateStandards } from '../lib/validate.mjs';

const [command, ...args] = process.argv.slice(2);
const flag = (name) => args.includes(name);
const value = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

try {
  if (command === 'validate') {
    const result = validateStandards(await loadStandards());
    console.log(`PASS standards validation: ${result.semantics} semantics, ${result.patterns} patterns, ${result.applicability} applicability rows`);
  } else if (command === 'build') {
    const result = await buildDistribution();
    console.log(`PASS distribution build: ${result.records} records, ${result.profiles} profiles`);
  } else if (command === 'sync' || command === 'check') {
    const configPath = value('--config');
    if (!configPath) throw new Error(`${command} requires --config <path>`);
    const result = await projection({ configPath, check: command === 'check', ifNeeded: flag('--if-needed') });
    console.log(`PASS ${command}: ${result.files} outputs${result.changed ? ' updated' : ' current'}`);
  } else {
    throw new Error('Usage: accessibility-standards <build|validate|sync|check> [--if-needed] [--config path]');
  }
} catch (error) {
  console.error(`FAIL ${command ?? 'command'}: ${error.message}`);
  process.exitCode = 1;
}
