import assert from 'node:assert/strict';
import test from 'node:test';
import { compileApplicability } from '../../lib/compile-applicability.mjs';
import { loadStandards } from '../../lib/load.mjs';

const newSemantics = [
  ['semantics.accessible-authentication', '3.3.8', 'AA', 'accessible-authentication-minimum'],
  ['semantics.consistent-help', '3.2.6', 'A', 'consistent-help'],
  ['semantics.dragging-alternative', '2.5.7', 'AA', 'dragging-movements'],
  ['semantics.redundant-entry', '3.3.7', 'A', 'redundant-entry']
];

function semanticById(data, id) {
  const semantic = data.semantics.find((candidate) => candidate.id === id);
  assert.ok(semantic, `missing semantic ${id}`);
  return semantic;
}

function rowById(data, id) {
  const row = data.matrix.rows.find((candidate) => candidate.id === id);
  assert.ok(row, `missing applicability row ${id}`);
  return row;
}

test('every semantic has normalized, authoritative, deterministically sorted standards references', async () => {
  const data = await loadStandards();
  const authorities = new Map(data.sources.authorities.map((authority) => [authority.id, authority]));

  for (const semantic of data.semantics) {
    assert.ok(semantic.standards_refs?.length, `${semantic.id} must cite at least one standards source`);
    const identities = [];
    for (const ref of semantic.standards_refs) {
      assert.deepEqual(
        Object.keys(ref).sort(),
        ['authority', 'identifier', ...(ref.level === undefined ? [] : ['level']), 'normative', 'url'],
        `${semantic.id} has a non-normalized standards reference`
      );
      const authority = authorities.get(ref.authority);
      assert.ok(authority, `${semantic.id} cites undeclared authority ${ref.authority}`);
      assert.equal(ref.normative, authority.normative, `${semantic.id} has the wrong normative flag for ${ref.authority}`);
      assert.ok(ref.url.startsWith(authority.url), `${semantic.id} reference is outside ${ref.authority}`);
      identities.push(`${ref.authority}\u0000${ref.identifier}\u0000${ref.url}`);

      if (ref.authority === 'wcag-2.2') {
        assert.match(ref.identifier, /^\d+\.\d+\.\d+$/);
        assert.match(ref.url, /^https:\/\/www\.w3\.org\/TR\/WCAG22\/#/);
        assert.ok(['A', 'AA', 'AAA'].includes(ref.level), `${semantic.id} WCAG reference must declare a level`);
      }
      if (ref.authority === 'wcag-2.2-understanding') {
        assert.match(ref.identifier, /^\d+\.\d+\.\d+$/);
        assert.match(ref.url, /^https:\/\/www\.w3\.org\/WAI\/WCAG22\/Understanding\/[a-z0-9-]+\.html$/);
        assert.ok(['A', 'AA', 'AAA'].includes(ref.level), `${semantic.id} Understanding reference must declare a level`);
      }
    }
    assert.deepEqual(identities, [...identities].sort(), `${semantic.id} standards references are not sorted`);
    assert.equal(new Set(identities).size, identities.length, `${semantic.id} standards references are duplicated`);
  }
});

test('WCAG 2.2 additions have dedicated semantics and normative plus explanatory citations', async () => {
  const data = await loadStandards();
  assert.deepEqual(newSemantics.map(([id]) => id), [...newSemantics.map(([id]) => id)].sort());

  for (const [id, criterion, level, slug] of newSemantics) {
    const semantic = semanticById(data, id);
    assert.deepEqual(semantic.proof, ['e2e', 'human']);
    assert.deepEqual(semantic.standards_refs, [
      {
        authority: 'wcag-2.2',
        identifier: criterion,
        url: `https://www.w3.org/TR/WCAG22/#${slug}`,
        normative: true,
        level
      },
      {
        authority: 'wcag-2.2-understanding',
        identifier: criterion,
        url: `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`,
        normative: false,
        level
      }
    ]);
  }

  assert.match(semanticById(data, 'semantics.dragging-alternative').requirement, /single-pointer method that does not require dragging/);
  assert.match(semanticById(data, 'semantics.consistent-help').requirement, /same serialized order/);
  assert.match(semanticById(data, 'semantics.redundant-entry').requirement, /auto-populated or available to select/);
  assert.match(semanticById(data, 'semantics.accessible-authentication').requirement, /pasting a complete one-time code/);
});

test('focus visibility and target size express the WCAG 2.2 AA requirements without AAA substitution', async () => {
  const data = await loadStandards();
  const focus = semanticById(data, 'semantics.focus.visible');
  assert.deepEqual(
    focus.standards_refs.filter(({ authority }) => authority === 'wcag-2.2').map(({ identifier, level }) => [identifier, level]),
    [['2.4.11', 'AA'], ['2.4.7', 'AA']]
  );
  assert.deepEqual(
    focus.standards_refs.filter(({ authority }) => authority === 'wcag-2.2-understanding').map(({ identifier, level }) => [identifier, level]),
    [['2.4.11', 'AA'], ['2.4.7', 'AA']]
  );
  assert.match(focus.requirement, /not entirely hidden by author-created content/);

  const target = semanticById(data, 'semantics.target-size');
  assert.deepEqual(target.standards_refs.map(({ authority, identifier, level }) => [authority, identifier, level]), [
    ['wcag-2.2', '2.5.8', 'AA'],
    ['wcag-2.2-understanding', '2.5.8', 'AA']
  ]);
  for (const detail of ['axis-aligned 24 by 24 CSS pixel square', '24 CSS pixel diameter circle', 'centered on its bounding box', 'does not intersect another target', 'equivalent control on the same page', 'line-height of non-target text', 'unmodified user agent', 'essential', 'legally required for the information being conveyed']) {
    assert.ok(target.requirement.includes(detail), `target-size requirement omits ${detail}`);
  }
  assert.doesNotMatch(target.requirement, /44 by 44/);
});

test('existing covered mappings state the complete interaction obligation', async () => {
  const data = await loadStandards();
  const accessibleName = semanticById(data, 'semantics.accessible-name').requirement;
  assert.match(accessibleName, /visible labels include text or images of text/);
  assert.match(accessibleName, /accessible name contains the text presented visually/);

  const nameRoleValue = semanticById(data, 'semantics.name-role-value').requirement;
  assert.match(nameRoleValue, /name and role can be programmatically determined/);
  assert.match(nameRoleValue, /states, properties, and values that users can set can be programmatically set/);
  assert.match(nameRoleValue, /notification of changes.*available to user agents, including assistive technologies/);

  const formError = semanticById(data, 'semantics.form-error').requirement;
  assert.match(formError, /When an input error is automatically detected/);
  assert.match(formError, /When correction suggestions are known/);
  assert.match(formError, /jeopardize the security or purpose of the content/);

  const consequentialAction = semanticById(data, 'semantics.consequential-action').requirement;
  for (const detail of ['legal commitments', 'financial transactions', 'user-controllable data in data storage systems', 'user test responses', 'submissions are reversible', 'checked for input errors', 'review, confirm, and correct']) {
    assert.ok(consequentialAction.includes(detail), `consequential-action requirement omits ${detail}`);
  }

  const motion = semanticById(data, 'semantics.motion-control').requirement.toLowerCase();
  for (const detail of ['moving, blinking, or scrolling', 'more than five seconds', 'update frequency', 'unless essential']) {
    assert.ok(motion.includes(detail), `motion-control requirement omits ${detail}`);
  }

  const status = semanticById(data, 'semantics.live-status').requirement;
  assert.match(status, /Status messages that can be programmatically determined/);
  assert.match(status, /without receiving focus/);
});

test('WCAG 2.2 applicability routes use dedicated facts and semantics', async () => {
  const data = await loadStandards();
  assert.deepEqual(data.facts.facts['interaction.has_dragging'], { type: 'boolean' });
  assert.deepEqual(rowById(data, 'applicability.dragging-alternative'), {
    id: 'applicability.dragging-alternative',
    when: { equals: { fact: 'interaction.has_dragging', value: true } },
    outcomes: ['semantics.dragging-alternative'],
    evidence: ['e2e', 'human']
  });
  assert.deepEqual(rowById(data, 'applicability.complex-pointer').outcomes, ['semantics.keyboard']);
  assert.deepEqual(rowById(data, 'applicability.consistent-help').outcomes, ['semantics.consistent-help']);
  assert.deepEqual(rowById(data, 'applicability.redundant-entry').outcomes, ['semantics.form-label', 'semantics.redundant-entry']);
  assert.deepEqual(rowById(data, 'applicability.accessible-authentication').outcomes, ['semantics.accessible-authentication']);
});

test('corrected WCAG applicability rules fail closed for every trigger state and invalid facts', async () => {
  const data = await loadStandards();
  const cases = [
    ['applicability.dragging-alternative', 'interaction.has_dragging'],
    ['applicability.consistent-help', 'artifact.has_repeated_help_across_page_set'],
    ['applicability.redundant-entry', 'flow.repeats_entry'],
    ['applicability.accessible-authentication', 'flow.has_authentication'],
  ];

  for (const [rowId, factId] of cases) {
    const applicable = compileApplicability(data.matrix, data.facts, { [factId]: true }).find(({ id }) => id === rowId);
    assert.deepEqual([applicable.trigger_state, applicable.resolution_state], ['applicable', 'resolved']);

    const inapplicable = compileApplicability(data.matrix, data.facts, { [factId]: false }).find(({ id }) => id === rowId);
    assert.deepEqual([inapplicable.trigger_state, inapplicable.resolution_state], ['not_applicable', 'skipped']);

    const missing = compileApplicability(data.matrix, data.facts).find(({ id }) => id === rowId);
    assert.deepEqual([missing.trigger_state, missing.resolution_state], ['unobserved', 'needs_input']);

    assert.throws(
      () => compileApplicability(data.matrix, data.facts, { [factId]: 'true' }),
      new RegExp(`Observed value for ${factId.replaceAll('.', '\\.') } must be boolean`),
    );
  }
});

test('known WCAG gaps do not resolve to unrelated semantics', async () => {
  const data = await loadStandards();
  for (const factId of ['interaction.has_character_shortcuts', 'content.uses_orientation_or_sensory_cues', 'content.has_locale_or_bidi']) {
    assert.equal(Object.hasOwn(data.facts.facts, factId), false, `${factId} should not imply unrelated coverage`);
  }
  for (const rowId of ['applicability.character-shortcuts', 'applicability.orientation-sensory', 'applicability.locale-bidi']) {
    assert.equal(data.matrix.rows.some(({ id }) => id === rowId), false, `${rowId} should remain a declared WCAG gap`);
  }
});
