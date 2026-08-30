import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadStandards, packageRoot } from './load.mjs';
import { buildArtifacts, defaultPath } from './render.mjs';
import { digest } from './digest.mjs';
import { validateStandards } from './validate.mjs';

export async function buildDistribution(root = packageRoot) {
  const data = await loadStandards(root);
  validateStandards(data);
  const dist = join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  const profileManifests = {};
  for (const profile of ['conductor', 'ai-orchestration']) {
    const artifacts = buildArtifacts(data, profile);
    const outputDigests = {};
    for (const [key, content] of artifacts) {
      const path = join(dist, 'profiles', profile, defaultPath(key, profile));
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, content);
      outputDigests[key] = digest(content);
    }
    profileManifests[profile] = { version: '1.0.0', outputs: outputDigests };
  }
  const records = [...data.foundations, ...data.semantics, ...data.patterns, ...data.policies].sort((a, b) => a.id.localeCompare(b.id));
  const manifest = { package: `@verndale/accessibility-standards@${data.package.version}`, schema_version: 1, records: records.map((record) => ({ id: record.id, digest: digest(record) })) };
  await writeFile(join(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(dist, 'projection-manifest.json'), `${JSON.stringify({ package: manifest.package, profiles: profileManifests }, null, 2)}\n`);
  await writeFile(join(dist, 'requirements-to-implementation.md'), `# Requirements to implementation\n\n${data.patterns.sort((a, b) => a.id.localeCompare(b.id)).map((pattern) => `- ${pattern.id} → ${pattern.requires.join(', ')} → ${pattern.implementation_outcomes.join(', ')}`).join('\n')}\n`);
  return { records: records.length, profiles: 2 };
}
