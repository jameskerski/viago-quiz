import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const revisions = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-02-owner-revisions.json', import.meta.url)));
const cohort = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-02.json', import.meta.url)));
const contextRule = JSON.parse(fs.readFileSync(new URL('../data/v2-governance/context-diversity-rule.json', import.meta.url)));
const expectedRevisionIds = ['C02-S-01', 'C02-S-05', 'C02-S-12', 'C02-S-13', 'C02-L-Y-01'];
const acceptedIds = [
  'C02-S-02', 'C02-S-03', 'C02-S-04', 'C02-S-06', 'C02-S-07', 'C02-S-08', 'C02-S-09', 'C02-S-10', 'C02-S-11', 'C02-S-14', 'C02-S-15', 'C02-S-16',
  'C02-L-R-01', 'C02-L-R-02', 'C02-L-B-01', 'C02-L-B-02', 'C02-L-Y-02', 'C02-L-G-01', 'C02-L-G-02',
];
const colors = ['red', 'blue', 'yellow', 'green'];

test('revision package changes exactly five candidates and preserves the 19 accepted candidates', () => {
  assert.equal(revisions.revision_count, 5);
  assert.equal(revisions.accepted_unchanged_count, 19);
  assert.deepEqual(revisions.revisions.map((item) => item.proposal_id).sort(), [...expectedRevisionIds].sort());
  const cohortIds = new Set(cohort.candidates.map((item) => item.proposal_id));
  assert.ok([...expectedRevisionIds, ...acceptedIds].every((id) => cohortIds.has(id)));
  assert.equal(new Set([...expectedRevisionIds, ...acceptedIds]).size, 24);
});

test('four revised single-select items retain one balanced response per color', () => {
  const singles = revisions.revisions.filter((item) => item.question_type === 'SINGLE_SELECT');
  assert.equal(singles.length, 4);
  for (const item of singles) {
    assert.deepEqual(item.options.map((option) => option.mapping).sort(), [...colors].sort());
    const lengths = item.options.map((option) => option.label.split(/\s+/).length);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 5, `${item.proposal_id} option imbalance`);
    assert.ok(item.discriminator_and_balance.length >= 120);
  }
});

test('requested Yellow and Green distinctions are explicit without virtue loading', () => {
  const s01Yellow = revisions.revisions.find((item) => item.proposal_id === 'C02-S-01').options.find((option) => option.mapping === 'yellow').label;
  assert.match(s01Yellow, /connected to one another/);
  const s05Yellow = revisions.revisions.find((item) => item.proposal_id === 'C02-S-05').options.find((option) => option.mapping === 'yellow').label;
  assert.match(s05Yellow, /connection.*over time/);
  const s12Yellow = revisions.revisions.find((item) => item.proposal_id === 'C02-S-12').options.find((option) => option.mapping === 'yellow').label;
  assert.match(s12Yellow, /relationships and commitments/);
  assert.doesNotMatch(s12Yellow, /listen|feelings|weighing on/);
  const s13Green = revisions.revisions.find((item) => item.proposal_id === 'C02-S-13').options.find((option) => option.mapping === 'green').label;
  assert.match(s13Green, /understand properly/);
  assert.doesNotMatch(s13Green, /organize|productive|put.*order/);
});

test('rebuilt Yellow Likert gives two reasonable responses to friendship tension', () => {
  const item = revisions.revisions.find((candidate) => candidate.proposal_id === 'C02-L-Y-01');
  assert.equal(item.intended_mapping, 'yellow');
  assert.match(item.question, /either option could work/);
  assert.match(item.question, /let the tension fade afterward/);
  assert.doesNotMatch(item.question, /protect trust|rebuild trust/);
});

test('context diversity is permanent governance without rigid equal quotas', () => {
  assert.equal(contextRule.rule_id, 'VIAGO_CONTEXT_DIVERSITY_V1');
  assert.equal(contextRule.status, 'OWNER_APPROVED_ACTIVE');
  assert.equal(contextRule.runtime_authority, false);
  assert.match(contextRule.rule, /prevent work, business, team, or project scenarios from dominating/);
  assert.match(contextRule.rule, /without imposing rigid equal quotas/);
  assert.ok(contextRule.ordinary_life_contexts.length >= 12);
  assert.ok(contextRule.review_tests.some((item) => /distribution/.test(item)));
});

test('revisions remain review-only and later OWNER-approved Cohort 03 stays runtime-isolated', () => {
  assert.equal(revisions.status, 'OWNER_REVIEW_REQUIRED_NOT_RUNTIME_ELIGIBLE');
  assert.deepEqual(revisions.runtime_impact, {questions_activated: 0, active_questions_changed: 0, scoring_changed: false, selector_changed: false, cohort_03_generated: false});
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.equal(fs.existsSync(path.join(root, 'data/v2-proposals/cohort-03.json')), true);
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /cohort-02-owner-revisions|context-diversity-rule|cohort-03/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
