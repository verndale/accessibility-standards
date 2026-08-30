import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));

export async function readJsonYaml(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function filesUnder(root) {
  const entries = await readdir(root, { withFileTypes: true });
  const nested = await Promise.all(entries.sort((a, b) => a.name.localeCompare(b.name)).map(async (entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? filesUnder(path) : path.endsWith('.yml') ? [path] : [];
  }));
  return nested.flat();
}

export async function loadStandards(root = packageRoot) {
  const semantics = [];
  for (const file of await filesUnder(join(root, 'src', 'semantics'))) {
    const parsed = await readJsonYaml(file);
    semantics.push(...(Array.isArray(parsed) ? parsed : [parsed]));
  }
  const patterns = [];
  for (const file of await filesUnder(join(root, 'src', 'patterns'))) patterns.push(await readJsonYaml(file));
  const foundations = [];
  for (const file of await filesUnder(join(root, 'src', 'foundations'))) foundations.push(await readJsonYaml(file));
  const policies = [];
  for (const file of await filesUnder(join(root, 'src', 'policies'))) policies.push(await readJsonYaml(file));
  return {
    package: JSON.parse(await readFile(join(root, 'package.json'), 'utf8')),
    sources: await readJsonYaml(join(root, 'src', 'sources.yml')),
    facts: await readJsonYaml(join(root, 'src', 'applicability', 'facts.yml')),
    matrix: await readJsonYaml(join(root, 'src', 'applicability', 'matrix.yml')),
    evidence: await readJsonYaml(join(root, 'src', 'evidence', 'proof-routing.yml')),
    foundations, semantics, patterns, policies
  };
}
