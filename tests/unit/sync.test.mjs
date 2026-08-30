import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { projection } from '../../lib/sync.mjs';

async function fixture(profile = 'conductor') {
  const root = await mkdtemp(join(tmpdir(), 'a11y-sync-test-'));
  await writeFile(join(root, 'accessibility-standards.config.json'), JSON.stringify({ package: '@verndale/accessibility-standards@1.0.0', profile, routes: 'accessibility-standards.routes.json', outputRoot: 'generated' }));
  await writeFile(join(root, 'accessibility-standards.routes.json'), JSON.stringify({ version: 1, outputs: { source: 'accessibility.source.json', patterns: 'patterns' } }));
  return root;
}

test('sync, no-op, and check are deterministic', async () => {
  const root = await fixture();
  try {
    const configPath = join(root, 'accessibility-standards.config.json');
    assert.equal((await projection({ configPath })).changed, true);
    assert.equal((await projection({ configPath, ifNeeded: true })).changed, false);
    assert.equal((await projection({ configPath, check: true })).changed, false);
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
