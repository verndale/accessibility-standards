import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveUiPatternBindings } from '../../lib/compile-applicability.mjs';
import { loadStandards } from '../../lib/load.mjs';

const apgPatternRefs = {
  'pattern.accordion': ['accordion'],
  'pattern.alert': ['alert'],
  'pattern.alert-dialog': ['alertdialog'],
  'pattern.carousel': ['carousel'],
  'pattern.checkbox': ['checkbox'],
  'pattern.combobox': ['combobox'],
  'pattern.dialog': ['dialog-modal'],
  'pattern.disclosure': ['disclosure'],
  'pattern.listbox': ['listbox'],
  'pattern.menu': ['menubar'],
  'pattern.menu-button': ['menu-button'],
  'pattern.radio-group': ['radio'],
  'pattern.slider': ['slider', 'slider-multithumb'],
  'pattern.spinbutton': ['spinbutton'],
  'pattern.switch': ['switch'],
  'pattern.tabs': ['tabs'],
  'pattern.toolbar': ['toolbar'],
  'pattern.tooltip': ['tooltip'],
  'pattern.tree-view': ['treeview'],
};

const normativePatternRefs = {
  'pattern.consequential-submission': ['wcag-2.2:3.3.4'],
  'pattern.dynamic-status': ['wcag-2.2:4.1.3'],
  'pattern.field': ['wcag-2.2:3.3.2', 'wcag-2.2:4.1.2'],
  'pattern.image': ['wcag-2.2:1.1.1'],
  'pattern.media-player': ['wcag-2.2:1.2.1', 'wcag-2.2:1.2.2', 'wcag-2.2:1.2.3', 'wcag-2.2:1.2.5'],
  'pattern.pagination': ['wcag-2.2:2.4.4'],
  'pattern.popover': ['wcag-2.2:2.1.1', 'wcag-2.2:2.4.3'],
  'pattern.progress': ['wai-aria-1.2:progressbar', 'wcag-2.2:4.1.2'],
  'pattern.validation': ['wcag-2.2:3.3.1', 'wcag-2.2:3.3.3'],
};

const wcagLevels = {
  '1.1.1': 'A',
  '1.2.1': 'A',
  '1.2.2': 'A',
  '1.2.3': 'A',
  '1.2.5': 'AA',
  '2.1.1': 'A',
  '2.4.3': 'A',
  '2.4.4': 'A',
  '3.3.1': 'A',
  '3.3.2': 'A',
  '3.3.3': 'AA',
  '3.3.4': 'AA',
  '4.1.2': 'A',
  '4.1.3': 'AA',
};

test('every pattern has sorted, authority-consistent standards references', async () => {
  const data = await loadStandards();
  const authorities = new Map(data.sources.authorities.map((authority) => [authority.id, authority]));

  for (const pattern of data.patterns) {
    assert.ok(pattern.standards_refs?.length, `${pattern.id} is missing standards_refs`);
    const identities = pattern.standards_refs.map((ref) => `${ref.authority}\0${ref.identifier}\0${ref.url}`);
    assert.deepEqual(identities, [...identities].sort(), `${pattern.id} standards_refs are not sorted`);
    for (const ref of pattern.standards_refs) {
      const authority = authorities.get(ref.authority);
      assert.ok(authority, `${pattern.id} uses unknown authority ${ref.authority}`);
      assert.equal(ref.normative, authority.normative, `${pattern.id} has an incorrect normative marker`);
      assert.ok(ref.url.startsWith(authority.url), `${pattern.id} URL is outside ${ref.authority}`);
      if (ref.authority === 'aria-apg') {
        assert.deepEqual(Object.keys(ref), ['authority', 'identifier', 'url', 'normative']);
      }
    }
  }
});

test('dedicated APG patterns use exact official pattern slugs and activation IDs', async () => {
  const data = await loadStandards();
  const byId = new Map(data.patterns.map((pattern) => [pattern.id, pattern]));

  for (const [id, identifiers] of Object.entries(apgPatternRefs)) {
    const pattern = byId.get(id);
    assert.ok(pattern, `missing ${id}`);
    assert.deepEqual(pattern.standards_refs.map(({ authority }) => authority), identifiers.map(() => 'aria-apg'));
    assert.deepEqual(pattern.standards_refs.map(({ identifier }) => identifier), identifiers);
    assert.deepEqual(
      pattern.standards_refs.map(({ url }) => url),
      identifiers.map((identifier) => `https://www.w3.org/WAI/ARIA/apg/patterns/${identifier}/`),
    );
  }

  for (const id of ['pattern.alert-dialog', 'pattern.checkbox', 'pattern.menu', 'pattern.radio-group', 'pattern.slider', 'pattern.spinbutton', 'pattern.switch', 'pattern.toolbar', 'pattern.tree-view']) {
    const pattern = byId.get(id);
    assert.deepEqual(pattern.activation, { contains: { fact: 'component.accessibility_pattern_ids', value: id } });
    assert.ok(pattern.requires.length > 0);
    assert.ok(pattern.behavior.length > 0);
    assert.ok(pattern.product_decisions.length > 0);
    assert.ok(pattern.functional_spec_bindings.length > 0);
    assert.ok(pattern.implementation_outcomes.length > 0);
    assert.deepEqual(pattern.evidence_routes, ['unit', 'axe', 'e2e', 'human']);
  }
  assert.ok(byId.get('pattern.slider').product_decisions.includes('single_or_multi_thumb'));
  assert.ok(byId.get('pattern.slider').product_decisions.includes('direction_mapping'));

  for (const id of ['pattern.checkbox', 'pattern.menu', 'pattern.radio-group']) {
    assert.ok(!byId.get(id).requires.includes('semantics.selected-state'), `${id} must use checked, not selected, state`);
  }
  assert.ok(byId.get('pattern.checkbox').requires.includes('semantics.roles-states-properties'));
  assert.ok(!byId.get('pattern.spinbutton').requires.includes('semantics.form-error'));
  assert.ok(byId.get('pattern.slider').requires.includes('semantics.dragging-alternative'));
  assert.ok(byId.get('pattern.slider').requires.includes('semantics.native-elements'));
  assert.ok(
    byId.get('pattern.slider').behavior.some((behavior) => behavior.includes('does not require dragging')),
    'pattern.slider must require a single-pointer non-drag method',
  );
  assert.ok(
    byId.get('pattern.tree-view').behavior.some((behavior) => behavior.includes('Space toggles selection') && behavior.includes('multi-select')),
    'pattern.tree-view must define multi-select keyboard behavior',
  );
  assert.ok(
    byId.get('pattern.radio-group').behavior.some((behavior) => behavior.includes('inside a toolbar') && behavior.includes('Space') && behavior.includes('Enter')),
    'pattern.radio-group must define toolbar selection keys',
  );
  assert.ok(
    byId.get('pattern.slider').behavior.some((behavior) => behavior.includes('Right and Up increase') && behavior.includes('Left and Down decrease')),
    'pattern.slider must define value direction',
  );
});

test('switch, alert-dialog, and toolbar contracts preserve their APG distinctions', async () => {
  const data = await loadStandards();
  const byId = new Map(data.patterns.map((pattern) => [pattern.id, pattern]));

  const switchPattern = byId.get('pattern.switch');
  const switchBehavior = switchPattern.behavior.join('\n');
  assert.match(switchPattern.scope, /Binary on\/off switches/);
  assert.match(switchPattern.scope, /excludes tri-state checkboxes and toggle buttons/);
  assert.match(switchBehavior, /Expose role="switch" on both native checkbox and custom focusable hosts/);
  assert.match(switchBehavior, /expose only true or false checked state/);
  assert.match(switchBehavior, /checkbox's native checked state or aria-checked on a custom host/);
  assert.match(switchBehavior, /never expose a mixed state/);
  assert.match(switchBehavior, /accessible label stable when state changes/);
  assert.match(switchBehavior, /Space toggles the focused switch exactly once/);
  assert.match(switchBehavior, /Enter toggles only when the declared enter_toggles decision/);
  assert.ok(switchPattern.requires.includes('semantics.roles-states-properties'));
  assert.deepEqual(switchPattern.product_decisions, ['enter_toggles', 'group_labeling', 'host_element']);

  const alertDialog = byId.get('pattern.alert-dialog');
  const alertDialogBehavior = alertDialog.behavior.join('\n');
  assert.match(alertDialog.scope, /require a user response/);
  assert.match(alertDialog.scope, /excludes passive alerts and general-purpose dialogs/);
  assert.ok(alertDialog.requires.includes('semantics.native-dialog'));
  for (const semanticId of ['semantics.focus-order', 'semantics.focus.visible', 'semantics.keyboard']) {
    assert.ok(alertDialog.requires.includes(semanticId), `alert dialog must compose ${semanticId}`);
  }
  assert.ok(!alertDialog.requires.includes('semantics.alert'), 'alert dialog must not inherit passive alert/status behavior');
  assert.match(alertDialogBehavior, /Expose alertdialog semantics with aria-modal true/);
  assert.match(alertDialogBehavior, /accessible description that references the alert message/);
  assert.match(alertDialogBehavior, /content outside the alert dialog inert for every user/);
  assert.match(alertDialogBehavior, /prefer the least destructive response/);
  assert.match(alertDialogBehavior, /Keep Tab and Shift\+Tab within the alert dialog/);
  assert.match(alertDialogBehavior, /Escape invokes the declared cancel or dismissal response/);
  assert.match(alertDialogBehavior, /return focus to the invoking control or to a documented logical successor/);

  const toolbar = byId.get('pattern.toolbar');
  const toolbarBehavior = toolbar.behavior.join('\n');
  assert.match(toolbar.scope, /three or more related controls/);
  assert.match(toolbarBehavior, /aria-orientation when the toolbar is vertical/);
  assert.match(toolbarBehavior, /Keep one toolbar control in the page tab sequence/);
  assert.match(toolbarBehavior, /Tab and Shift\+Tab move into or out of the toolbar rather than among its controls/);
  assert.match(toolbarBehavior, /horizontal toolbar, Right Arrow moves to the next control and Left Arrow to the previous/);
  assert.match(toolbarBehavior, /vertical toolbar, Down Arrow moves next and Up Arrow moves previous/);
  assert.match(toolbarBehavior, /Home moves focus to the first control and End moves focus to the last control/);
  assert.match(toolbarBehavior, /preserve the orthogonal arrow pair for operating embedded controls/);
  assert.match(toolbarBehavior, /moves focus without changing a radio selection or activating another control/);
  assert.match(toolbarBehavior, /disabled_focusability policy/);
  assert.deepEqual(toolbar.product_decisions, ['disabled_focusability', 'entry_focus', 'home_end', 'orientation', 'reserved_arrow_keys', 'wrap_navigation']);
});

test('menu and tree contracts state the APG focus and keyboard models explicitly', async () => {
  const data = await loadStandards();
  const byId = new Map(data.patterns.map((pattern) => [pattern.id, pattern]));
  const menu = byId.get('pattern.menu');
  const menuBehavior = menu.behavior.join('\n');
  assert.match(menuBehavior, /popup menu opens, move focus to its first item/);
  assert.match(menuBehavior, /persistent menubar receives focus through Tab or Shift\+Tab/);
  assert.match(menuBehavior, /Tab and Shift\+Tab do not move among items/);
  assert.match(menuBehavior, /Enter opens an item's submenu and focuses its first item/);
  assert.match(menuBehavior, /Space mirrors Enter on plain items/);
  assert.match(menuBehavior, /menuitemcheckbox without closing/);
  assert.match(menuBehavior, /menuitemradio while unchecking its group peers without closing/);
  assert.match(menuBehavior, /disabled menu items focusable but non-activatable/);
  assert.match(menuBehavior, /separators non-focusable/);
  assert.ok(menu.product_decisions.includes('entry_focus'));
  assert.ok(menu.product_decisions.includes('space_behavior'));

  const tree = byId.get('pattern.tree-view');
  const treeBehavior = tree.behavior.join('\n');
  assert.match(treeBehavior, /Right Arrow opens a closed parent without moving focus/);
  assert.match(treeBehavior, /moves from an open parent to its first child/);
  assert.match(treeBehavior, /Left Arrow closes an open parent/);
  assert.match(treeBehavior, /moves from a closed parent or end node to its parent/);
  assert.match(treeBehavior, /Down Arrow moves to the next visible focusable node/);
  assert.match(treeBehavior, /Up Arrow moves to the previous visible focusable node/);
  assert.match(treeBehavior, /For a horizontal tree, remap Down Arrow/);
  assert.ok(tree.product_decisions.includes('multi_select_keyboard_model'));
  assert.match(treeBehavior, /recommended modifier-free model/);
  assert.match(treeBehavior, /navigation does not clear selection, Space toggles selection/);
  assert.match(treeBehavior, /alternative modifier-required model/);
  assert.match(treeBehavior, /Control plus an arrow moves focus without changing selection/);
  assert.match(treeBehavior, /Control plus Space toggles the focused node/);
});

test('slider and spinbutton contracts preserve native-first controls and editable-state meaning', async () => {
  const data = await loadStandards();
  const byId = new Map(data.patterns.map((pattern) => [pattern.id, pattern]));
  const slider = byId.get('pattern.slider');
  assert.ok(slider.requires.includes('semantics.native-elements'));
  assert.ok(slider.product_decisions.includes('native_or_custom'));
  assert.match(slider.behavior.join('\n'), /Use a native input\[type=range\] for a single-thumb slider/);
  assert.match(slider.behavior.join('\n'), /use a custom slider only when native behavior cannot satisfy/);

  const spinbutton = byId.get('pattern.spinbutton');
  assert.doesNotMatch(spinbutton.scope, /read-only/i);
  assert.ok(spinbutton.product_decisions.includes('native_or_custom'));
  assert.match(spinbutton.behavior.join('\n'), /Use a native number input when it supplies the required/);
  assert.match(spinbutton.behavior.join('\n'), /editable decision as permission for direct text entry/);
  assert.match(spinbutton.behavior.join('\n'), /not exposed as read-only/);
});

test('repository-specific patterns use exact normative references without false APG provenance', async () => {
  const data = await loadStandards();
  const byId = new Map(data.patterns.map((pattern) => [pattern.id, pattern]));

  for (const [id, expected] of Object.entries(normativePatternRefs)) {
    const refs = byId.get(id).standards_refs;
    assert.ok(refs.every(({ authority }) => authority !== 'aria-apg'), `${id} has false APG provenance`);
    assert.deepEqual(refs.map(({ authority, identifier }) => `${authority}:${identifier}`), expected);
    for (const ref of refs.filter(({ authority }) => authority === 'wcag-2.2')) {
      assert.equal(ref.level, wcagLevels[ref.identifier], `${id} has the wrong WCAG level for ${ref.identifier}`);
    }
  }

  const consequential = byId.get('pattern.consequential-submission');
  assert.match(consequential.scope, /stored user-controllable data changes/);
  assert.match(consequential.behavior.join('\n'), /make the submission reversible/);
  assert.match(consequential.behavior.join('\n'), /check user-entered data for errors and let the user correct them/);
  assert.match(consequential.behavior.join('\n'), /review, confirm, and correct information before finalizing/);
});

test('UI Design Brain bindings resolve the APG implementation slice exactly', async () => {
  const data = await loadStandards();
  const byUiPatternId = new Map(data.uiDesignBrainBindings.bindings.map((binding) => [binding.ui_pattern_id, binding]));
  const expected = {
    checkbox: ['pattern.checkbox', 'pattern.field'],
    'context-menu': ['pattern.menu'],
    'dropdown-menu': ['pattern.menu', 'pattern.menu-button'],
    'number-input': ['pattern.field', 'pattern.spinbutton'],
    'radio-button': ['pattern.field', 'pattern.radio-group'],
    slider: ['pattern.field', 'pattern.slider'],
    stepper: ['pattern.field', 'pattern.spinbutton'],
    'tree-view': ['pattern.tree-view'],
  };

  for (const [uiPatternId, patternIds] of Object.entries(expected)) {
    assert.deepEqual(byUiPatternId.get(uiPatternId), {
      ui_pattern_id: uiPatternId,
      classification: 'direct',
      pattern_ids: patternIds,
    });
  }

  const resolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': Object.keys(expected),
  });
  assert.deepEqual(resolved.pattern_ids, [
    'pattern.checkbox',
    'pattern.field',
    'pattern.menu',
    'pattern.menu-button',
    'pattern.radio-group',
    'pattern.slider',
    'pattern.spinbutton',
    'pattern.tree-view',
  ]);
  assert.deepEqual(resolved.baseline_only_ui_pattern_ids, []);
  assert.deepEqual(resolved.candidate_evaluations, []);
});

test('switch, alert-dialog, and toolbar bindings retain base outcomes and require exact discriminators', async () => {
  const data = await loadStandards();
  const byUiPatternId = new Map(data.uiDesignBrainBindings.bindings.map((binding) => [binding.ui_pattern_id, binding]));

  assert.deepEqual(byUiPatternId.get('toggle'), {
    ui_pattern_id: 'toggle',
    classification: 'candidate',
    pattern_ids: ['pattern.field'],
    discriminator_facts: ['component.toggle_model'],
    candidates: [
      { pattern_id: 'pattern.switch', when: { equals: { fact: 'component.toggle_model', value: 'switch' } } },
    ],
  });
  assert.deepEqual(byUiPatternId.get('modal'), {
    ui_pattern_id: 'modal',
    classification: 'candidate',
    pattern_ids: ['pattern.dialog'],
    discriminator_facts: ['component.dialog_purpose'],
    candidates: [
      { pattern_id: 'pattern.alert-dialog', when: { equals: { fact: 'component.dialog_purpose', value: 'urgent-response' } } },
    ],
  });
  assert.deepEqual(byUiPatternId.get('button-group'), {
    ui_pattern_id: 'button-group',
    classification: 'candidate',
    baseline_semantic_ids: ['semantics.accessible-name', 'semantics.focus.visible', 'semantics.keyboard', 'semantics.native-elements'],
    discriminator_facts: ['component.control_group_model'],
    candidates: [
      { pattern_id: 'pattern.toolbar', when: { equals: { fact: 'component.control_group_model', value: 'toolbar' } } },
    ],
  });

  const unresolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['button-group', 'modal', 'toggle'],
  });
  assert.deepEqual(unresolved.pattern_ids, ['pattern.dialog', 'pattern.field']);
  assert.deepEqual(unresolved.semantic_ids, ['semantics.accessible-name', 'semantics.focus.visible', 'semantics.keyboard', 'semantics.native-elements']);
  assert.deepEqual(
    unresolved.candidate_evaluations.map(({ pattern_id, trigger_state, resolution_state, missing_facts }) => ({ pattern_id, trigger_state, resolution_state, missing_facts })),
    [
      { pattern_id: 'pattern.toolbar', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.control_group_model'] },
      { pattern_id: 'pattern.alert-dialog', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.dialog_purpose'] },
      { pattern_id: 'pattern.switch', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.toggle_model'] },
    ],
  );

  const resolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['button-group', 'modal', 'toggle'],
    'component.control_group_model': 'toolbar',
    'component.dialog_purpose': 'urgent-response',
    'component.toggle_model': 'switch',
  });
  assert.deepEqual(resolved.pattern_ids, ['pattern.alert-dialog', 'pattern.dialog', 'pattern.field', 'pattern.switch', 'pattern.toolbar']);
  assert.ok(resolved.candidate_evaluations.every(({ trigger_state, resolution_state }) => trigger_state === 'applicable' && resolution_state === 'resolved'));

  const skipped = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['button-group', 'modal', 'toggle'],
    'component.control_group_model': 'plain-group',
    'component.dialog_purpose': 'general',
    'component.toggle_model': 'checkbox',
  });
  assert.deepEqual(skipped.pattern_ids, ['pattern.dialog', 'pattern.field']);
  assert.ok(skipped.candidate_evaluations.every(({ trigger_state, resolution_state }) => trigger_state === 'not_applicable' && resolution_state === 'skipped'));
  assert.throws(
    () => resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': ['toggle'], 'component.toggle_model': true }),
    /Observed value for component.toggle_model must be string/,
  );
  assert.throws(
    () => resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': ['modal'], 'component.dialog_purpose': false }),
    /Observed value for component.dialog_purpose must be string/,
  );
  assert.throws(
    () => resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': ['button-group'], 'component.control_group_model': 1 }),
    /Observed value for component.control_group_model must be string/,
  );

  const prohibitedInference = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['alert', 'rich-text-editor', 'utility-bar'],
    'component.has_dynamic_status': false,
    'component.message_urgency': 'urgent',
  });
  assert.deepEqual(prohibitedInference.pattern_ids, ['pattern.alert']);
  assert.ok(!prohibitedInference.pattern_ids.includes('pattern.alert-dialog'));
  assert.ok(!prohibitedInference.pattern_ids.includes('pattern.toolbar'));
});
