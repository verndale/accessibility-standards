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
  'pattern.feed': ['feed'],
  'pattern.grid': ['grid'],
  'pattern.listbox': ['listbox'],
  'pattern.menu': ['menubar'],
  'pattern.menu-button': ['menu-button'],
  'pattern.meter': ['meter'],
  'pattern.radio-group': ['radio'],
  'pattern.slider': ['slider', 'slider-multithumb'],
  'pattern.spinbutton': ['spinbutton'],
  'pattern.switch': ['switch'],
  'pattern.tabs': ['tabs'],
  'pattern.toggle-button': ['button'],
  'pattern.toolbar': ['toolbar'],
  'pattern.tooltip': ['tooltip'],
  'pattern.tree-view': ['treeview'],
  'pattern.treegrid': ['treegrid'],
  'pattern.window-splitter': ['windowsplitter'],
};

const expectedApgPatterns = [
  ['accordion', 'dedicated-pattern', ['pattern.accordion']],
  ['alert', 'dedicated-pattern', ['pattern.alert']],
  ['alertdialog', 'dedicated-pattern', ['pattern.alert-dialog']],
  ['breadcrumb', 'baseline-semantics', ['semantics.accessible-name', 'semantics.current-state', 'semantics.landmarks', 'semantics.link-purpose', 'semantics.native-elements']],
  ['button', 'composed', ['pattern.toggle-button', 'semantics.accessible-name', 'semantics.disabled-readonly', 'semantics.focus.visible', 'semantics.keyboard', 'semantics.name-role-value', 'semantics.native-elements', 'semantics.presentational-role', 'semantics.pressed-state', 'semantics.roles-states-properties', 'semantics.target-size']],
  ['carousel', 'dedicated-pattern', ['pattern.carousel']],
  ['checkbox', 'dedicated-pattern', ['pattern.checkbox']],
  ['combobox', 'dedicated-pattern', ['pattern.combobox']],
  ['dialog-modal', 'dedicated-pattern', ['pattern.dialog']],
  ['disclosure', 'dedicated-pattern', ['pattern.disclosure']],
  ['feed', 'dedicated-pattern', ['pattern.feed']],
  ['grid', 'dedicated-pattern', ['pattern.grid']],
  ['landmarks', 'baseline-semantics', ['semantics.landmarks', 'semantics.native-elements']],
  ['link', 'baseline-semantics', ['semantics.accessible-name', 'semantics.focus.visible', 'semantics.keyboard', 'semantics.link-purpose', 'semantics.name-role-value', 'semantics.native-elements', 'semantics.target-size']],
  ['listbox', 'dedicated-pattern', ['pattern.listbox']],
  ['menubar', 'dedicated-pattern', ['pattern.menu']],
  ['menu-button', 'dedicated-pattern', ['pattern.menu-button']],
  ['meter', 'dedicated-pattern', ['pattern.meter']],
  ['radio', 'dedicated-pattern', ['pattern.radio-group']],
  ['slider', 'dedicated-pattern', ['pattern.slider']],
  ['slider-multithumb', 'dedicated-pattern', ['pattern.slider']],
  ['spinbutton', 'dedicated-pattern', ['pattern.spinbutton']],
  ['switch', 'dedicated-pattern', ['pattern.switch']],
  ['table', 'baseline-semantics', ['semantics.collection-metadata', 'semantics.data-table', 'semantics.native-elements', 'semantics.sort-state']],
  ['tabs', 'dedicated-pattern', ['pattern.tabs']],
  ['toolbar', 'dedicated-pattern', ['pattern.toolbar']],
  ['tooltip', 'dedicated-pattern', ['pattern.tooltip']],
  ['treeview', 'dedicated-pattern', ['pattern.tree-view']],
  ['treegrid', 'dedicated-pattern', ['pattern.treegrid']],
  ['windowsplitter', 'dedicated-pattern', ['pattern.window-splitter']],
].map(([id, coverage, record_ids]) => ({ id, coverage, record_ids }));

const expectedApgPractices = [
  ['landmark-regions', ['semantics.landmarks', 'semantics.native-elements']],
  ['names-and-descriptions', ['semantics.accessible-description', 'semantics.accessible-name']],
  ['keyboard-interface', ['semantics.composite-focus', 'semantics.disabled-readonly', 'semantics.focus.visible', 'semantics.keyboard', 'semantics.selected-state']],
  ['grid-and-table-properties', ['semantics.collection-metadata', 'semantics.data-table', 'semantics.sort-state']],
  ['range-related-properties', ['semantics.range-value']],
  ['structural-roles', ['semantics.native-elements', 'semantics.presentational-role']],
  ['hiding-semantics', ['semantics.presentational-role']],
].map(([id, record_ids]) => ({ id, record_ids }));

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

test('APG coverage manifest maps all 30 patterns and all seven practices exactly', async () => {
  const data = await loadStandards();
  assert.deepEqual({
    version: data.apgCoverage.version,
    authority: data.apgCoverage.authority,
    patterns_url: data.apgCoverage.patterns_url,
    practices_url: data.apgCoverage.practices_url,
  }, {
    version: 1,
    authority: 'aria-apg',
    patterns_url: 'https://www.w3.org/WAI/ARIA/apg/patterns/',
    practices_url: 'https://www.w3.org/WAI/ARIA/apg/practices/',
  });
  assert.deepEqual(
    data.apgCoverage.patterns.map(({ id, coverage }) => ({ id, coverage })),
    expectedApgPatterns.map(({ id, coverage }) => ({ id, coverage })),
  );
  assert.deepEqual(data.apgCoverage.practices.map(({ id }) => id), expectedApgPractices.map(({ id }) => id));
  const patternsById = new Map(data.apgCoverage.patterns.map((entry) => [entry.id, entry]));
  const practicesById = new Map(data.apgCoverage.practices.map((entry) => [entry.id, entry]));
  for (const { id, record_ids } of expectedApgPatterns) {
    for (const recordId of record_ids) assert.ok(patternsById.get(id).record_ids.includes(recordId), `${id} must map ${recordId}`);
  }
  for (const { id, record_ids } of expectedApgPractices) {
    for (const recordId of record_ids) assert.ok(practicesById.get(id).record_ids.includes(recordId), `${id} must map ${recordId}`);
  }
  assert.deepEqual(
    Object.fromEntries(['baseline-semantics', 'composed', 'dedicated-pattern'].map((coverage) => [
      coverage,
      data.apgCoverage.patterns.filter((entry) => entry.coverage === coverage).length,
    ])),
    { 'baseline-semantics': 4, composed: 1, 'dedicated-pattern': 25 },
  );
  for (const entry of [...data.apgCoverage.patterns, ...data.apgCoverage.practices]) {
    assert.deepEqual(entry.record_ids, [...new Set(entry.record_ids)].sort(), `${entry.id} record_ids must be sorted and unique`);
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

  for (const id of Object.keys(apgPatternRefs)) {
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

test('new APG patterns encode native-first semantics and complete focus, keyboard, and state behavior', async () => {
  const data = await loadStandards();
  const byId = new Map(data.patterns.map((pattern) => [pattern.id, pattern]));
  const expectations = {
    'pattern.feed': {
      requires: ['semantics.accessible-description', 'semantics.busy-state', 'semantics.collection-metadata'],
      decisions: ['article_description', 'focus_target', 'keyboard_interface', 'loading_boundary', 'nested_feed_navigation', 'set_size_source', 'virtualization'],
      details: [/excludes static lists/, /Page Down moves to the next article/, /Control plus End/, /aria-posinset/, /aria-setsize/, /aria-busy true/, /virtualization never strands/],
    },
    'pattern.grid': {
      requires: ['semantics.busy-state', 'semantics.collection-metadata', 'semantics.composite-focus', 'semantics.disabled-readonly', 'semantics.sort-state'],
      decisions: ['cell_focus_target', 'disabled_focusability', 'edit_mode', 'focus_strategy', 'grid_kind', 'home_end_scope', 'page_navigation_step', 'selection_model', 'sort_model', 'tab_behavior', 'virtualization', 'wrap_navigation'],
      details: [/native table for static tabular information/, /one composite tab stop/, /Right and Left move one cell/, /Control plus Home and End/, /Page Up and Page Down/, /Enter or F2 enters/, /Escape restores grid navigation/, /aria-sort only on the currently sorted/, /retain the active cell while virtualizing/],
    },
    'pattern.meter': {
      requires: ['semantics.native-elements', 'semantics.presentational-role', 'semantics.range-value'],
      decisions: ['host_element', 'range_bounds', 'thresholds', 'value_source', 'value_text'],
      details: [/native meter element/, /role meter/, /current, minimum, and maximum/, /read-only and out of the page tab sequence/, /progressbar for task completion/, /descendants of role meter are presentational/],
    },
    'pattern.treegrid': {
      requires: ['semantics.busy-state', 'semantics.collection-metadata', 'semantics.composite-focus', 'semantics.disabled-readonly', 'semantics.expanded-state', 'semantics.hidden-inert', 'semantics.sort-state'],
      decisions: ['cell_focus_target', 'disabled_focusability', 'edit_mode', 'focus_mode', 'focus_strategy', 'hierarchy_cell', 'page_navigation_step', 'selection_model', 'sort_model', 'tab_behavior', 'virtualization'],
      details: [/excludes flat grids, static tables, and non-tabular trees/, /aria-expanded only to a parent row/, /rows-first, cells-first, or cells-only focus/, /Right Arrow expands a collapsed parent/, /Left Arrow collapses/, /Enter or F2 interaction mode/, /single-select treegrid/, /multi-select treegrid/, /move focus to the parent row or hierarchy cell before collapsing/],
    },
    'pattern.window-splitter': {
      requires: ['semantics.dragging-alternative', 'semantics.hidden-inert', 'semantics.presentational-role', 'semantics.range-value'],
      decisions: ['collapse_behavior', 'disabled_focusability', 'f6_pane_cycle', 'fixed_or_variable', 'home_end', 'orientation', 'pane_navigation_order', 'primary_pane', 'range_bounds', 'step', 'value_text'],
      details: [/static native separator when no resizing behavior exists/, /focusable separator named for the primary pane/, /aria-controls/, /vertical splitter, Left and Right Arrow/, /horizontal splitter, Up and Down Arrow/, /Home and End/, /Enter collapses/, /F6 cycles/, /fixed two-position splitter, omit continuous arrow-key adjustment/],
    },
    'pattern.toggle-button': {
      requires: ['semantics.disabled-readonly', 'semantics.presentational-role', 'semantics.pressed-state'],
      decisions: ['disabled_focusability', 'host_element', 'mixed_state_meaning', 'post_activation_focus', 'pressed_state_cycle', 'state_source'],
      details: [/native button element/, /aria-pressed false or true/, /allow mixed only when/, /accessible label stable/, /Space and Enter activate/, /exactly once per user action/, /switch whose binary setting/, /checkbox that contributes a form value/],
    },
  };

  for (const [id, expectation] of Object.entries(expectations)) {
    const pattern = byId.get(id);
    assert.ok(pattern, `missing ${id}`);
    assert.deepEqual(pattern.activation, { contains: { fact: 'component.accessibility_pattern_ids', value: id } });
    assert.deepEqual(pattern.product_decisions, expectation.decisions);
    assert.deepEqual(pattern.evidence_routes, ['unit', 'axe', 'e2e', 'human']);
    for (const semanticId of expectation.requires) assert.ok(pattern.requires.includes(semanticId), `${id} must require ${semanticId}`);
    const contractText = `${pattern.scope}\n${pattern.behavior.join('\n')}`;
    for (const detail of expectation.details) assert.match(contractText, detail, `${id} omits ${detail}`);
  }
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

test('new APG UI mappings are enum-gated, retain native baselines, and resolve all six patterns', async () => {
  const data = await loadStandards();
  const byUiPatternId = new Map(data.uiDesignBrainBindings.bindings.map((binding) => [binding.ui_pattern_id, binding]));
  assert.deepEqual(
    Object.fromEntries(['component.collection_model', 'component.separator_model', 'component.table_model', 'component.toggle_model', 'component.value_display_model'].map((id) => [id, data.facts.facts[id]])),
    {
      'component.collection_model': { type: 'string', values: ['feed', 'static-list'] },
      'component.separator_model': { type: 'string', values: ['static', 'window-splitter'] },
      'component.table_model': { type: 'string', values: ['data-table', 'grid', 'treegrid'] },
      'component.toggle_model': { type: 'string', values: ['button', 'checkbox', 'switch'] },
      'component.value_display_model': { type: 'string', values: ['meter', 'static'] },
    },
  );
  assert.deepEqual(byUiPatternId.get('list'), {
    ui_pattern_id: 'list',
    classification: 'candidate',
    baseline_semantic_ids: ['semantics.native-elements'],
    discriminator_facts: ['component.collection_model'],
    candidates: [{ pattern_id: 'pattern.feed', when: { equals: { fact: 'component.collection_model', value: 'feed' } } }],
  });
  assert.deepEqual(byUiPatternId.get('separator'), {
    ui_pattern_id: 'separator',
    classification: 'candidate',
    baseline_semantic_ids: ['semantics.native-elements'],
    discriminator_facts: ['component.separator_model'],
    candidates: [{ pattern_id: 'pattern.window-splitter', when: { equals: { fact: 'component.separator_model', value: 'window-splitter' } } }],
  });
  assert.deepEqual(byUiPatternId.get('stat'), {
    ui_pattern_id: 'stat',
    classification: 'candidate',
    baseline_semantic_ids: ['semantics.native-elements'],
    discriminator_facts: ['component.value_display_model'],
    candidates: [{ pattern_id: 'pattern.meter', when: { equals: { fact: 'component.value_display_model', value: 'meter' } } }],
  });
  assert.deepEqual(byUiPatternId.get('table'), {
    ui_pattern_id: 'table',
    classification: 'candidate',
    baseline_semantic_ids: ['semantics.collection-metadata', 'semantics.data-table', 'semantics.native-elements', 'semantics.sort-state'],
    discriminator_facts: ['component.table_model'],
    candidates: [
      { pattern_id: 'pattern.grid', when: { equals: { fact: 'component.table_model', value: 'grid' } } },
      { pattern_id: 'pattern.treegrid', when: { equals: { fact: 'component.table_model', value: 'treegrid' } } },
    ],
  });

  const uiPatternIds = ['list', 'separator', 'stat', 'table', 'toggle'];
  const unresolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, { 'component.ui_pattern_ids': uiPatternIds });
  assert.deepEqual(unresolved.pattern_ids, []);
  assert.deepEqual(unresolved.semantic_ids, ['semantics.collection-metadata', 'semantics.data-table', 'semantics.native-elements', 'semantics.sort-state']);
  assert.deepEqual(
    unresolved.candidate_evaluations.map(({ pattern_id, trigger_state, resolution_state, missing_facts }) => ({ pattern_id, trigger_state, resolution_state, missing_facts })),
    [
      ['pattern.feed', 'component.collection_model'],
      ['pattern.window-splitter', 'component.separator_model'],
      ['pattern.meter', 'component.value_display_model'],
      ['pattern.grid', 'component.table_model'],
      ['pattern.treegrid', 'component.table_model'],
      ['pattern.checkbox', 'component.toggle_model'],
      ['pattern.field', 'component.toggle_model'],
      ['pattern.switch', 'component.toggle_model'],
      ['pattern.toggle-button', 'component.toggle_model'],
    ].map(([pattern_id, fact]) => ({ pattern_id, trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: [fact] })),
  );

  const resolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': uiPatternIds,
    'component.collection_model': 'feed',
    'component.separator_model': 'window-splitter',
    'component.table_model': 'grid',
    'component.toggle_model': 'button',
    'component.value_display_model': 'meter',
  });
  assert.deepEqual(resolved.pattern_ids, ['pattern.feed', 'pattern.grid', 'pattern.meter', 'pattern.toggle-button', 'pattern.window-splitter']);
  for (const patternId of ['pattern.feed', 'pattern.grid', 'pattern.meter', 'pattern.toggle-button', 'pattern.window-splitter']) {
    assert.equal(resolved.candidate_evaluations.find(({ pattern_id }) => pattern_id === patternId).resolution_state, 'resolved');
  }

  const treegrid = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['table', 'toggle'],
    'component.table_model': 'treegrid',
    'component.toggle_model': 'switch',
  });
  assert.deepEqual(treegrid.pattern_ids, ['pattern.field', 'pattern.switch', 'pattern.treegrid']);

  const checkbox = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': uiPatternIds,
    'component.collection_model': 'static-list',
    'component.separator_model': 'static',
    'component.table_model': 'data-table',
    'component.toggle_model': 'checkbox',
    'component.value_display_model': 'static',
  });
  assert.deepEqual(checkbox.pattern_ids, ['pattern.checkbox', 'pattern.field']);
  assert.deepEqual(
    checkbox.candidate_evaluations.filter(({ ui_pattern_id }) => ui_pattern_id === 'toggle').map(({ pattern_id, resolution_state }) => [pattern_id, resolution_state]),
    [['pattern.checkbox', 'resolved'], ['pattern.field', 'resolved'], ['pattern.switch', 'skipped'], ['pattern.toggle-button', 'skipped']],
  );
});

test('checkbox, switch, toggle-button, alert-dialog, and toolbar bindings require exact discriminators', async () => {
  const data = await loadStandards();
  const byUiPatternId = new Map(data.uiDesignBrainBindings.bindings.map((binding) => [binding.ui_pattern_id, binding]));

  assert.deepEqual(byUiPatternId.get('toggle'), {
    ui_pattern_id: 'toggle',
    classification: 'candidate',
    discriminator_facts: ['component.toggle_model'],
    candidates: [
      { pattern_id: 'pattern.checkbox', when: { equals: { fact: 'component.toggle_model', value: 'checkbox' } } },
      { pattern_id: 'pattern.field', when: { any: [{ equals: { fact: 'component.toggle_model', value: 'checkbox' } }, { equals: { fact: 'component.toggle_model', value: 'switch' } }] } },
      { pattern_id: 'pattern.switch', when: { equals: { fact: 'component.toggle_model', value: 'switch' } } },
      { pattern_id: 'pattern.toggle-button', when: { equals: { fact: 'component.toggle_model', value: 'button' } } },
    ],
  });
  for (const [model, patternIds] of [
    ['button', ['pattern.toggle-button']],
    ['checkbox', ['pattern.checkbox', 'pattern.field']],
    ['switch', ['pattern.field', 'pattern.switch']],
  ]) {
    const variant = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
      'component.ui_pattern_ids': ['toggle'],
      'component.toggle_model': model,
    });
    assert.deepEqual(variant.pattern_ids, patternIds, `toggle ${model} must resolve exactly its declared contracts`);
  }
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
  assert.deepEqual(unresolved.pattern_ids, ['pattern.dialog']);
  assert.deepEqual(unresolved.semantic_ids, ['semantics.accessible-name', 'semantics.focus.visible', 'semantics.keyboard', 'semantics.native-elements']);
  assert.deepEqual(
    unresolved.candidate_evaluations.map(({ pattern_id, trigger_state, resolution_state, missing_facts }) => ({ pattern_id, trigger_state, resolution_state, missing_facts })),
    [
      { pattern_id: 'pattern.toolbar', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.control_group_model'] },
      { pattern_id: 'pattern.alert-dialog', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.dialog_purpose'] },
      { pattern_id: 'pattern.checkbox', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.toggle_model'] },
      { pattern_id: 'pattern.field', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.toggle_model'] },
      { pattern_id: 'pattern.switch', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.toggle_model'] },
      { pattern_id: 'pattern.toggle-button', trigger_state: 'candidate', resolution_state: 'needs_input', missing_facts: ['component.toggle_model'] },
    ],
  );

  const resolved = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['button-group', 'modal', 'toggle'],
    'component.control_group_model': 'toolbar',
    'component.dialog_purpose': 'urgent-response',
    'component.toggle_model': 'switch',
  });
  assert.deepEqual(resolved.pattern_ids, ['pattern.alert-dialog', 'pattern.dialog', 'pattern.field', 'pattern.switch', 'pattern.toolbar']);
  assert.deepEqual(
    resolved.candidate_evaluations.map(({ pattern_id, resolution_state }) => [pattern_id, resolution_state]),
    [['pattern.toolbar', 'resolved'], ['pattern.alert-dialog', 'resolved'], ['pattern.checkbox', 'skipped'], ['pattern.field', 'resolved'], ['pattern.switch', 'resolved'], ['pattern.toggle-button', 'skipped']],
  );

  const toggleButton = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['toggle'],
    'component.toggle_model': 'button',
  });
  assert.deepEqual(toggleButton.pattern_ids, ['pattern.toggle-button']);

  const checkbox = resolveUiPatternBindings(data.uiDesignBrainBindings, data.facts, {
    'component.ui_pattern_ids': ['button-group', 'modal', 'toggle'],
    'component.control_group_model': 'plain-group',
    'component.dialog_purpose': 'general',
    'component.toggle_model': 'checkbox',
  });
  assert.deepEqual(checkbox.pattern_ids, ['pattern.checkbox', 'pattern.dialog', 'pattern.field']);
  assert.deepEqual(
    checkbox.candidate_evaluations.map(({ pattern_id, resolution_state }) => [pattern_id, resolution_state]),
    [['pattern.toolbar', 'skipped'], ['pattern.alert-dialog', 'skipped'], ['pattern.checkbox', 'resolved'], ['pattern.field', 'resolved'], ['pattern.switch', 'skipped'], ['pattern.toggle-button', 'skipped']],
  );
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
