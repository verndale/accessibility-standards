import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { digest } from '../../lib/digest.mjs';
import { projection } from '../../lib/sync.mjs';

async function fixture(profile = 'conductor') {
  const root = await mkdtemp(join(tmpdir(), 'a11y-sync-test-'));
  await writeFile(join(root, 'accessibility-standards.config.json'), JSON.stringify({ package: '@verndale/accessibility-standards@3.1.1', profile, routes: 'accessibility-standards.routes.json', outputRoot: 'generated' }));
  await writeFile(join(root, 'accessibility-standards.routes.json'), JSON.stringify({ version: 1, outputs: { source: 'accessibility.source.json', patterns: 'patterns' } }));
  return root;
}

async function files(root, prefix = '') {
  const result = {};
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const relative = join(prefix, entry.name);
    const absolute = join(root, entry.name);
    if (entry.isDirectory()) Object.assign(result, await files(absolute, relative));
    else if (entry.isFile()) result[relative] = await readFile(absolute, 'utf8');
  }
  return result;
}

test('sync, no-op, and check are deterministic', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    assert.equal((await projection({ configPath })).changed, true);
    const provenance = JSON.parse(await readFile(join(root, 'generated', 'accessibility.source.json'), 'utf8'));
    assert.equal(provenance.package, '@verndale/accessibility-standards@3.1.1');
    assert.equal(provenance.profile_version, '3.1.1');
    assert.equal(provenance.schema_version, 3);
    assert.match(provenance.digests.profile, /^[a-f0-9]{64}$/);
    assert.match(provenance.manifest_digest, /^[a-f0-9]{64}$/);
    assert.equal(provenance.ui_design_brain.manifest_digest, 'sha256:63a0bc8d9537d6d4c0aef8fd8a539bf4a9181a50d0761bd63eae6fe59b4eddc9');
    assert.equal(provenance.ui_design_brain.binding_digest, provenance.digests.ui_design_brain_bindings);
    assert.equal(provenance.ui_pattern_ids.length, provenance.ui_design_brain.pattern_count);
    const coverageRaw = await readFile(join(root, 'generated', 'coverage-manifest.json'), 'utf8');
    const coverage = JSON.parse(coverageRaw);
    assert.equal(coverage.schema_version, 3);
    assert.equal(coverage.wcag_2_2.criteria.length, 55);
    assert.equal(provenance.output_paths.coverageManifest, 'coverage-manifest.json');
    assert.equal(provenance.output_digests.coverageManifest, digest(coverageRaw));
    assert.equal((await projection({ configPath, ifNeeded: true })).changed, false);
    assert.equal((await projection({ configPath, check: true })).changed, false);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('sync refuses to overwrite locally modified generated provenance', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await projection({ configPath });
    const target = join(root, 'generated', 'accessibility.source.json');
    const provenance = JSON.parse(await readFile(target, 'utf8'));
    provenance.profile_version = 'locally-edited';
    await writeFile(target, `${JSON.stringify(provenance, null, 2)}\n`);
    await assert.rejects(() => projection({ configPath }), /locally modified generated provenance/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('sync refuses to overwrite a modified generated file', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await projection({ configPath });
    const target = join(root, 'generated', 'semantics.json');
    await writeFile(target, `${await readFile(target, 'utf8')}modified\n`);
    await assert.rejects(() => projection({ configPath }), /locally modified generated target/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('sync refuses unmarked targets and targets whose provenance is missing', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await writeFile(join(root, 'generated', 'semantics.json'), 'authored content\n').catch(async () => {
      await mkdir(join(root, 'generated'), { recursive: true });
      await writeFile(join(root, 'generated', 'semantics.json'), 'authored content\n');
    });
    await assert.rejects(() => projection({ configPath }), /without their provenance/);
    await rm(join(root, 'generated'), { recursive: true, force: true });
    await projection({ configPath });
    await unlink(join(root, 'generated', 'accessibility.source.json'));
    await assert.rejects(() => projection({ configPath }), /without their provenance/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('sync repairs a missing managed output and records every managed path', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await projection({ configPath });
    await unlink(join(root, 'generated', 'semantics.json'));
    assert.equal((await projection({ configPath, ifNeeded: true })).changed, true);
    const provenance = JSON.parse(
      await readFile(join(root, 'generated', 'accessibility.source.json'), 'utf8'),
    );
    assert.equal(provenance.output_paths.source, 'accessibility.source.json');
    assert.equal(provenance.output_paths.semanticsJson, 'semantics.json');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('route changes remove only clean prior managed outputs', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await projection({ configPath });
    const oldPath = join(root, 'generated', 'a11y-semantics.md');
    assert.equal(await readFile(oldPath, 'utf8').then(() => true), true);
    await writeFile(
      join(root, 'accessibility-standards.routes.json'),
      JSON.stringify({
        version: 1,
        outputs: {
          source: 'accessibility.source.json',
          patterns: 'patterns',
          semanticsMarkdown: 'references/semantics.md',
        },
      }),
    );
    await projection({ configPath });
    await assert.rejects(() => readFile(oldPath, 'utf8'), /ENOENT/);
    assert.match(
      await readFile(join(root, 'generated', 'references', 'semantics.md'), 'utf8'),
      /GENERATED by @verndale\/accessibility-standards/,
    );
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a mid-promotion failure restores every prior output byte-for-byte', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await projection({ configPath });
    const before = await files(join(root, 'generated'));
    await writeFile(
      join(root, 'accessibility-standards.routes.json'),
      JSON.stringify({
        version: 1,
        outputs: {
          source: 'accessibility.source.json',
          patterns: 'patterns',
          semanticsMarkdown: 'references/semantics.md',
        },
      }),
    );
    await assert.rejects(
      () =>
        projection({
          configPath,
          promotionHooks: {
            beforePromote({ index }) {
              if (index === 3) throw new Error('injected promotion failure');
            },
          },
        }),
      /injected promotion failure/,
    );
    assert.deepEqual(await files(join(root, 'generated')), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('config, routes, traversal, collisions, and symlink escapes fail closed', async () => {
  const root = await fixture();
  const configPath = join(root, 'accessibility-standards.config.json');
  try {
    await writeFile(
      configPath,
      JSON.stringify({
        package: '@verndale/accessibility-standards@3.1.1',
        profile: 'conductor',
        routes: 'accessibility-standards.routes.json',
        unexpected: true,
      }),
    );
    await assert.rejects(() => projection({ configPath }), /unknown keys/);

    await writeFile(
      configPath,
      JSON.stringify({
        package: '@verndale/accessibility-standards@3.1.1',
        profile: 'conductor',
        routes: 'accessibility-standards.routes.json',
        outputRoot: 'generated',
      }),
    );
    await writeFile(
      join(root, 'accessibility-standards.routes.json'),
      JSON.stringify({ version: 1, outputs: { source: '../escape.json' } }),
    );
    await assert.rejects(() => projection({ configPath }), /escapes its allowed root/);

    await writeFile(
      join(root, 'accessibility-standards.routes.json'),
      JSON.stringify({
        version: 1,
        outputs: { source: 'same.json', semanticsJson: 'same.json' },
      }),
    );
    await assert.rejects(() => projection({ configPath }), /routes collide/);

    const outside = await mkdtemp(join(tmpdir(), 'a11y-sync-outside-'));
    await mkdir(join(root, 'generated'), { recursive: true });
    await symlink(outside, join(root, 'generated', 'linked'));
    await writeFile(
      join(root, 'accessibility-standards.routes.json'),
      JSON.stringify({ version: 1, outputs: { source: 'linked/source.json' } }),
    );
    await assert.rejects(() => projection({ configPath }), /traverses a symbolic link/);
    await rm(outside, { recursive: true, force: true });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('sync implementation has no network or package-manager execution path', async () => {
  const source = await readFile(new URL('../../lib/sync.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\bfetch\s*\(|https?:\/\/|child_process|\b(?:npm|npx|pnpm|bunx)\b/);
});

test('sync rejects a consumer pin that does not match the installed contract version', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    await writeFile(configPath, JSON.stringify({ package: '@verndale/accessibility-standards@1.0.0', profile: 'conductor', routes: 'accessibility-standards.routes.json', outputRoot: 'generated' }));
    await assert.rejects(() => projection({ configPath }), /Exact installed package pin required: @verndale\/accessibility-standards@3\.1\.1/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
