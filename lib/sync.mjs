import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { buildProjectionManifest } from './build-manifest.mjs';
import { digest } from './digest.mjs';
import { loadStandards, packageRoot } from './load.mjs';
import { buildArtifacts, defaultPath, marker } from './render.mjs';
import { validateStandards } from './validate.mjs';

const exists = async (path) => access(path).then(() => true, () => false);

export async function projection({ configPath, check = false, ifNeeded = false }) {
  const absoluteConfig = resolve(configPath);
  const consumerRoot = dirname(absoluteConfig);
  const config = JSON.parse(await readFile(absoluteConfig, 'utf8'));
  const expectedPackage = '@verndale/accessibility-standards@1.0.0';
  if (config.package !== expectedPackage) throw new Error(`Exact package pin required: ${expectedPackage}`);
  const routesPath = resolve(consumerRoot, config.routes);
  const routes = JSON.parse(await readFile(routesPath, 'utf8'));
  const data = await loadStandards(packageRoot);
  validateStandards(data);
  const outputRoot = resolve(consumerRoot, config.outputRoot ?? '.');
  const artifacts = buildArtifacts(data, config.profile);
  const sourceKey = 'source';
  const sourcePath = resolveOutput(outputRoot, routes.outputs[sourceKey] ?? 'accessibility.source.json');
  const manifest = buildProjectionManifest({ data, profile: config.profile, config, routes, artifacts });
  artifacts.set(sourceKey, `${JSON.stringify(manifest, null, 2)}\n`);
  const paths = new Map([...artifacts].map(([key]) => [key, resolveOutput(outputRoot, routeFor(key, routes, config.profile))]));
  if (check) return checkProjection(artifacts, paths);
  if (ifNeeded && await projectionMatches(artifacts, paths)) return { changed: false, files: paths.size };
  await protectManagedFiles(paths, sourcePath);
  const stage = join(tmpdir(), `a11y-sync-${process.pid}-${Date.now()}`);
  await mkdir(stage, { recursive: true });
  try {
    let index = 0;
    const staged = [];
    for (const [key, content] of artifacts) {
      const temp = join(stage, String(index++));
      await writeFile(temp, content);
      staged.push([temp, paths.get(key)]);
    }
    for (const [temp, target] of staged) {
      await mkdir(dirname(target), { recursive: true });
      await rename(temp, target);
    }
  } finally { await rm(stage, { recursive: true, force: true }); }
  await checkProjection(artifacts, paths);
  return { changed: true, files: paths.size };
}

async function protectManagedFiles(paths, sourcePath) {
  let prior = null;
  if (await exists(sourcePath)) {
    const raw = await readFile(sourcePath, 'utf8');
    if (!raw.includes(marker)) throw new Error(`Refusing to overwrite unmarked provenance: ${sourcePath}`);
    prior = JSON.parse(raw);
  }
  for (const [key, path] of paths) {
    if (!await exists(path)) continue;
    const raw = await readFile(path, 'utf8');
    if (!raw.includes(marker)) throw new Error(`Refusing to overwrite unmarked generated target: ${path}`);
    const expected = prior?.output_digests?.[key];
    if (expected && digest(raw) !== expected) throw new Error(`Refusing to overwrite locally modified generated target: ${path}`);
  }
}

async function projectionMatches(artifacts, paths) {
  try { await checkProjection(artifacts, paths); return true; } catch { return false; }
}

async function checkProjection(artifacts, paths) {
  const errors = [];
  for (const [key, content] of artifacts) {
    const path = paths.get(key);
    if (!await exists(path)) { errors.push(`Missing generated output: ${path}`); continue; }
    const actual = await readFile(path, 'utf8');
    if (!actual.includes(marker)) errors.push(`Missing generated marker: ${path}`);
    if (actual !== content) errors.push(`Stale generated output: ${path}`);
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { changed: false, files: paths.size };
}

function routeFor(key, routes, profile) {
  if (routes.outputs[key]) return routes.outputs[key];
  if (key.startsWith('pattern:') && routes.outputs.patterns) return join(routes.outputs.patterns, defaultPath(key, profile).split('/').pop());
  if (key.startsWith('semantic:') && routes.outputs.semantics) return join(routes.outputs.semantics, defaultPath(key, profile).split('/').pop());
  return defaultPath(key, profile);
}

function resolveOutput(root, path) {
  const target = isAbsolute(path) ? path : resolve(root, path);
  return target;
}
