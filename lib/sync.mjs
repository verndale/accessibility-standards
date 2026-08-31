import { access, lstat, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { buildProjectionManifest } from './build-manifest.mjs';
import { canonicalize, digest } from './digest.mjs';
import { loadStandards, packageRoot } from './load.mjs';
import { buildArtifacts, defaultPath, marker } from './render.mjs';
import { validateStandards } from './validate.mjs';

const exists = async (path) => access(path).then(() => true, () => false);
const configKeys = new Set(['package', 'profile', 'routes', 'outputRoot']);
const routeKeys = new Set(['version', 'outputs']);

export async function projection({
  configPath,
  check = false,
  ifNeeded = false,
  promotionHooks,
}) {
  const absoluteConfig = resolve(configPath);
  const consumerRoot = dirname(absoluteConfig);
  const config = JSON.parse(await readFile(absoluteConfig, 'utf8'));
  validateConfig(config);
  const routesPath = resolveInside(consumerRoot, config.routes, 'routes');
  await assertNoSymlinkPath(consumerRoot, routesPath, 'routes');
  const routes = JSON.parse(await readFile(routesPath, 'utf8'));
  validateRoutes(routes);
  const data = await loadStandards(packageRoot);
  validateStandards(data);
  const expectedPackage = `@verndale/accessibility-standards@${data.contract.package_version}`;
  if (config.package !== expectedPackage) throw new Error(`Exact installed package pin required: ${expectedPackage}`);
  const outputRoot = resolveInside(consumerRoot, config.outputRoot ?? '.', 'outputRoot', {
    allowRoot: true,
  });
  await assertNoSymlinkPath(consumerRoot, outputRoot, 'outputRoot');
  const artifacts = buildArtifacts(data, config.profile);
  const sourceKey = 'source';
  const artifactKeys = [...artifacts.keys(), sourceKey];
  validateRouteKeys(routes, artifactKeys);
  const paths = new Map(
    artifactKeys.map((key) => [
      key,
      resolveOutput(outputRoot, routeFor(key, routes, config.profile)),
    ]),
  );
  assertUniqueTargets(paths);
  for (const [key, path] of paths) {
    await assertNoSymlinkPath(outputRoot, path, `output ${key}`);
  }
  const sourcePath = paths.get(sourceKey);
  const manifest = buildProjectionManifest({
    data,
    profile: config.profile,
    config,
    routes,
    artifacts,
  });
  manifest.output_paths = Object.fromEntries(
    [...paths]
      .map(([key, path]) => [key, relative(outputRoot, path).split(sep).join('/')])
      .sort(([left], [right]) => left.localeCompare(right)),
  );
  manifest.manifest_digest = digest(manifest);
  artifacts.set(sourceKey, `${JSON.stringify(canonicalize(manifest), null, 2)}\n`);
  if (check) return checkProjection(artifacts, paths);
  if (ifNeeded && await projectionMatches(artifacts, paths)) return { changed: false, files: paths.size };
  const removals = await protectManagedFiles(paths, sourcePath, outputRoot);
  const stage = await mkdtemp(join(consumerRoot, '.accessibility-sync-'));
  try {
    let index = 0;
    const writes = [];
    for (const [key, content] of artifacts) {
      const temp = join(stage, 'candidate', String(index++));
      await mkdir(dirname(temp), { recursive: true });
      await writeFile(temp, content);
      const staged = await readFile(temp, 'utf8');
      if (staged !== content || !staged.includes(marker)) {
        throw new Error(`Staged projection validation failed for ${key}`);
      }
      writes.push({ key, temp, target: paths.get(key) });
    }
    await promoteProjectionTransaction({
      writes,
      removals,
      stage,
      validate: () => checkProjection(artifacts, paths),
      hooks: promotionHooks,
    });
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
  return { changed: true, files: paths.size };
}

async function protectManagedFiles(paths, sourcePath, outputRoot) {
  let prior = null;
  if (await exists(sourcePath)) {
    const raw = await readFile(sourcePath, 'utf8');
    if (!raw.includes(marker)) throw new Error(`Refusing to overwrite unmarked provenance: ${sourcePath}`);
    try {
      prior = JSON.parse(raw);
    } catch {
      throw new Error(`Refusing to overwrite invalid generated provenance: ${sourcePath}`);
    }
    const { manifest_digest: manifestDigest, ...unsignedManifest } = prior;
    if (!/^[a-f0-9]{64}$/.test(manifestDigest ?? '') || digest(unsignedManifest) !== manifestDigest) {
      throw new Error(`Refusing to overwrite locally modified generated provenance: ${sourcePath}`);
    }
  } else {
    const existing = [];
    for (const path of paths.values()) if (await exists(path)) existing.push(path);
    if (existing.length > 0) {
      throw new Error(
        `Refusing to overwrite generated targets without their provenance: ${existing.join(', ')}`,
      );
    }
  }
  for (const [key, path] of paths) {
    if (!await exists(path)) continue;
    const raw = await readFile(path, 'utf8');
    if (!raw.includes(marker)) throw new Error(`Refusing to overwrite unmarked generated target: ${path}`);
    const expected = prior?.output_digests?.[key];
    if (expected && digest(raw) !== expected) throw new Error(`Refusing to overwrite locally modified generated target: ${path}`);
  }
  const removals = [];
  for (const [key, priorRelativePath] of Object.entries(prior?.output_paths ?? {})) {
    const priorPath = resolveOutput(outputRoot, priorRelativePath);
    if ([...paths.values()].includes(priorPath) || !await exists(priorPath)) continue;
    const raw = await readFile(priorPath, 'utf8');
    if (!raw.includes(marker)) {
      throw new Error(`Refusing to remove unmarked prior generated target: ${priorPath}`);
    }
    const expected = prior?.output_digests?.[key];
    if (expected && digest(raw) !== expected) {
      throw new Error(`Refusing to remove locally modified prior generated target: ${priorPath}`);
    }
    removals.push({ key, target: priorPath });
  }
  return removals;
}

export async function promoteProjectionTransaction({
  writes,
  removals = [],
  stage,
  validate,
  hooks = {},
}) {
  const records = [];
  const operations = [
    ...writes.map((write) => ({ ...write, kind: 'write' })),
    ...removals.map((removal) => ({ ...removal, kind: 'remove', temp: null })),
  ];
  const backupRoot = join(stage, 'backup');
  await mkdir(backupRoot, { recursive: true });
  try {
    for (let index = 0; index < operations.length; index += 1) {
      const operation = operations[index];
      await hooks.beforePromote?.({ index, key: operation.key, target: operation.target });
      await mkdir(dirname(operation.target), { recursive: true });
      const record = {
        ...operation,
        backup: join(backupRoot, String(index)),
        backedUp: false,
        placed: false,
      };
      records.push(record);
      if (await exists(operation.target)) {
        await rename(operation.target, record.backup);
        record.backedUp = true;
      }
      if (operation.kind === 'write') {
        await rename(operation.temp, operation.target);
        record.placed = true;
      }
    }
    await validate();
  } catch (error) {
    const rollbackErrors = [];
    for (const record of [...records].reverse()) {
      try {
        if (record.placed && await exists(record.target)) {
          await rm(record.target, { force: true });
        }
        if (record.backedUp && await exists(record.backup)) {
          await mkdir(dirname(record.target), { recursive: true });
          await rename(record.backup, record.target);
        }
      } catch (rollbackError) {
        rollbackErrors.push(`${record.target}: ${rollbackError.message}`);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new Error(
        `${error.message}; projection rollback failed: ${rollbackErrors.join('; ')}`,
        { cause: error },
      );
    }
    throw error;
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
  return resolveInside(root, path, 'output');
}

function validateConfig(config) {
  if (!isPlainObject(config)) throw new Error('Consumer config must be an object');
  rejectUnknownKeys(config, configKeys, 'consumer config');
  if (typeof config.package !== 'string' || !config.package) {
    throw new Error('Consumer config package is required');
  }
  if (!['conductor', 'ai-orchestration'].includes(config.profile)) {
    throw new Error(`Unsupported accessibility profile: ${config.profile}`);
  }
  for (const key of ['routes', ...(config.outputRoot === undefined ? [] : ['outputRoot'])]) {
    if (typeof config[key] !== 'string' || !config[key].trim()) {
      throw new Error(`Consumer config ${key} must be a non-empty relative path`);
    }
  }
}

function validateRoutes(routes) {
  if (!isPlainObject(routes)) throw new Error('Consumer routes must be an object');
  rejectUnknownKeys(routes, routeKeys, 'consumer routes');
  if (routes.version !== 1) throw new Error('Consumer routes version must be 1');
  if (!isPlainObject(routes.outputs)) throw new Error('Consumer routes outputs must be an object');
  for (const [key, value] of Object.entries(routes.outputs)) {
    if (typeof value !== 'string' || !value.trim()) {
      throw new Error(`Consumer route ${key} must be a non-empty relative path`);
    }
  }
}

function validateRouteKeys(routes, artifactKeys) {
  const allowed = new Set([...artifactKeys, 'patterns', 'semantics']);
  const unknown = Object.keys(routes.outputs).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`Unsupported consumer route keys: ${unknown.join(', ')}`);
}

function assertUniqueTargets(paths) {
  const owners = new Map();
  for (const [key, path] of paths) {
    const prior = owners.get(path);
    if (prior) throw new Error(`Consumer routes collide at ${path}: ${prior}, ${key}`);
    owners.set(path, key);
  }
}

function resolveInside(root, candidate, label, { allowRoot = false } = {}) {
  if (typeof candidate !== 'string' || !candidate.trim() || isAbsolute(candidate)) {
    throw new Error(`${label} must be a non-empty relative path`);
  }
  const target = resolve(root, candidate);
  const rel = relative(root, target);
  if ((!allowRoot && rel === '') || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new Error(`${label} escapes its allowed root: ${candidate}`);
  }
  return target;
}

async function assertNoSymlinkPath(root, target, label) {
  const rel = relative(root, target);
  if (rel === '') return;
  let cursor = root;
  for (const part of rel.split(sep)) {
    cursor = join(cursor, part);
    try {
      const stats = await lstat(cursor);
      if (stats.isSymbolicLink()) throw new Error(`${label} traverses a symbolic link: ${cursor}`);
    } catch (error) {
      if (error?.code === 'ENOENT') return;
      throw error;
    }
  }
}

function rejectUnknownKeys(value, allowed, label) {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) throw new Error(`${label} has unknown keys: ${unknown.join(', ')}`);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
