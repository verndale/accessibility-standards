import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import validator from '../../scripts/validate_pr_body.cjs';

const { REQUIRED_CHECKS, REQUIRED_SECTIONS, validatePullRequestBody } = validator;
const body = [
  '## Summary',
  'Make pull request validation deterministic.',
  '## Linked issue',
  'Closes #27',
  '## Changes',
  'Update the validator and add regression tests.',
  '## Verification',
  'Run repository verification successfully.',
  '## Risk and rollback',
  '- Risk: Limited to PR descriptions.',
  '- Rollback: Revert the validator change.',
  '## Checklist',
  ...REQUIRED_CHECKS.map((item) => `- [x] ${item}`),
].join('\n');

test('PR body validator matches the canonical template', () => {
  const template = readFileSync(new URL('../../.github/pull_request_template.md', import.meta.url), 'utf8');
  assert.deepEqual([...template.matchAll(/^## (.+)$/gm)].map((match) => match[1]), REQUIRED_SECTIONS);
  assert.deepEqual([...template.matchAll(/^- \[ \] (.+)$/gm)].map((match) => match[1]), REQUIRED_CHECKS);
  assert.notDeepEqual(validatePullRequestBody(template), []);
  assert.deepEqual(validatePullRequestBody(body), []);
  assert.deepEqual(validatePullRequestBody(body.replaceAll('\n', '\r\n')), []);
});

test('PR body headings must be visible, ordered, and on one line', () => {
  for (const hidden of [`<!--\n${body}\n-->`, `<!--\n${body}`, `\`\`\`md\n${body}\n\`\`\``, `~~~md\n${body}\n~~~`]) {
    assert.notDeepEqual(validatePullRequestBody(hidden), []);
  }
  for (const example of ['<!--\n## Example\n-->', '```md\n## Example\n```', '~~~md\n## Example\n~~~']) {
    assert.deepEqual(validatePullRequestBody(body.replace('Run repository verification successfully.',
      `Run repository verification successfully.\n${example}`)), []);
  }
  assert.deepEqual(validatePullRequestBody(body.replace('Run repository verification successfully.',
    '```text\nverification output\n```\nRun repository verification successfully.')), []);
  for (const malformed of [body.replace(/^## /gm, '##\n'), body.replace('## Changes', '## Summary\n## Changes'),
    body.replace('## Linked issue', '## Changes').replace('## Changes\nUpdate', '## Linked issue\nUpdate')]) {
    assert.notDeepEqual(validatePullRequestBody(malformed), []);
  }
  assert.notDeepEqual(validatePullRequestBody(body.replace('Closes #27', 'Related #27')), []);
});
