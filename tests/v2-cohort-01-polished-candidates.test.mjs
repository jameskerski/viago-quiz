import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const polished = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-polished-candidates.json', import.meta.url)));
const baseline = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-approved-model-review.json', import.meta.url)));
const cohort = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01.json', import.meta.url)));
const colors = ['red', 'blue', 'yellow', 'green'];

test('polished set contains exactly the authorized 16 candidates', () => {
  assert.equal(polished.status, 'OWNER_REVIEW_REQUIRED_NOT_RUNTIME_ELIGIBLE');
  assert.equal(polished.candidate_count, 16);
  assert.equal(polished.candidates.length, 16);
  assert.equal(new Set(polished.candidates.map((item) => item.proposal_id)).size, 16);
  assert.deepEqual(polished.candidate_composition, {KEEP: 5, REVISE: 10, REVISED_CONTINUE_RESEARCH: 1});
  assert.deepEqual(
    Object.fromEntries(['KEEP', 'REVISE', 'REVISED_CONTINUE_RESEARCH'].map((origin) => [origin, polished.candidates.filter((item) => item.review_origin === origin).length])),
    polished.candidate_composition,
  );
});

test('KEEP and revised wording remain traceable to the accepted reassessment', () => {
  const sourceById = new Map(cohort.proposals.map((item) => [item.proposal_id, item]));
  const reviewById = new Map(baseline.reviews.map((item) => [item.proposal_id, item]));
  for (const candidate of polished.candidates) {
    assert.ok(sourceById.has(candidate.proposal_id));
    assert.ok(reviewById.has(candidate.proposal_id));
    if (candidate.review_origin === 'KEEP') assert.equal(candidate.question, sourceById.get(candidate.proposal_id).wording);
    if (candidate.review_origin === 'REVISE') assert.equal(candidate.question, reviewById.get(candidate.proposal_id).revised_wording);
    assert.ok(candidate.distinction.length >= 45);
  }
});

test('single-select candidates expose exactly one plain-language option per color', () => {
  const singles = polished.candidates.filter((item) => item.question_type === 'SINGLE_SELECT');
  assert.equal(singles.length, 4);
  for (const item of singles) {
    assert.equal(item.options.length, 4);
    assert.deepEqual(item.options.map((option) => option.mapping).sort(), [...colors].sort());
    assert.ok(item.options.every((option) => option.label.length >= 35));
  }
});

test('C01-S-03 is research-only and motives match the OWNER decision', () => {
  const item = polished.candidates.find((candidate) => candidate.proposal_id === 'C01-S-03');
  assert.equal(item.review_origin, 'REVISED_CONTINUE_RESEARCH');
  assert.match(item.intended_mapping, /research-only/);
  assert.match(item.distinction, /progress, possibility, people\/commitments, or restored clarity/);
  assert.equal(polished.owner_decision.c01_s_03.new_disposition, 'REVISE');
  assert.equal(polished.owner_decision.c01_s_03.research_status, 'CONTINUE_RESEARCH');
  assert.match(polished.owner_decision.c01_s_03.authority_limit, /not independent or general scoring doctrine/i);
});

test('all eight rejected proposals remain preserved and excluded', () => {
  const rejected = baseline.reviews.filter((item) => item.disposition === 'REJECT').map((item) => item.proposal_id).sort();
  assert.equal(rejected.length, 8);
  assert.equal(polished.rejected_audit_history.preserved, true);
  assert.deepEqual([...polished.rejected_audit_history.proposal_ids].sort(), rejected);
  const candidateIds = new Set(polished.candidates.map((item) => item.proposal_id));
  assert.ok(rejected.every((id) => !candidateIds.has(id)));
});

test('candidate package remains isolated from runtime', () => {
  assert.deepEqual(polished.runtime_impact, {
    active_questions_changed: 0,
    questions_activated: 0,
    scoring_changed: false,
    selector_changed: false,
    cohort_02_generated: false,
  });
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /cohort-01-polished-candidates/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
