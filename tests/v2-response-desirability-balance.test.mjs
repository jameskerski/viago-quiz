import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rule = JSON.parse(fs.readFileSync(new URL('../data/v2-governance/response-desirability-balance-rule.json', import.meta.url)));
const amendment = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-desirability-balance-revisions.json', import.meta.url)));
const polished = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-polished-candidates.json', import.meta.url)));
const expectedIds = ['C01-L-Y-02', 'C01-S-01', 'C01-S-07'];
const colors = ['red', 'blue', 'yellow', 'green'];

test('response desirability balance is a permanent OWNER-governed item-quality rule', () => {
  assert.equal(rule.rule_id, 'VIAGO_RESPONSE_DESIRABILITY_BALANCE_V1');
  assert.equal(rule.status, 'OWNER_APPROVED_FROZEN');
  assert.equal(rule.owner_approval.approved, true);
  assert.equal(rule.runtime_authority, false);
  assert.ok(rule.single_select_test.length >= 4);
  assert.ok(rule.likert_test.length >= 3);
  assert.match(rule.rule, /competent, ethical, mature, socially acceptable, and useful/);
  assert.match(rule.relationship_to_color_model, /does not modify VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0/);
});

test('amendment revises exactly the requested three candidates and leaves 13 unchanged', () => {
  assert.equal(amendment.revision_count, 3);
  assert.equal(amendment.unchanged_candidate_count, 13);
  assert.deepEqual(amendment.revisions.map((item) => item.proposal_id).sort(), [...expectedIds].sort());
  assert.ok(amendment.revisions.every((item) => polished.candidates.some((candidate) => candidate.proposal_id === item.proposal_id)));
  assert.ok(amendment.revisions.every((item) => item.desirability_balance.length >= 100));
});

test('single-select revisions provide one useful, non-pejorative option per color', () => {
  const singles = amendment.revisions.filter((item) => item.question_type === 'SINGLE_SELECT');
  assert.equal(singles.length, 2);
  for (const item of singles) {
    assert.deepEqual(item.options.map((option) => option.mapping).sort(), [...colors].sort());
    assert.ok(item.options.every((option) => option.label.length >= 50));
    const labels = item.options.map((option) => option.label).join(' ').toLowerCase();
    assert.doesNotMatch(labels, /nobody|excluded|safest|right people|selfish|inconsiderate|irresponsible/);
  }
  assert.match(singles.find((item) => item.proposal_id === 'C01-S-01').options.find((option) => option.mapping === 'blue').label, /possibilities/);
});

test('Yellow Likert revision presents two reasonable timing priorities', () => {
  const yellow = amendment.revisions.find((item) => item.proposal_id === 'C01-L-Y-02');
  assert.equal(yellow.question_type, 'LIKERT');
  assert.equal(yellow.intended_mapping, 'yellow');
  assert.match(yellow.question, /delaying it to hear/);
  assert.match(yellow.question, /moving ahead and gathering their feedback afterward/);
});

test('amendment remains non-runtime', () => {
  assert.equal(amendment.status, 'OWNER_REVIEW_REQUIRED_NOT_RUNTIME_ELIGIBLE');
  assert.deepEqual(amendment.runtime_impact, {
    active_questions_changed: 0,
    questions_activated: 0,
    scoring_changed: false,
    selector_changed: false,
    cohort_02_generated: false,
  });
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /cohort-01-desirability-balance-revisions|response-desirability-balance-rule/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
