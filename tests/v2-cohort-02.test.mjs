import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cohort = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-02.json', import.meta.url)));
const audit = JSON.parse(fs.readFileSync(new URL('../data/v2-audit/current-question-audit.json', import.meta.url)));
const cohort01 = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-polished-candidates.json', import.meta.url)));
const amendment01 = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-desirability-balance-revisions.json', import.meta.url)));
const standard = JSON.parse(fs.readFileSync(new URL('../data/v2-governance/cohort-01-question-development-standard.json', import.meta.url)));
const rule = JSON.parse(fs.readFileSync(new URL('../data/v2-governance/response-desirability-balance-rule.json', import.meta.url)));
const colors = ['red', 'blue', 'yellow', 'green'];

test('Cohort 01 and response desirability are frozen OWNER-approved standards', () => {
  assert.equal(standard.status, 'OWNER_APPROVED_FROZEN');
  assert.equal(standard.candidate_count, 16);
  assert.equal(standard.production_activation_authorized, false);
  assert.equal(rule.status, 'OWNER_APPROVED_FROZEN');
  assert.equal(rule.owner_approval.approved, true);
});

test('Cohort 02 is a small review-only set weighted toward single-select', () => {
  assert.equal(cohort.status, 'OWNER_REVIEW_ONLY_NOT_RUNTIME_ELIGIBLE');
  assert.equal(cohort.candidate_count, 24);
  assert.equal(cohort.candidates.length, 24);
  assert.deepEqual(cohort.composition, {SINGLE_SELECT: 16, LIKERT: 8});
  assert.equal(cohort.candidates.filter((item) => item.question_type === 'SINGLE_SELECT').length, 16);
  assert.equal(cohort.candidates.filter((item) => item.question_type === 'LIKERT').length, 8);
  assert.equal(new Set(cohort.candidates.map((item) => item.proposal_id)).size, 24);
});

test('every situational single-select has one balanced plain-language option per color', () => {
  for (const item of cohort.candidates.filter((candidate) => candidate.question_type === 'SINGLE_SELECT')) {
    assert.equal(item.options.length, 4);
    assert.deepEqual(item.options.map((option) => option.mapping).sort(), [...colors].sort());
    const lengths = item.options.map((option) => option.label.trim().split(/\s+/).length);
    assert.ok(Math.max(...lengths) - Math.min(...lengths) <= 5, `${item.proposal_id} option-length imbalance`);
    assert.ok(item.options.every((option) => option.label.length >= 40 && option.label.length <= 105));
    const labels = item.options.map((option) => option.label).join(' ').toLowerCase();
    assert.doesNotMatch(labels, /nobody|excluded|safest|right answer|correct person|selfish|inconsiderate|irresponsible/);
  }
});

test('Likert expansion is color-balanced and states a preference or tradeoff', () => {
  const likert = cohort.candidates.filter((item) => item.question_type === 'LIKERT');
  for (const color of colors) assert.equal(likert.filter((item) => item.intended_mapping === color).length, 2);
  assert.ok(likert.every((item) => item.question.length >= 70));
  assert.ok(likert.every((item) => item.distinction.length >= 55));
});

test('semantic families are unique and contexts expand beyond personal preference', () => {
  assert.equal(new Set(cohort.candidates.map((item) => item.semantic_family)).size, 24);
  assert.ok(new Set(cohort.candidates.map((item) => item.context)).size >= 14);
  assert.ok(cohort.expansion_rationale.thin_domains_addressed.includes('leadership-influence'));
  assert.ok(cohort.expansion_rationale.thin_domains_addressed.includes('rules-process'));
  assert.ok(cohort.expansion_rationale.thin_domains_addressed.includes('detail-accuracy'));
  assert.ok(cohort.expansion_rationale.context_expansion.includes('travel'));
  assert.ok(cohort.expansion_rationale.context_expansion.includes('community'));
});

test('Cohort 02 wording is original across active corpus and resolved Cohort 01 standard', () => {
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const existing = new Set(audit.questions.map((item) => normalize(item.english)));
  const resolved01 = new Map(cohort01.candidates.map((item) => [item.proposal_id, item.question]));
  for (const revision of amendment01.revisions) resolved01.set(revision.proposal_id, revision.question);
  for (const wording of resolved01.values()) existing.add(normalize(wording));
  const proposed = cohort.candidates.map((item) => normalize(item.question));
  assert.equal(new Set(proposed).size, 24);
  assert.ok(proposed.every((wording) => !existing.has(wording)));
});

test('Cohort 02 remains isolated from runtime and authorizes no mutations', () => {
  assert.deepEqual(cohort.runtime_impact, {questions_activated: 0, active_questions_changed: 0, scoring_changed: false, selector_changed: false});
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /data\/v2-proposals\/cohort-02|cohort-02\.json/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
