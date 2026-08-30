import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const review = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-approved-model-review.json', import.meta.url)));
const cohort = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01.json', import.meta.url)));
const model = JSON.parse(fs.readFileSync(new URL('../data/v2-governance/viago-behavioral-color-model-v1.0.json', import.meta.url)));
const dispositions = ['KEEP', 'REVISE', 'REJECT', 'NEEDS_OWNER_JUDGMENT'];

test('reassessment uses the frozen OWNER-approved model and covers all 24 proposals', () => {
  assert.equal(model.status, 'OWNER_APPROVED_FROZEN');
  assert.equal(review.governing_model_id, model.model_id);
  assert.equal(review.governing_model_version, model.semantic_version);
  assert.equal(review.governing_model_status, model.status);
  assert.equal(review.reviews.length, 24);
  assert.equal(new Set(review.reviews.map((item) => item.proposal_id)).size, 24);
  assert.deepEqual(review.reviews.map((item) => item.proposal_id).sort(), cohort.proposals.map((item) => item.proposal_id).sort());
});

test('every proposal has one controlled decision and complete OWNER-review reasoning', () => {
  for (const item of review.reviews) {
    assert.ok(dispositions.includes(item.disposition));
    assert.ok(item.model_basis.length > 0, `${item.proposal_id} missing model basis`);
    assert.ok(item.evidence_classes.length > 0, `${item.proposal_id} missing evidence classes`);
    assert.ok(item.evidence_classes.every((classification) => model.evidence_classes.includes(classification)));
    assert.ok(item.diagnostic.length >= 80, `${item.proposal_id} diagnostic too short`);
    assert.ok(item.remaining_risk.length >= 25, `${item.proposal_id} missing remaining risk`);
    if (item.disposition === 'REVISE') assert.ok(item.revised_wording || item.revised_options, `${item.proposal_id} revision missing`);
    if (item.disposition === 'REJECT') assert.equal(item.revised_wording, null, `${item.proposal_id} rejected wording must remain null`);
  }
});

test('recorded summary exactly matches decisions and supported inference does not silently become authority', () => {
  const actual = Object.fromEntries(dispositions.map((disposition) => [disposition, review.reviews.filter((item) => item.disposition === disposition).length]));
  assert.deepEqual(actual, review.summary);
  assert.equal(review.summary.KEEP, 5);
  assert.equal(review.summary.REVISE, 10);
  assert.equal(review.summary.REJECT, 8);
  assert.equal(review.summary.NEEDS_OWNER_JUDGMENT, 1);
  const changeItem = review.reviews.find((item) => item.proposal_id === 'C01-S-03');
  assert.equal(changeItem.disposition, 'NEEDS_OWNER_JUDGMENT');
  assert.ok(changeItem.evidence_classes.includes('SUPPORTED_INFERENCE'));
});

test('Yellow learned behavior and universal virtues fail closed', () => {
  assert.equal(review.reviews.find((item) => item.proposal_id === 'C01-L-Y-01').disposition, 'REJECT');
  assert.equal(review.reviews.find((item) => item.proposal_id === 'C01-L-Y-03').disposition, 'REJECT');
  assert.match(review.decision_rule, /universal virtue/);
  assert.match(review.decision_rule, /learned maturity/);
});

test('revised review remains isolated from application runtime', () => {
  assert.equal(review.status, 'OWNER_REVIEW_REQUIRED_NOT_RUNTIME_AUTHORITY');
  assert.deepEqual(review.runtime_impact, {
    questions_activated: 0,
    questions_modified: 0,
    scoring_changed: false,
    selector_changed: false,
    cohort_02_generated: false,
  });
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /cohort-01-approved-model-review/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
