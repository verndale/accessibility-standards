import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = process.cwd();
const packed = execFileSync('pnpm', ['pack', '--pack-destination', root], { cwd: root, encoding: 'utf8' }).trim().split('\n').at(-1);
const sandbox = await mkdtemp(join(tmpdir(), 'a11y-packed-'));
try {
  await writeFile(join(sandbox, 'package.json'), JSON.stringify({ private: true, dependencies: { '@verndale/accessibility-standards': `file:${join(root, packed)}` } }));
  execFileSync('pnpm', ['install', '--frozen-lockfile=false'], { cwd: sandbox, stdio: 'inherit' });
  const executable = join(sandbox, 'node_modules', '.bin', 'accessibility-standards');
  execFileSync(executable, ['validate'], { cwd: sandbox, stdio: 'inherit' });
  for (const profile of ['conductor', 'ai-orchestration']) {
    const consumer = join(sandbox, profile);
    const config = join(consumer, 'accessibility-standards.config.json');
    await mkdir(consumer, { recursive: true });
    await writeFile(config, `${JSON.stringify({
      package: '@verndale/accessibility-standards@3.1.1',
      profile,
      routes: 'accessibility-standards.routes.json',
      outputRoot: 'generated',
    }, null, 2)}\n`);
    await writeFile(join(consumer, 'accessibility-standards.routes.json'), `${JSON.stringify({
      version: 1,
      outputs: {
        source: 'accessibility.source.json',
        patterns: 'patterns',
        semantics: 'semantics',
      },
    }, null, 2)}\n`);
    execFileSync(executable, ['sync', '--config', config], { cwd: consumer, stdio: 'inherit' });
    execFileSync(executable, ['sync', '--if-needed', '--config', config], { cwd: consumer, stdio: 'inherit' });
    execFileSync(executable, ['check', '--config', config], { cwd: consumer, stdio: 'inherit' });
  }
} finally {
  await rm(sandbox, { recursive: true, force: true });
  await rm(join(root, packed), { force: true });
}
