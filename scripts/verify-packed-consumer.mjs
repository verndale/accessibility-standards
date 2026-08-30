import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const packed = execFileSync('pnpm', ['pack', '--pack-destination', root], { cwd: root, encoding: 'utf8' }).trim().split('\n').at(-1);
const sandbox = await mkdtemp(join(tmpdir(), 'a11y-packed-'));
try {
  await writeFile(join(sandbox, 'package.json'), JSON.stringify({ private: true, dependencies: { '@verndale/accessibility-standards': `file:${join(root, packed)}` } }));
  execFileSync('pnpm', ['install', '--frozen-lockfile=false'], { cwd: sandbox, stdio: 'inherit' });
  execFileSync(join(sandbox, 'node_modules', '.bin', 'accessibility-standards'), ['validate'], { cwd: sandbox, stdio: 'inherit' });
} finally {
  await rm(sandbox, { recursive: true, force: true });
  await rm(join(root, packed), { force: true });
}
