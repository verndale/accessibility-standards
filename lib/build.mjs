import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { loadStandards, packageRoot } from './load.mjs';
import { buildArtifacts, defaultPath, marker } from './render.mjs';
import { canonicalize, digest } from './digest.mjs';
import { profileContractDigest, sourceContractDigest } from './provenance.mjs';
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
    profileManifests[profile] = {
      version: data.profiles[profile].version,
      profile_digest: profileContractDigest(data, profile),
      source_digest: sourceContractDigest(data),
      outputs: outputDigests,
    };
  }
  const records = [...data.foundations, ...data.semantics, ...data.patterns, ...data.policies].sort((a, b) => a.id.localeCompare(b.id));
  const manifest = {
    _generated: marker,
    package: `@verndale/accessibility-standards@${data.contract.package_version}`,
    schema_version: data.contract.schema_version,
    source_digest: sourceContractDigest(data),
    profile_digests: Object.fromEntries(Object.keys(data.profiles).sort().map((profile) => [profile, profileContractDigest(data, profile)])),
    ui_design_brain: { ...data.uiDesignBrainBindings.source, binding_digest: digest(data.uiDesignBrainBindings) },
    records: records.map((record) => ({ id: record.id, digest: digest(record) }))
  };
  await writeFile(join(dist, 'manifest.json'), `${JSON.stringify(canonicalize(manifest), null, 2)}\n`);
  await writeFile(join(dist, 'projection-manifest.json'), `${JSON.stringify(canonicalize({ _generated: marker, package: manifest.package, schema_version: manifest.schema_version, source_digest: manifest.source_digest, profile_digests: manifest.profile_digests, ui_design_brain: manifest.ui_design_brain, profiles: profileManifests }), null, 2)}\n`);
  await writeFile(join(dist, 'requirements-to-implementation.md'), `<!-- ${marker} -->\n<!-- package: ${manifest.package}; schema: ${manifest.schema_version}; source-digest: ${manifest.source_digest} -->\n# Requirements to implementation\n\n${data.patterns.sort((a, b) => a.id.localeCompare(b.id)).map((pattern) => `- ${pattern.id} → ${pattern.requires.join(', ')} → ${pattern.implementation_outcomes.join(', ')}`).join('\n')}\n`);
  return { records: records.length, profiles: 2 };
}
