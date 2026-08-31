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

const phaseTwoSemantics = [
  ['semantics.contrast-minimum', '1.4.3', 'AA', 'contrast-minimum', ['axe', 'human']],
  ['semantics.reflow', '1.4.10', 'AA', 'reflow', ['e2e', 'human']],
  ['semantics.non-text-contrast', '1.4.11', 'AA', 'non-text-contrast', ['axe', 'human']],
  ['semantics.text-spacing', '1.4.12', 'AA', 'text-spacing', ['e2e', 'human']],
  ['semantics.content-on-hover-or-focus', '1.4.13', 'AA', 'content-on-hover-or-focus', ['e2e', 'human']],
  ['semantics.character-key-shortcuts', '2.1.4', 'A', 'character-key-shortcuts', ['e2e', 'human']],
  ['semantics.timing-adjustable', '2.2.1', 'A', 'timing-adjustable', ['e2e', 'human']],
  ['semantics.bypass-blocks', '2.4.1', 'A', 'bypass-blocks', ['axe', 'e2e', 'human']],
  ['semantics.page-title', '2.4.2', 'A', 'page-titled', ['axe', 'human']],
  ['semantics.focus-order', '2.4.3', 'A', 'focus-order', ['e2e', 'human']],
  ['semantics.link-purpose', '2.4.4', 'A', 'link-purpose-in-context', ['axe', 'human']],
  ['semantics.multiple-ways', '2.4.5', 'AA', 'multiple-ways', ['e2e', 'human']],
  ['semantics.pointer-gestures', '2.5.1', 'A', 'pointer-gestures', ['e2e', 'human']],
  ['semantics.pointer-cancellation', '2.5.2', 'A', 'pointer-cancellation', ['e2e', 'human']],
  ['semantics.motion-actuation', '2.5.4', 'A', 'motion-actuation', ['e2e', 'human']],
  ['semantics.language.page', '3.1.1', 'A', 'language-of-page', ['axe', 'human']],
  ['semantics.language.parts', '3.1.2', 'AA', 'language-of-parts', ['axe', 'human']],
  ['semantics.context-change.focus', '3.2.1', 'A', 'on-focus', ['e2e', 'human']],
  ['semantics.context-change.input', '3.2.2', 'A', 'on-input', ['e2e', 'human']],
  ['semantics.consistent-navigation', '3.2.3', 'AA', 'consistent-navigation', ['e2e', 'human']],
  ['semantics.consistent-identification', '3.2.4', 'AA', 'consistent-identification', ['e2e', 'human']],
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

test('Phase 2 semantic-gap rules use stable IDs, complete proof lanes, and paired WCAG references', async () => {
  const data = await loadStandards();
  assert.equal(phaseTwoSemantics.length, 21);
  assert.deepEqual({
    semantics: data.semantics.length,
    patterns: data.patterns.length,
    applicabilityRows: data.matrix.rows.length,
    facts: Object.keys(data.facts.facts).length,
    uiBindings: data.uiDesignBrainBindings.bindings.length,
  }, {
    semantics: 50,
    patterns: 28,
    applicabilityRows: 28,
    facts: 36,
    uiBindings: 80,
  });

  for (const [id, criterion, level, slug, proof] of phaseTwoSemantics) {
    const semantic = semanticById(data, id);
    assert.deepEqual(semantic.proof, proof, `${id} has incorrect proof routing`);
    assert.deepEqual(semantic.standards_refs, [
      {
        authority: 'wcag-2.2',
        identifier: criterion,
        url: `https://www.w3.org/TR/WCAG22/#${slug}`,
        normative: true,
        level,
      },
      {
        authority: 'wcag-2.2-understanding',
        identifier: criterion,
        url: `https://www.w3.org/WAI/WCAG22/Understanding/${slug}.html`,
        normative: false,
        level,
      },
    ]);
  }

  const requiredDetails = {
    'semantics.contrast-minimum': ['4.5:1', '3:1', 'inactive user interface component', 'logo or brand name'],
    'semantics.reflow': ['320 CSS pixels', '256 CSS pixels', 'two-dimensional layout'],
    'semantics.non-text-contrast': ['3:1', 'inactive components', 'unmodified user agent', 'essential'],
    'semantics.text-spacing': ['1.5 times', '2 times', '0.12 times', '0.16 times', 'language or script'],
    'semantics.content-on-hover-or-focus': ['dismissed', 'pointer moves over it', 'information becomes invalid', 'controlled by the user agent'],
    'semantics.character-key-shortcuts': ['turn the shortcut off', 'remap', 'has focus'],
    'semantics.timing-adjustable': ['ten times', '20 seconds', 'real-time event', 'essential', '20 hours'],
    'semantics.bypass-blocks': ['bypass blocks of content', 'repeat across multiple web pages'],
    'semantics.page-title': ['title that describes its topic or purpose'],
    'semantics.focus-order': ['navigated sequentially', 'affects meaning or operation', 'order that preserves meaning and operability'],
    'semantics.link-purpose': ['link text alone', 'programmatically determined link context', 'ambiguous to users in general'],
    'semantics.multiple-ways': ['result of, or a step in, a process'],
    'semantics.pointer-gestures': ['multipoint or path-based gesture', 'single pointer without a path-based gesture', 'essential', 'user agent or assistive technology'],
    'semantics.pointer-cancellation': ['down-event', 'up-event', 'abort', 'undo', 'reverse', 'essential'],
    'semantics.motion-actuation': ['user interface components', 'disabled', 'accessibility-supported interface', 'essential'],
    'semantics.language.page': ['default human language', 'programmatically determined'],
    'semantics.language.parts': ['proper names', 'technical terms', 'indeterminate language', 'vernacular'],
    'semantics.context-change.focus': ['receiving focus', 'does not initiate a change of context'],
    'semantics.context-change.input': ['advised of that behavior before using the component'],
    'semantics.consistent-navigation': ['same relative order', 'unless the user initiates'],
    'semantics.consistent-identification': ['same functionality', 'consistently throughout a set of web pages'],
  };
  for (const [id, details] of Object.entries(requiredDetails)) {
    const requirement = semanticById(data, id).requirement;
    for (const detail of details) assert.ok(requirement.includes(detail), `${id} requirement omits ${detail}`);
  }
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
  assert.deepEqual(rowById(data, 'applicability.page-context').outcomes, [
    'semantics.headings',
    'semantics.landmarks',
    'semantics.bypass-blocks',
    'semantics.focus-order',
    'semantics.language.page',
    'semantics.language.parts',
    'semantics.multiple-ways',
    'semantics.page-title',
  ]);
  assert.deepEqual(rowById(data, 'applicability.complex-pointer').outcomes, ['semantics.keyboard', 'semantics.pointer-gestures']);
  assert.deepEqual(rowById(data, 'applicability.consistent-help').outcomes, ['semantics.consistent-help']);
  assert.deepEqual(rowById(data, 'applicability.redundant-entry').outcomes, ['semantics.form-label', 'semantics.redundant-entry']);
  assert.deepEqual(rowById(data, 'applicability.accessible-authentication').outcomes, ['semantics.accessible-authentication']);

  const phaseTwoRows = [
    ['applicability.visual-presentation', 'artifact.has_rendered_interface', ['semantics.contrast-minimum', 'semantics.non-text-contrast', 'semantics.reflow', 'semantics.text-spacing'], ['axe', 'e2e', 'human']],
    ['applicability.link-purpose', 'content.has_links', ['semantics.link-purpose'], ['axe', 'human']],
    ['applicability.hover-focus-content', 'interaction.has_hover_or_focus_content', ['semantics.content-on-hover-or-focus'], ['e2e', 'human']],
    ['applicability.character-shortcuts', 'interaction.has_character_shortcuts', ['semantics.character-key-shortcuts'], ['e2e', 'human']],
    ['applicability.pointer-cancellation', 'interaction.has_single_pointer_activation', ['semantics.pointer-cancellation'], ['e2e', 'human']],
    ['applicability.motion-actuation', 'interaction.has_motion_actuation', ['semantics.motion-actuation'], ['e2e', 'human']],
    ['applicability.timing-adjustable', 'interaction.has_time_limit', ['semantics.timing-adjustable'], ['e2e', 'human']],
    ['applicability.context-change-focus', 'interaction.changes_context_on_focus', ['semantics.context-change.focus'], ['e2e', 'human']],
    ['applicability.context-change-input', 'interaction.changes_context_on_input', ['semantics.context-change.input'], ['e2e', 'human']],
    ['applicability.consistent-navigation', 'artifact.has_repeated_navigation_across_page_set', ['semantics.consistent-navigation'], ['e2e', 'human']],
    ['applicability.consistent-identification', 'artifact.has_repeated_components_across_page_set', ['semantics.consistent-identification'], ['e2e', 'human']],
  ];
  for (const [id, fact, outcomes, evidence] of phaseTwoRows) {
    assert.deepEqual(data.facts.facts[fact], { type: 'boolean' }, `${fact} must be boolean`);
    assert.deepEqual(rowById(data, id), {
      id,
      when: { equals: { fact, value: true } },
      outcomes,
      evidence,
    });
  }

  for (const fact of ['component.control_group_model', 'component.dialog_purpose', 'component.toggle_model']) {
    assert.deepEqual(data.facts.facts[fact], { type: 'string' });
  }
});

test('corrected WCAG applicability rules fail closed for every trigger state and invalid facts', async () => {
  const data = await loadStandards();
  const cases = [
    ['applicability.dragging-alternative', 'interaction.has_dragging'],
    ['applicability.consistent-help', 'artifact.has_repeated_help_across_page_set'],
    ['applicability.redundant-entry', 'flow.repeats_entry'],
    ['applicability.accessible-authentication', 'flow.has_authentication'],
    ['applicability.visual-presentation', 'artifact.has_rendered_interface'],
    ['applicability.link-purpose', 'content.has_links'],
    ['applicability.hover-focus-content', 'interaction.has_hover_or_focus_content'],
    ['applicability.character-shortcuts', 'interaction.has_character_shortcuts'],
    ['applicability.pointer-cancellation', 'interaction.has_single_pointer_activation'],
    ['applicability.motion-actuation', 'interaction.has_motion_actuation'],
    ['applicability.timing-adjustable', 'interaction.has_time_limit'],
    ['applicability.context-change-focus', 'interaction.changes_context_on_focus'],
    ['applicability.context-change-input', 'interaction.changes_context_on_input'],
    ['applicability.consistent-navigation', 'artifact.has_repeated_navigation_across_page_set'],
    ['applicability.consistent-identification', 'artifact.has_repeated_components_across_page_set'],
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
  for (const factId of ['content.uses_orientation_or_sensory_cues', 'content.has_locale_or_bidi']) {
    assert.equal(Object.hasOwn(data.facts.facts, factId), false, `${factId} should not imply unrelated coverage`);
  }
  for (const rowId of ['applicability.orientation-sensory', 'applicability.locale-bidi']) {
    assert.equal(data.matrix.rows.some(({ id }) => id === rowId), false, `${rowId} should remain a declared WCAG gap`);
  }
});
