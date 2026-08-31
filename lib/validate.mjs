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
const WCAG_2_2_CRITERIA = [
  ['1.1.1', 'Non-text Content', 'A', 'non-text-content'],
  ['1.2.1', 'Audio-only and Video-only (Prerecorded)', 'A', 'audio-only-and-video-only-prerecorded'],
  ['1.2.2', 'Captions (Prerecorded)', 'A', 'captions-prerecorded'],
  ['1.2.3', 'Audio Description or Media Alternative (Prerecorded)', 'A', 'audio-description-or-media-alternative-prerecorded'],
  ['1.2.4', 'Captions (Live)', 'AA', 'captions-live'],
  ['1.2.5', 'Audio Description (Prerecorded)', 'AA', 'audio-description-prerecorded'],
  ['1.2.6', 'Sign Language (Prerecorded)', 'AAA', 'sign-language-prerecorded'],
  ['1.2.7', 'Extended Audio Description (Prerecorded)', 'AAA', 'extended-audio-description-prerecorded'],
  ['1.2.8', 'Media Alternative (Prerecorded)', 'AAA', 'media-alternative-prerecorded'],
  ['1.2.9', 'Audio-only (Live)', 'AAA', 'audio-only-live'],
  ['1.3.1', 'Info and Relationships', 'A', 'info-and-relationships'],
  ['1.3.2', 'Meaningful Sequence', 'A', 'meaningful-sequence'],
  ['1.3.3', 'Sensory Characteristics', 'A', 'sensory-characteristics'],
  ['1.3.4', 'Orientation', 'AA', 'orientation'],
  ['1.3.5', 'Identify Input Purpose', 'AA', 'identify-input-purpose'],
  ['1.3.6', 'Identify Purpose', 'AAA', 'identify-purpose'],
  ['1.4.1', 'Use of Color', 'A', 'use-of-color'],
  ['1.4.2', 'Audio Control', 'A', 'audio-control'],
  ['1.4.3', 'Contrast (Minimum)', 'AA', 'contrast-minimum'],
  ['1.4.4', 'Resize Text', 'AA', 'resize-text'],
  ['1.4.5', 'Images of Text', 'AA', 'images-of-text'],
  ['1.4.6', 'Contrast (Enhanced)', 'AAA', 'contrast-enhanced'],
  ['1.4.7', 'Low or No Background Audio', 'AAA', 'low-or-no-background-audio'],
  ['1.4.8', 'Visual Presentation', 'AAA', 'visual-presentation'],
  ['1.4.9', 'Images of Text (No Exception)', 'AAA', 'images-of-text-no-exception'],
  ['1.4.10', 'Reflow', 'AA', 'reflow'],
  ['1.4.11', 'Non-text Contrast', 'AA', 'non-text-contrast'],
  ['1.4.12', 'Text Spacing', 'AA', 'text-spacing'],
  ['1.4.13', 'Content on Hover or Focus', 'AA', 'content-on-hover-or-focus'],
  ['2.1.1', 'Keyboard', 'A', 'keyboard'],
  ['2.1.2', 'No Keyboard Trap', 'A', 'no-keyboard-trap'],
  ['2.1.3', 'Keyboard (No Exception)', 'AAA', 'keyboard-no-exception'],
  ['2.1.4', 'Character Key Shortcuts', 'A', 'character-key-shortcuts'],
  ['2.2.1', 'Timing Adjustable', 'A', 'timing-adjustable'],
  ['2.2.2', 'Pause, Stop, Hide', 'A', 'pause-stop-hide'],
  ['2.2.3', 'No Timing', 'AAA', 'no-timing'],
  ['2.2.4', 'Interruptions', 'AAA', 'interruptions'],
  ['2.2.5', 'Re-authenticating', 'AAA', 're-authenticating'],
  ['2.2.6', 'Timeouts', 'AAA', 'timeouts'],
  ['2.3.1', 'Three Flashes or Below Threshold', 'A', 'three-flashes-or-below-threshold'],
  ['2.3.2', 'Three Flashes', 'AAA', 'three-flashes'],
  ['2.3.3', 'Animation from Interactions', 'AAA', 'animation-from-interactions'],
  ['2.4.1', 'Bypass Blocks', 'A', 'bypass-blocks'],
  ['2.4.2', 'Page Titled', 'A', 'page-titled'],
  ['2.4.3', 'Focus Order', 'A', 'focus-order'],
  ['2.4.4', 'Link Purpose (In Context)', 'A', 'link-purpose-in-context'],
  ['2.4.5', 'Multiple Ways', 'AA', 'multiple-ways'],
  ['2.4.6', 'Headings and Labels', 'AA', 'headings-and-labels'],
  ['2.4.7', 'Focus Visible', 'AA', 'focus-visible'],
  ['2.4.8', 'Location', 'AAA', 'location'],
  ['2.4.9', 'Link Purpose (Link Only)', 'AAA', 'link-purpose-link-only'],
  ['2.4.10', 'Section Headings', 'AAA', 'section-headings'],
  ['2.4.11', 'Focus Not Obscured (Minimum)', 'AA', 'focus-not-obscured-minimum'],
  ['2.4.12', 'Focus Not Obscured (Enhanced)', 'AAA', 'focus-not-obscured-enhanced'],
  ['2.4.13', 'Focus Appearance', 'AAA', 'focus-appearance'],
  ['2.5.1', 'Pointer Gestures', 'A', 'pointer-gestures'],
  ['2.5.2', 'Pointer Cancellation', 'A', 'pointer-cancellation'],
  ['2.5.3', 'Label in Name', 'A', 'label-in-name'],
  ['2.5.4', 'Motion Actuation', 'A', 'motion-actuation'],
  ['2.5.5', 'Target Size (Enhanced)', 'AAA', 'target-size-enhanced'],
  ['2.5.6', 'Concurrent Input Mechanisms', 'AAA', 'concurrent-input-mechanisms'],
  ['2.5.7', 'Dragging Movements', 'AA', 'dragging-movements'],
  ['2.5.8', 'Target Size (Minimum)', 'AA', 'target-size-minimum'],
  ['3.1.1', 'Language of Page', 'A', 'language-of-page'],
  ['3.1.2', 'Language of Parts', 'AA', 'language-of-parts'],
  ['3.1.3', 'Unusual Words', 'AAA', 'unusual-words'],
  ['3.1.4', 'Abbreviations', 'AAA', 'abbreviations'],
  ['3.1.5', 'Reading Level', 'AAA', 'reading-level'],
  ['3.1.6', 'Pronunciation', 'AAA', 'pronunciation'],
  ['3.2.1', 'On Focus', 'A', 'on-focus'],
  ['3.2.2', 'On Input', 'A', 'on-input'],
  ['3.2.3', 'Consistent Navigation', 'AA', 'consistent-navigation'],
  ['3.2.4', 'Consistent Identification', 'AA', 'consistent-identification'],
  ['3.2.5', 'Change on Request', 'AAA', 'change-on-request'],
  ['3.2.6', 'Consistent Help', 'A', 'consistent-help'],
  ['3.3.1', 'Error Identification', 'A', 'error-identification'],
  ['3.3.2', 'Labels or Instructions', 'A', 'labels-or-instructions'],
  ['3.3.3', 'Error Suggestion', 'AA', 'error-suggestion'],
  ['3.3.4', 'Error Prevention (Legal, Financial, Data)', 'AA', 'error-prevention-legal-financial-data'],
  ['3.3.5', 'Help', 'AAA', 'help'],
  ['3.3.6', 'Error Prevention (All)', 'AAA', 'error-prevention-all'],
  ['3.3.7', 'Redundant Entry', 'A', 'redundant-entry'],
  ['3.3.8', 'Accessible Authentication (Minimum)', 'AA', 'accessible-authentication-minimum'],
  ['3.3.9', 'Accessible Authentication (Enhanced)', 'AAA', 'accessible-authentication-enhanced'],
  ['4.1.2', 'Name, Role, Value', 'A', 'name-role-value'],
  ['4.1.3', 'Status Messages', 'AA', 'status-messages']
];
const WCAG_2_2_BY_ID = new Map(WCAG_2_2_CRITERIA.map(([id, title, level, slug]) => [id, { title, level, slug }]));
const WCAG_2_2_AA_CRITERIA = WCAG_2_2_CRITERIA.filter(([, , level]) => level !== 'AAA');
const WCAG_2_2_AA_BY_ID = new Map(WCAG_2_2_AA_CRITERIA.map(([id, title, level, slug]) => [id, { title, level, slug }]));
const REQUIRED_DEFERRED_PATTERN_IDS = ['grid', 'treegrid'];
const KNOWN_AUTHORITIES = new Map([
  ['wcag-2.2', { url: 'https://www.w3.org/TR/WCAG22/', normative: true }],
  ['wcag-2.2-understanding', { url: 'https://www.w3.org/WAI/WCAG22/Understanding/', normative: false }],
  ['wai-aria-1.2', { url: 'https://www.w3.org/TR/wai-aria-1.2/', normative: true }],
  ['aria-apg', { url: 'https://www.w3.org/WAI/ARIA/apg/', normative: false }]
]);

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

function validateAllowedKeys(label, value, allowed, errors) {
  if (!isRecord(value)) return;
  const extras = Object.keys(value).filter((key) => !allowed.includes(key));
  if (extras.length) errors.push(`${label} has unsupported fields: ${extras.join(', ')}`);
}

function validateStandardsReferences(record, authorities, errors) {
  const label = record?.id ?? '<malformed record>';
  const refs = record?.standards_refs;
  if (!Array.isArray(refs) || refs.length === 0) {
    errors.push(`${label} standards_refs must be a non-empty array`);
    return;
  }
  const identities = [];
  const seen = new Set();
  for (const ref of refs) {
    if (!isRecord(ref)) {
      errors.push(`${label} has a malformed standards reference`);
      continue;
    }
    const allowedKeys = ['authority', 'identifier', 'level', 'normative', 'url'];
    const extraKeys = Object.keys(ref).filter((key) => !allowedKeys.includes(key));
    if (extraKeys.length) errors.push(`${label} standards reference has unsupported fields: ${extraKeys.join(', ')}`);
    if (!isNonEmptyString(ref.authority) || !isNonEmptyString(ref.identifier) || !/^https:\/\//.test(ref.url ?? '') || typeof ref.normative !== 'boolean') {
      errors.push(`${label} has a malformed standards reference`);
      continue;
    }
    if (ref.level !== undefined && !['A', 'AA', 'AAA'].includes(ref.level)) errors.push(`${label} standards reference ${ref.authority} ${ref.identifier} has invalid level ${ref.level}`);
    const identity = `${ref.authority}\u0000${ref.identifier}\u0000${ref.url}`;
    const referenceKey = `${ref.authority}\u0000${ref.identifier}`;
    identities.push(identity);
    if (seen.has(referenceKey)) errors.push(`${label} has duplicate standards reference ${ref.authority} ${ref.identifier}`);
    seen.add(referenceKey);
    const authority = authorities.get(ref.authority);
    if (!authority) {
      errors.push(`${label} references unknown standards authority ${ref.authority}`);
      continue;
    }
    if (ref.normative !== authority.normative) errors.push(`${label} standards reference ${ref.authority} ${ref.identifier} has normative=${ref.normative}; expected ${authority.normative}`);
    if (!ref.url.startsWith(authority.url)) errors.push(`${label} standards reference ${ref.authority} ${ref.identifier} URL is outside authority ${authority.url}`);
    if (ref.authority === 'wcag-2.2' || ref.authority === 'wcag-2.2-understanding') {
      const criterion = WCAG_2_2_BY_ID.get(ref.identifier);
      if (!criterion) {
        errors.push(`${label} standards reference ${ref.identifier} is not a WCAG 2.2 success criterion`);
        continue;
      }
      if (ref.level === undefined) errors.push(`${label} standards reference ${ref.identifier} must declare a WCAG level`);
      if (ref.level !== undefined && ref.level !== criterion.level) errors.push(`${label} standards reference ${ref.identifier} declares Level ${ref.level}; expected ${criterion.level}`);
      const expectedUrl = ref.authority === 'wcag-2.2'
        ? `https://www.w3.org/TR/WCAG22/#${criterion.slug}`
        : `https://www.w3.org/WAI/WCAG22/Understanding/${criterion.slug}.html`;
      if (ref.url !== expectedUrl) errors.push(`${label} standards reference ${ref.authority} ${ref.identifier} URL must be ${expectedUrl}`);
    } else if (ref.level !== undefined) {
      errors.push(`${label} standards reference ${ref.authority} ${ref.identifier} must not declare a WCAG level`);
    }
  }
  const sorted = [...identities].sort();
  if (JSON.stringify(identities) !== JSON.stringify(sorted)) errors.push(`${label} standards_refs must be sorted by authority, identifier, and URL`);
}

function validateSemanticReferencePairs(record, errors) {
  if (!isRecord(record) || !Array.isArray(record.standards_refs)) return;
  const normative = new Set(record.standards_refs.filter((ref) => ref?.authority === 'wcag-2.2').map((ref) => ref.identifier));
  const understanding = new Set(record.standards_refs.filter((ref) => ref?.authority === 'wcag-2.2-understanding').map((ref) => ref.identifier));
  for (const identifier of normative) {
    if (!understanding.has(identifier)) errors.push(`${record.id} WCAG ${identifier} reference must include its Understanding document`);
  }
  for (const identifier of understanding) {
    if (!normative.has(identifier)) errors.push(`${record.id} Understanding ${identifier} reference must include its normative WCAG criterion`);
  }
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
  if (data.contract?.schema_version !== 3 || data.contract?.package_version !== '3.1.0') errors.push('Expected accessibility contract schema 3 targeting package 3.1.0');
  if (data.package?.version !== data.contract?.package_version) errors.push(`Installed package version ${data.package?.version ?? '<missing>'} does not match contract target ${data.contract?.package_version ?? '<missing>'}`);
  const authorities = validateSources(data.sources, errors);
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
  const semanticIds = new Set(semantics.filter(isRecord).map((record) => record.id).filter(isNonEmptyString));
  const patternIds = new Set(patterns.filter(isRecord).map((record) => record.id).filter(isNonEmptyString));
  const usedFactIds = new Set();
  for (const semantic of semantics) {
    const id = semantic?.id ?? '<malformed semantic>';
    validateAllowedKeys(id, semantic, ['id', 'kind', 'proof', 'requirement', 'standards_refs', 'title', 'version'], errors);
    validateStringArray(`${id} proof`, semantic?.proof, errors);
    validateStandardsReferences(semantic, authorities, errors);
    validateSemanticReferencePairs(semantic, errors);
  }
  for (const pattern of patterns) {
    const id = pattern?.id ?? '<malformed pattern>';
    validateAllowedKeys(id, pattern, ['activation', 'behavior', 'evidence_routes', 'functional_spec_bindings', 'id', 'implementation_outcomes', 'kind', 'product_decisions', 'requires', 'scope', 'standards_refs', 'title', 'version'], errors);
    validateStandardsReferences(pattern, authorities, errors);
    if (!validateStringArray(`${id} semantic dependencies`, pattern?.requires, errors)) errors.push(`Orphan pattern: ${id}`);
    for (const dependency of Array.isArray(pattern?.requires) ? pattern.requires : []) if (!semanticIds.has(dependency)) errors.push(`${id} has missing semantic dependency ${dependency}`);
    if (!isNonEmptyString(pattern?.scope)) errors.push(`${id} has no scope`);
    validateStringArray(`${id} behavior`, pattern?.behavior, errors);
    validateStringArray(`${id} product decisions`, pattern?.product_decisions, errors);
    validateStringArray(`${id} Functional Spec bindings`, pattern?.functional_spec_bindings, errors);
    validateStringArray(`${id} implementation outcomes`, pattern?.implementation_outcomes, errors);
    validateStringArray(`${id} evidence routes`, pattern?.evidence_routes, errors);
    try {
      validateExpression(pattern?.activation, facts);
      for (const fact of referencedFacts(pattern.activation)) usedFactIds.add(fact);
    } catch (error) { errors.push(`${id} activation: ${error.message}`); }
  }
  const proofKindObject = isRecord(data.evidence?.proof_kinds) ? data.evidence.proof_kinds : {};
  if (data.evidence?.version !== 1 || !Object.keys(proofKindObject).length || !isNonEmptyString(data.evidence?.rule)) errors.push('Malformed evidence routing contract');
  const expectedProofKinds = ['axe', 'e2e', 'human', 'unit'];
  if (JSON.stringify(Object.keys(proofKindObject).sort()) !== JSON.stringify(expectedProofKinds)) errors.push('Evidence routes must be exactly unit, axe, e2e, and human');
  const proofKinds = new Set(Object.keys(proofKindObject));
  for (const [kind, route] of Object.entries(proofKindObject)) {
    if (!isRecord(route) || !isNonEmptyString(route.purpose) || route.required_capability !== kind) errors.push(`Malformed evidence route ${kind}`);
  }
  for (const semantic of semantics) for (const route of Array.isArray(semantic?.proof) ? semantic.proof : []) if (!proofKinds.has(route)) errors.push(`${semantic?.id ?? '<malformed semantic>'} uses unsupported proof route ${route}`);
  for (const pattern of patterns) for (const route of Array.isArray(pattern?.evidence_routes) ? pattern.evidence_routes : []) if (!proofKinds.has(route)) errors.push(`${pattern?.id ?? '<malformed pattern>'} uses unsupported proof route ${route}`);
  const rows = Array.isArray(data.matrix?.rows) ? data.matrix.rows : [];
  if (data.matrix?.version !== 1 || !rows.length) errors.push('Malformed applicability matrix');
  const rowIds = new Set();
  const matrixOutcomeIds = new Set();
  for (const row of rows) {
    const id = row?.id ?? '<malformed applicability row>';
    if (!isRecord(row) || !/^applicability\.[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(id)) errors.push(`Invalid applicability row ID: ${id}`);
    if (rowIds.has(id)) errors.push(`Duplicate applicability row: ${id}`);
    rowIds.add(id);
    validateStringArray(`${id} outcomes`, row?.outcomes, errors);
    validateStringArray(`${id} evidence`, row?.evidence, errors);
    try {
      compileApplicability({ rows: [row] }, data.facts);
      for (const fact of referencedFacts(row.when)) usedFactIds.add(fact);
    } catch (error) { errors.push(`${id}: ${error.message}`); }
    for (const outcome of Array.isArray(row?.outcomes) ? row.outcomes : []) {
      matrixOutcomeIds.add(outcome);
      if (!ids.has(outcome)) errors.push(`${id} references unknown outcome ${outcome}`);
    }
    for (const route of Array.isArray(row?.evidence) ? row.evidence : []) if (!proofKinds.has(route)) errors.push(`${id} uses unsupported proof route ${route}`);
  }
  const lanes = new Set([...semantics.flatMap((item) => Array.isArray(item?.proof) ? item.proof : []), ...patterns.flatMap((item) => Array.isArray(item?.evidence_routes) ? item.evidence_routes : []), ...rows.flatMap((item) => Array.isArray(item?.evidence) ? item.evidence : [])]);
  for (const lane of proofKinds) if (!lanes.has(lane)) errors.push(`Dead evidence lane: ${lane}`);
  const bindingReachability = validateUiDesignBrainBindings(data.uiDesignBrainBindings, { facts }, semanticIds, patternIds, errors);
  for (const fact of bindingReachability.factIds) usedFactIds.add(fact);
  const reachablePatternIds = new Set([...bindingReachability.patternIds, ...[...matrixOutcomeIds].filter((id) => id.startsWith('pattern.'))]);
  for (const patternId of patternIds) if (!reachablePatternIds.has(patternId)) errors.push(`Unreachable pattern: ${patternId} is not selected by a UI binding or applicability row`);
  const reachableSemanticIds = new Set([
    ...patterns.flatMap((pattern) => Array.isArray(pattern?.requires) ? pattern.requires : []),
    ...bindingReachability.semanticIds,
    ...[...matrixOutcomeIds].filter((id) => id.startsWith('semantics.'))
  ]);
  for (const semanticId of semanticIds) if (!reachableSemanticIds.has(semanticId)) errors.push(`Unreachable semantic: ${semanticId} is not required by a pattern, UI baseline, or applicability row`);
  for (const factId of Object.keys(facts)) if (!usedFactIds.has(factId)) errors.push(`Unused applicability fact: ${factId}`);
  const wcagCriteria = validateWcagCoverage(data.wcagCoverage, authorities, semantics, semanticIds, patternIds, errors);
  if (errors.length) throw new Error(errors.join('\n'));
  return { records: records.length, semantics: semantics.length, patterns: patterns.length, applicability: rows.length, uiPatternBindings: data.uiDesignBrainBindings.bindings.length, wcagCriteria };
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
  const authorities = new Map();
  if (!isRecord(sources) || sources.version !== 1 || !Array.isArray(sources.authorities) || !sources.authorities.length) {
    errors.push('Malformed standards source hierarchy');
    return authorities;
  }
  const authorityIds = new Set();
  for (const authority of sources.authorities) {
    if (!isRecord(authority) || !isNonEmptyString(authority.id) || !/^https:\/\//.test(authority.url ?? '') || typeof authority.normative !== 'boolean') {
      errors.push(`Malformed standards authority ${authority?.id ?? '<missing>'}`);
      continue;
    }
    if (authorityIds.has(authority.id)) errors.push(`Duplicate standards authority ${authority.id}`);
    authorityIds.add(authority.id);
    authorities.set(authority.id, authority);
    const expected = KNOWN_AUTHORITIES.get(authority.id);
    if (!expected) {
      errors.push(`Unsupported standards authority ${authority.id}`);
    } else if (authority.url !== expected.url || authority.normative !== expected.normative) {
      errors.push(`Standards authority ${authority.id} must use ${expected.url} with normative=${expected.normative}`);
    }
  }
  for (const id of KNOWN_AUTHORITIES.keys()) if (!authorityIds.has(id)) errors.push(`Standards source hierarchy omits required authority ${id}`);
  if (!validateStringArray('Standards precedence', sources.precedence, errors)) return authorities;
  for (const id of authorityIds) if (!sources.precedence.includes(id)) errors.push(`Standards precedence omits authority ${id}`);
  return authorities;
}

function validateWcagCoverage(coverage, authorities, semantics, semanticIds, patternIds, errors) {
  if (!isRecord(coverage) || coverage.version !== 1 || coverage.authority !== 'wcag-2.2' || !Array.isArray(coverage.deferred_patterns) || !Array.isArray(coverage.criteria)) {
    errors.push('Malformed WCAG 2.2 coverage inventory');
    return 0;
  }
  const extraRootKeys = Object.keys(coverage).filter((key) => !['authority', 'criteria', 'deferred_patterns', 'version'].includes(key));
  if (extraRootKeys.length) errors.push(`WCAG 2.2 coverage inventory has unsupported fields: ${extraRootKeys.join(', ')}`);
  const authority = authorities.get(coverage.authority);
  if (!authority || authority.normative !== true) errors.push('WCAG 2.2 coverage inventory must reference the normative wcag-2.2 authority');
  const deferredIds = new Set();
  for (const [index, item] of coverage.deferred_patterns.entries()) {
    if (!isRecord(item)) {
      errors.push(`Malformed deferred APG pattern at index ${index}`);
      continue;
    }
    const extraKeys = Object.keys(item).filter((key) => !['id', 'reason'].includes(key));
    if (extraKeys.length) errors.push(`Deferred APG pattern ${item.id ?? '<missing>'} has unsupported fields: ${extraKeys.join(', ')}`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id ?? '')) errors.push(`Deferred APG pattern ${item.id ?? '<missing>'} has an invalid ID`);
    if (deferredIds.has(item.id)) errors.push(`Duplicate deferred APG pattern ${item.id}`);
    deferredIds.add(item.id);
    if (!isNonEmptyString(item.reason)) errors.push(`Deferred APG pattern ${item.id ?? '<missing>'} must have a non-empty reason`);
  }
  const deferredOrder = coverage.deferred_patterns.map((item) => item?.id);
  if (JSON.stringify(deferredOrder) !== JSON.stringify([...deferredOrder].sort())) errors.push('Deferred APG patterns must be sorted by ID');
  for (const id of REQUIRED_DEFERRED_PATTERN_IDS) if (!deferredIds.has(id)) errors.push(`WCAG 2.2 coverage inventory must retain deferred APG pattern ${id}`);
  for (const id of deferredIds) {
    const patternId = `pattern.${id}`;
    if (patternIds.has(patternId)) errors.push(`Deferred APG pattern ${id} conflicts with implemented pattern ${patternId}`);
  }
  if (coverage.criteria.length !== WCAG_2_2_AA_CRITERIA.length) errors.push(`WCAG 2.2 coverage inventory must contain exactly ${WCAG_2_2_AA_CRITERIA.length} Level A/AA criteria`);
  const seen = new Set();
  const byId = new Map();
  const semanticsById = new Map(semantics.filter(isRecord).map((semantic) => [semantic.id, semantic]));
  for (const [index, criterion] of coverage.criteria.entries()) {
    const expected = WCAG_2_2_AA_CRITERIA[index];
    const label = isRecord(criterion) && isNonEmptyString(criterion.id) ? criterion.id : `<criterion ${index + 1}>`;
    if (!isRecord(criterion)) {
      errors.push(`Malformed WCAG 2.2 coverage criterion at index ${index}`);
      continue;
    }
    const extraKeys = Object.keys(criterion).filter((key) => !['id', 'level', 'note', 'semantic_ids', 'status', 'title'].includes(key));
    if (extraKeys.length) errors.push(`${label} coverage has unsupported fields: ${extraKeys.join(', ')}`);
    if (seen.has(criterion.id)) errors.push(`Duplicate WCAG 2.2 coverage criterion ${criterion.id}`);
    seen.add(criterion.id);
    byId.set(criterion.id, criterion);
    if (!expected || criterion.id !== expected[0]) errors.push(`${label} is out of canonical WCAG 2.2 A/AA order; expected ${expected?.[0] ?? '<none>'}`);
    if (expected && criterion.title !== expected[1]) errors.push(`${label} title must be ${expected[1]}`);
    if (expected && criterion.level !== expected[2]) errors.push(`${label} must declare Level ${expected[2]}`);
    if (!['covered', 'partial', 'gap'].includes(criterion.status)) errors.push(`${label} has invalid coverage status ${criterion.status ?? '<missing>'}`);
    validateSortedUnique(`${label} semantic_ids`, criterion.semantic_ids, errors);
    const mappedIds = Array.isArray(criterion.semantic_ids) ? criterion.semantic_ids : [];
    if (criterion.status === 'gap' && mappedIds.length) errors.push(`${label} gap coverage must not map semantic IDs`);
    if (criterion.status !== 'gap' && mappedIds.length === 0) errors.push(`${label} ${criterion.status ?? '<missing>'} coverage must map at least one semantic ID`);
    if (criterion.note !== undefined && !isNonEmptyString(criterion.note)) errors.push(`${label} coverage note must be a non-empty string`);
    if (['partial', 'gap'].includes(criterion.status) && !isNonEmptyString(criterion.note)) errors.push(`${label} ${criterion.status} coverage must explain the shortfall`);
    for (const semanticId of mappedIds) {
      if (!semanticIds.has(semanticId)) {
        errors.push(`${label} coverage references unknown semantic ${semanticId}`);
        continue;
      }
      const semantic = semanticsById.get(semanticId);
      const hasTrace = semantic?.standards_refs?.some((ref) => ref.authority === 'wcag-2.2' && ref.identifier === criterion.id);
      if (!hasTrace) errors.push(`${label} coverage maps ${semanticId} without a matching normative WCAG standards reference`);
    }
  }
  for (const [id] of WCAG_2_2_AA_CRITERIA) if (!seen.has(id)) errors.push(`WCAG 2.2 coverage inventory omits ${id}`);
  for (const semantic of semantics) {
    if (!isRecord(semantic)) continue;
    for (const ref of Array.isArray(semantic.standards_refs) ? semantic.standards_refs : []) {
      if (ref.authority !== 'wcag-2.2' || !WCAG_2_2_AA_BY_ID.has(ref.identifier)) continue;
      const criterion = byId.get(ref.identifier);
      if (!Array.isArray(criterion?.semantic_ids) || !criterion.semantic_ids.includes(semantic.id)) errors.push(`${semantic.id} references WCAG ${ref.identifier} but is absent from its coverage mapping`);
    }
  }
  return coverage.criteria.length;
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
  const reachability = { patternIds: new Set(), semanticIds: new Set(), factIds: new Set(['component.ui_pattern_ids']) };
  if (contract?.version !== 1 || !contract.source || !Array.isArray(contract.bindings)) {
    errors.push('Malformed UI Design Brain binding contract');
    return reachability;
  }
  if (contract.source.package !== '@verndale/ui-design-brain') errors.push('UI Design Brain binding source package is invalid');
  if (contract.source.repository !== 'https://github.com/verndale/ui-design-brain') errors.push('UI Design Brain binding repository is invalid');
  if (contract.source.tracking_issue !== 'https://github.com/verndale/ui-design-brain/issues/47') errors.push('UI Design Brain binding tracking issue is invalid');
  if (contract.source.package_version !== '1.16.0') errors.push('UI Design Brain projector package version is invalid');
  if (contract.source.catalog_authority_version !== '1.15.1') errors.push('UI Design Brain catalog authority version is invalid');
  if (!/^sha256:[a-f0-9]{64}$/.test(contract.source.source_digest ?? '')) errors.push('UI Design Brain source digest is invalid');
  if (!/^sha256:[a-f0-9]{64}$/.test(contract.source.manifest_digest ?? '')) errors.push('UI Design Brain manifest digest is invalid');
  if (contract.source.pattern_count !== contract.bindings.length) errors.push(`UI Design Brain binding count ${contract.bindings.length} does not match source count ${contract.source.pattern_count}`);

  const actualOrder = contract.bindings.map((binding) => isRecord(binding) ? binding.ui_pattern_id : undefined);
  const expectedOrder = [...actualOrder].sort();
  if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) errors.push('UI Design Brain bindings must be sorted by canonical ui_pattern_id');
  const seen = new Set();
  for (const binding of contract.bindings) {
    if (!isRecord(binding)) {
      errors.push('Malformed UI Design Brain binding');
      continue;
    }
    const prefix = `UI Design Brain binding ${binding.ui_pattern_id ?? '<missing>'}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(binding.ui_pattern_id ?? '')) errors.push(`${prefix} has invalid canonical ID`);
    if (seen.has(binding.ui_pattern_id)) errors.push(`${prefix} is duplicated`);
    seen.add(binding.ui_pattern_id);
    if (!['direct', 'candidate', 'baseline-only'].includes(binding.classification)) errors.push(`${prefix} has invalid classification ${binding.classification}`);
    validateSortedUnique(`${prefix} pattern_ids`, binding.pattern_ids ?? [], errors);
    for (const patternId of Array.isArray(binding.pattern_ids) ? binding.pattern_ids : []) {
      reachability.patternIds.add(patternId);
      if (!patternIds.has(patternId)) errors.push(`${prefix} references unknown pattern ${patternId}`);
    }
    validateSortedUnique(`${prefix} baseline_semantic_ids`, binding.baseline_semantic_ids ?? [], errors);
    for (const semanticId of Array.isArray(binding.baseline_semantic_ids) ? binding.baseline_semantic_ids : []) {
      reachability.semanticIds.add(semanticId);
      if (!semanticIds.has(semanticId)) errors.push(`${prefix} references unknown baseline semantic ${semanticId}`);
    }

    if (binding.classification === 'direct') {
      if (!binding.pattern_ids?.length) errors.push(`${prefix} must declare at least one direct pattern`);
      if (binding.candidates || binding.discriminator_facts) errors.push(`${prefix} direct mapping cannot declare candidates`);
    } else if (binding.classification === 'baseline-only') {
      if (binding.pattern_ids || binding.candidates || binding.discriminator_facts) errors.push(`${prefix} baseline-only mapping cannot declare specialized patterns`);
      if (!binding.baseline_semantic_ids?.length) errors.push(`${prefix} baseline-only mapping must declare at least one baseline semantic`);
    } else if (binding.classification === 'candidate') {
      if (!binding.candidates?.length || !binding.discriminator_facts?.length) errors.push(`${prefix} candidate mapping requires candidates and discriminator facts`);
      validateSortedUnique(`${prefix} discriminator_facts`, binding.discriminator_facts ?? [], errors);
      for (const fact of Array.isArray(binding.discriminator_facts) ? binding.discriminator_facts : []) {
        reachability.factIds.add(fact);
        if (!facts.facts[fact]) errors.push(`${prefix} references unknown discriminator fact ${fact}`);
      }
      const candidatePatternIds = [];
      const usedFacts = new Set();
      for (const candidate of Array.isArray(binding.candidates) ? binding.candidates : []) {
        if (!isRecord(candidate)) {
          errors.push(`${prefix} has a malformed candidate`);
          continue;
        }
        candidatePatternIds.push(candidate.pattern_id);
        reachability.patternIds.add(candidate.pattern_id);
        if (!patternIds.has(candidate.pattern_id)) errors.push(`${prefix} references unknown candidate pattern ${candidate.pattern_id}`);
        try {
          validateExpression(candidate.when, facts.facts);
          for (const fact of referencedFacts(candidate.when)) usedFacts.add(fact);
        } catch (error) {
          errors.push(`${prefix} ${candidate.pattern_id}: ${error.message}`);
        }
      }
      validateSortedUnique(`${prefix} candidate pattern IDs`, candidatePatternIds, errors);
      const declaredFacts = [...(Array.isArray(binding.discriminator_facts) ? binding.discriminator_facts : [])].sort();
      const referenced = [...usedFacts].sort();
      if (JSON.stringify(declaredFacts) !== JSON.stringify(referenced)) errors.push(`${prefix} discriminator facts do not exactly match candidate expressions`);
    }
  }
  return reachability;
}

function validateSortedUnique(label, values, errors) {
  if (!Array.isArray(values) || values.some((value) => !isNonEmptyString(value))) {
    errors.push(`${label} must be an array of non-empty strings`);
    return;
  }
  const sorted = [...new Set(values)].sort();
  if (JSON.stringify(values) !== JSON.stringify(sorted)) errors.push(`${label} must be sorted and unique`);
}
