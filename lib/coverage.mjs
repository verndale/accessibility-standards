export function buildLaneCoverage(data) {
  return Object.fromEntries(
    Object.keys(data.evidence.proof_kinds)
      .sort()
      .map((lane) => [
        lane,
        [...new Set([
          ...data.semantics
            .filter((item) => item.proof.includes(lane))
            .map(({ id }) => id),
          ...data.patterns
            .filter((item) => item.evidence_routes.includes(lane))
            .map(({ id }) => id),
          ...data.matrix.rows
            .filter((item) => item.evidence.includes(lane))
            .flatMap((item) => item.outcomes),
        ])].sort(),
      ]),
  );
}
