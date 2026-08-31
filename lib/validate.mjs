import { compileApplicability, referencedFacts, validateExpression } from './compile-applicability.mjs';

const SEMVER = /^\d+\.\d+\.\d+$/;
const RECORD_ID = /^[a-z][a-z0-9.-]+$/;
const FACT_ID = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/;
const RECORD_PREFIX = {
  foundation: 'foundation.',
  semantic: 'semantics.',
  pattern: 'pattern.',
  policy: 'policy.'
};

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateStringArray(label, value, errors, { required = true } = {}) {
  if (!Array.isArray(value) || (required && value.length === 0) || value.some((item) => !isNonEmptyString(item))) {
    errors.push(`${label} must be ${required ? 'a non-empty' : 'an'} array of non-empty strings`);
    return false;
  }
  if (new Set(value).size !== value.length) errors.push(`${label} must not contain duplicates`);
  return true;
}

function validateAuthorityRecord(record, expectedKind, errors) {
  const label = isRecord(record) && isNonEmptyString(record.id) ? record.id : `<malformed ${expectedKind}>`;
  if (!isRecord(record)) {
    errors.push(`Malformed ${expectedKind} record`);
    return;
  }
  if (!isNonEmptyString(record.id) || !RECORD_ID.test(record.id) || !record.id.startsWith(RECORD_PREFIX[expectedKind])) errors.push(`${label} has invalid ${expectedKind} ID`);
  if (!SEMVER.test(record.version ?? '')) errors.push(`${label} has invalid record version`);
  if (!isNonEmptyString(record.title)) errors.push(`${label} has no title`);
  if (record.kind !== expectedKind) errors.push(`${label} must declare kind ${expectedKind}`);
  if (expectedKind !== 'pattern' && !isNonEmptyString(record.requirement)) errors.push(`${label} has no requirement`);
}

function validateFacts(catalog, errors) {
  if (!isRecord(catalog) || catalog.version !== 1 || !isRecord(catalog.facts) || Object.keys(catalog.facts).length === 0) {
    errors.push('Malformed applicability fact catalog');
    return {};
  }
  for (const [id, definition] of Object.entries(catalog.facts)) {
    if (!FACT_ID.test(id)) errors.push(`Invalid applicability fact ID: ${id}`);
    if (!isRecord(definition) || !['boolean', 'string', 'array'].includes(definition.type)) {
      errors.push(`Fact ${id} has unsupported type ${definition?.type ?? '<missing>'}`);
      continue;
    }
    const extraKeys = Object.keys(definition).filter((key) => !['type', 'items', 'source', 'derived'].includes(key));
    if (extraKeys.length) errors.push(`Fact ${id} has unsupported fields: ${extraKeys.join(', ')}`);
    if (definition.type === 'array' && definition.items !== 'string') errors.push(`Fact ${id} must declare string array items`);
    if (definition.type !== 'array' && Object.hasOwn(definition, 'items')) errors.push(`Fact ${id} cannot declare array items`);
    if (Object.hasOwn(definition, 'source') && !isNonEmptyString(definition.source)) errors.push(`Fact ${id} has invalid source`);
    if (Object.hasOwn(definition, 'derived') && definition.derived !== true) errors.push(`Fact ${id} has invalid derived marker`);
    if (Object.hasOwn(definition, 'source') && Object.hasOwn(definition, 'derived')) errors.push(`Fact ${id} cannot be both sourced and derived`);
  }
  if (catalog.facts['component.ui_pattern_ids']?.source !== 'ui-design-brain') errors.push('component.ui_pattern_ids must be sourced from ui-design-brain');
  if (catalog.facts['component.accessibility_pattern_ids']?.derived !== true) errors.push('component.accessibility_pattern_ids must be derived');
  return catalog.facts;
}

export function validateStandards(data) {
  const errors = [];
  if (data.contract?.schema_version !== 2 || data.contract?.package_version !== '2.0.2') errors.push('Expected accessibility contract schema 2 targeting package 2.0.2');
  if (data.package?.version !== data.contract?.package_version) errors.push(`Installed package version ${data.package?.version ?? '<missing>'} does not match contract target ${data.contract?.package_version ?? '<missing>'}`);
  validateSources(data.sources, errors);
  validateProfiles(data.profiles, data.contract?.package_version, errors);
  validateProfileTemplates(data.profileTemplates, errors);
  const foundations = Array.isArray(data.foundations) ? data.foundations : [];
  const semantics = Array.isArray(data.semantics) ? data.semantics : [];
  const patterns = Array.isArray(data.patterns) ? data.patterns : [];
  const policies = Array.isArray(data.policies) ? data.policies : [];
  if (!Array.isArray(data.foundations) || !foundations.length) errors.push('Foundations must be a non-empty array');
  if (!Array.isArray(data.semantics) || !semantics.length) errors.push('Semantics must be a non-empty array');
  if (!Array.isArray(data.patterns) || !patterns.length) errors.push('Patterns must be a non-empty array');
  if (!Array.isArray(data.policies) || !policies.length) errors.push('Policies must be a non-empty array');
  const records = [...foundations, ...semantics, ...patterns, ...policies];
  const ids = new Set();
  for (const [kind, group] of [['foundation', foundations], ['semantic', semantics], ['pattern', patterns], ['policy', policies]]) {
    for (const record of group) {
      validateAuthorityRecord(record, kind, errors);
      if (!isRecord(record) || !isNonEmptyString(record.id)) continue;
      if (ids.has(record.id)) errors.push(`Duplicate authority: ${record.id}`);
      ids.add(record.id);
    }
  }
  const facts = validateFacts(data.facts, errors);
  const semanticIds = new Set(semantics.map(({ id }) => id));
  const patternIds = new Set(patterns.map(({ id }) => id));
  for (const semantic of semantics) validateStringArray(`${semantic.id ?? '<malformed semantic>'} proof`, semantic.proof, errors);
  for (const pattern of patterns) {
    const id = pattern.id ?? '<malformed pattern>';
    if (!validateStringArray(`${id} semantic dependencies`, pattern.requires, errors)) errors.push(`Orphan pattern: ${id}`);
    for (const dependency of Array.isArray(pattern.requires) ? pattern.requires : []) if (!semanticIds.has(dependency)) errors.push(`${id} has missing semantic dependency ${dependency}`);
    if (!isNonEmptyString(pattern.scope)) errors.push(`${id} has no scope`);
    validateStringArray(`${id} behavior`, pattern.behavior, errors);
    validateStringArray(`${id} product decisions`, pattern.product_decisions, errors);
    validateStringArray(`${id} Functional Spec bindings`, pattern.functional_spec_bindings, errors);
    validateStringArray(`${id} implementation outcomes`, pattern.implementation_outcomes, errors);
    validateStringArray(`${id} evidence routes`, pattern.evidence_routes, errors);
    try { validateExpression(pattern.activation, facts); } catch (error) { errors.push(`${id} activation: ${error.message}`); }
  }
  const proofKindObject = isRecord(data.evidence?.proof_kinds) ? data.evidence.proof_kinds : {};
  if (data.evidence?.version !== 1 || !Object.keys(proofKindObject).length || !isNonEmptyString(data.evidence?.rule)) errors.push('Malformed evidence routing contract');
  const expectedProofKinds = ['axe', 'e2e', 'human', 'unit'];
  if (JSON.stringify(Object.keys(proofKindObject).sort()) !== JSON.stringify(expectedProofKinds)) errors.push('Evidence routes must be exactly unit, axe, e2e, and human');
  const proofKinds = new Set(Object.keys(proofKindObject));
  for (const [kind, route] of Object.entries(proofKindObject)) {
    if (!isRecord(route) || !isNonEmptyString(route.purpose) || route.required_capability !== kind) errors.push(`Malformed evidence route ${kind}`);
  }
  for (const semantic of semantics) for (const route of Array.isArray(semantic.proof) ? semantic.proof : []) if (!proofKinds.has(route)) errors.push(`${semantic.id} uses unsupported proof route ${route}`);
  for (const pattern of patterns) for (const route of Array.isArray(pattern.evidence_routes) ? pattern.evidence_routes : []) if (!proofKinds.has(route)) errors.push(`${pattern.id} uses unsupported proof route ${route}`);
  const rows = Array.isArray(data.matrix?.rows) ? data.matrix.rows : [];
  if (data.matrix?.version !== 1 || !rows.length) errors.push('Malformed applicability matrix');
  const rowIds = new Set();
  for (const row of rows) {
    const id = row?.id ?? '<malformed applicability row>';
    if (!isRecord(row) || !/^applicability\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)) errors.push(`Invalid applicability row ID: ${id}`);
    if (rowIds.has(id)) errors.push(`Duplicate applicability row: ${id}`);
    rowIds.add(id);
    validateStringArray(`${id} outcomes`, row?.outcomes, errors);
    validateStringArray(`${id} evidence`, row?.evidence, errors);
    try { compileApplicability({ rows: [row] }, data.facts); } catch (error) { errors.push(`${id}: ${error.message}`); }
    for (const outcome of Array.isArray(row?.outcomes) ? row.outcomes : []) if (!ids.has(outcome)) errors.push(`${id} references unknown outcome ${outcome}`);
    for (const route of Array.isArray(row?.evidence) ? row.evidence : []) if (!proofKinds.has(route)) errors.push(`${id} uses unsupported proof route ${route}`);
  }
  const lanes = new Set([...semantics.flatMap((item) => Array.isArray(item.proof) ? item.proof : []), ...patterns.flatMap((item) => Array.isArray(item.evidence_routes) ? item.evidence_routes : []), ...rows.flatMap((item) => Array.isArray(item.evidence) ? item.evidence : [])]);
  for (const lane of proofKinds) if (!lanes.has(lane)) errors.push(`Dead evidence lane: ${lane}`);
  validateUiDesignBrainBindings(data.uiDesignBrainBindings, { facts }, semanticIds, patternIds, errors);
  if (rows.length !== 19) errors.push(`Expected 19 applicability rows, found ${rows.length}`);
  if (errors.length) throw new Error(errors.join('\n'));
  return { records: records.length, semantics: semantics.length, patterns: patterns.length, applicability: rows.length, uiPatternBindings: data.uiDesignBrainBindings.bindings.length };
}

function validateProfileTemplates(profileTemplates, errors) {
  const expected = {
    conductor: ['applicability/README.md', 'evidence/README.md', 'patterns/README.md', 'semantics/README.md'],
    'ai-orchestration': ['implementation/README.md', 'patterns/README.md', 'review/README.md', 'semantics/README.md', 'testing/README.md']
  };
  if (!isRecord(profileTemplates) || JSON.stringify(Object.keys(profileTemplates).sort()) !== JSON.stringify(Object.keys(expected).sort())) {
    errors.push('Profile templates must be exactly conductor and ai-orchestration');
    return;
  }
  for (const [profile, paths] of Object.entries(expected)) {
    const templates = profileTemplates[profile];
    if (!isRecord(templates) || JSON.stringify(Object.keys(templates).sort()) !== JSON.stringify(paths)) {
      errors.push(`Invalid profile template set: ${profile}`);
      continue;
    }
    for (const [path, content] of Object.entries(templates)) {
      if (!isNonEmptyString(content)) errors.push(`Empty profile template: ${profile}/${path}`);
    }
  }
}

function validateSources(sources, errors) {
  if (!isRecord(sources) || sources.version !== 1 || !Array.isArray(sources.authorities) || !sources.authorities.length) {
    errors.push('Malformed standards source hierarchy');
    return;
  }
  const authorityIds = new Set();
  for (const authority of sources.authorities) {
    if (!isRecord(authority) || !isNonEmptyString(authority.id) || !/^https:\/\//.test(authority.url ?? '') || typeof authority.normative !== 'boolean') {
      errors.push(`Malformed standards authority ${authority?.id ?? '<missing>'}`);
      continue;
    }
    if (authorityIds.has(authority.id)) errors.push(`Duplicate standards authority ${authority.id}`);
    authorityIds.add(authority.id);
  }
  if (!validateStringArray('Standards precedence', sources.precedence, errors)) return;
  for (const id of authorityIds) if (!sources.precedence.includes(id)) errors.push(`Standards precedence omits authority ${id}`);
}

function validateProfiles(profiles, packageVersion, errors) {
  const expected = {
    conductor: ['ui-pattern-bindings', 'semantics', 'patterns', 'applicability', 'evidence'],
    'ai-orchestration': ['ui-pattern-bindings', 'semantics', 'patterns', 'implementation', 'testing', 'review']
  };
  if (!isRecord(profiles) || JSON.stringify(Object.keys(profiles).sort()) !== JSON.stringify(Object.keys(expected).sort())) {
    errors.push('Profile contracts must be exactly conductor and ai-orchestration');
    return;
  }
  for (const [name, channels] of Object.entries(expected)) {
    const profile = profiles[name];
    if (!isRecord(profile) || profile.name !== name || profile.version !== packageVersion || JSON.stringify(profile.channels) !== JSON.stringify(channels)) {
      errors.push(`Invalid or incorrectly ordered profile contract: ${name}`);
    }
  }
}

function validateUiDesignBrainBindings(contract, facts, semanticIds, patternIds, errors) {
  if (contract?.version !== 1 || !contract.source || !Array.isArray(contract.bindings)) {
    errors.push('Malformed UI Design Brain binding contract');
    return;
  }
  if (contract.source.package !== '@verndale/ui-design-brain') errors.push('UI Design Brain binding source package is invalid');
  if (contract.source.repository !== 'https://github.com/verndale/ui-design-brain') errors.push('UI Design Brain binding repository is invalid');
  if (contract.source.tracking_issue !== 'https://github.com/verndale/ui-design-brain/issues/47') errors.push('UI Design Brain binding tracking issue is invalid');
  if (contract.source.package_version !== '1.16.1') errors.push('UI Design Brain projector package version is invalid');
  if (contract.source.catalog_authority_version !== '1.15.1') errors.push('UI Design Brain catalog authority version is invalid');
  if (!/^sha256:[a-f0-9]{64}$/.test(contract.source.source_digest ?? '')) errors.push('UI Design Brain source digest is invalid');
  if (!/^sha256:[a-f0-9]{64}$/.test(contract.source.manifest_digest ?? '')) errors.push('UI Design Brain manifest digest is invalid');
  if (contract.source.pattern_count !== contract.bindings.length) errors.push(`UI Design Brain binding count ${contract.bindings.length} does not match source count ${contract.source.pattern_count}`);

  const expectedOrder = contract.bindings.map(({ ui_pattern_id }) => ui_pattern_id).sort();
  const actualOrder = contract.bindings.map(({ ui_pattern_id }) => ui_pattern_id);
  if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) errors.push('UI Design Brain bindings must be sorted by canonical ui_pattern_id');
  const seen = new Set();
  for (const binding of contract.bindings) {
    const prefix = `UI Design Brain binding ${binding.ui_pattern_id ?? '<missing>'}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(binding.ui_pattern_id ?? '')) errors.push(`${prefix} has invalid canonical ID`);
    if (seen.has(binding.ui_pattern_id)) errors.push(`${prefix} is duplicated`);
    seen.add(binding.ui_pattern_id);
    if (!['direct', 'candidate', 'baseline-only'].includes(binding.classification)) errors.push(`${prefix} has invalid classification ${binding.classification}`);
    validateSortedUnique(`${prefix} pattern_ids`, binding.pattern_ids ?? [], errors);
    for (const patternId of binding.pattern_ids ?? []) if (!patternIds.has(patternId)) errors.push(`${prefix} references unknown pattern ${patternId}`);
    validateSortedUnique(`${prefix} baseline_semantic_ids`, binding.baseline_semantic_ids ?? [], errors);
    for (const semanticId of binding.baseline_semantic_ids ?? []) if (!semanticIds.has(semanticId)) errors.push(`${prefix} references unknown baseline semantic ${semanticId}`);

    if (binding.classification === 'direct') {
      if (!binding.pattern_ids?.length) errors.push(`${prefix} must declare at least one direct pattern`);
      if (binding.candidates || binding.discriminator_facts) errors.push(`${prefix} direct mapping cannot declare candidates`);
    } else if (binding.classification === 'baseline-only') {
      if (binding.pattern_ids || binding.candidates || binding.discriminator_facts) errors.push(`${prefix} baseline-only mapping cannot declare specialized patterns`);
      if (!binding.baseline_semantic_ids?.length) errors.push(`${prefix} baseline-only mapping must declare at least one baseline semantic`);
    } else if (binding.classification === 'candidate') {
      if (!binding.candidates?.length || !binding.discriminator_facts?.length) errors.push(`${prefix} candidate mapping requires candidates and discriminator facts`);
      validateSortedUnique(`${prefix} discriminator_facts`, binding.discriminator_facts ?? [], errors);
      for (const fact of binding.discriminator_facts ?? []) if (!facts.facts[fact]) errors.push(`${prefix} references unknown discriminator fact ${fact}`);
      const candidatePatternIds = [];
      const usedFacts = new Set();
      for (const candidate of binding.candidates ?? []) {
        candidatePatternIds.push(candidate.pattern_id);
        if (!patternIds.has(candidate.pattern_id)) errors.push(`${prefix} references unknown candidate pattern ${candidate.pattern_id}`);
        try {
          validateExpression(candidate.when, facts.facts);
          for (const fact of referencedFacts(candidate.when)) usedFacts.add(fact);
        } catch (error) {
          errors.push(`${prefix} ${candidate.pattern_id}: ${error.message}`);
        }
      }
      validateSortedUnique(`${prefix} candidate pattern IDs`, candidatePatternIds, errors);
      const declaredFacts = [...(binding.discriminator_facts ?? [])].sort();
      const referenced = [...usedFacts].sort();
      if (JSON.stringify(declaredFacts) !== JSON.stringify(referenced)) errors.push(`${prefix} discriminator facts do not exactly match candidate expressions`);
    }
  }
}

function validateSortedUnique(label, values, errors) {
  if (!Array.isArray(values) || values.some((value) => !isNonEmptyString(value))) {
    errors.push(`${label} must be an array of non-empty strings`);
    return;
  }
  const sorted = [...new Set(values)].sort();
  if (JSON.stringify(values) !== JSON.stringify(sorted)) errors.push(`${label} must be sorted and unique`);
}
