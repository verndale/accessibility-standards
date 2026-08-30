import { chmod, mkdir } from 'node:fs/promises';
await mkdir('.husky', { recursive: true });
for (const name of ['prepare-commit-msg', 'commit-msg', 'pre-commit', 'pre-push']) {
  try { await chmod(`.husky/${name}`, 0o755); } catch {}
}
