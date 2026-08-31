import { digest } from './digest.mjs';

const byId = (left, right) => left.id.localeCompare(right.id);

function profileContractPayload(data, profile) {
  const contract = data.profiles?.[profile];
  const templates = data.profileTemplates?.[profile];
  if (!contract || !templates) throw new Error(`Unknown profile contract: ${profile}`);
  return { contract, templates };
}

export function sourceContractPayload(data) {
  return {
    package: { name: data.package.name, version: data.package.version },
    contract: data.contract,
    sources: data.sources,
    wcag_2_2: data.wcagCoverage,
    foundations: [...data.foundations].sort(byId),
    semantics: [...data.semantics].sort(byId),
    patterns: [...data.patterns].sort(byId),
    policies: [...data.policies].sort(byId),
    facts: data.facts,
    matrix: data.matrix,
    evidence: data.evidence,
    schemas: data.schemas,
    ui_design_brain_bindings: data.uiDesignBrainBindings,
    profiles: Object.fromEntries(Object.keys(data.profiles)
      .sort()
      .map((profile) => [profile, profileContractPayload(data, profile)])),
  };
}

export function sourceContractDigest(data) {
  return digest(sourceContractPayload(data));
}

export function profileContractDigest(data, profile) {
  return digest(profileContractPayload(data, profile));
}

export function projectionProvenance(data, profile) {
  const profileContract = data.profiles[profile];
  return {
    package: `@verndale/accessibility-standards@${data.contract.package_version}`,
    profile,
    profile_version: profileContract.version,
    profile_digest: profileContractDigest(data, profile),
    schema_version: data.contract.schema_version,
    source_digest: sourceContractDigest(data),
  };
}
