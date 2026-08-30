import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const review = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01-color-model-review.json', import.meta.url)));
const cohort = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01.json', import.meta.url)));
const colors = ['red','blue','yellow','green'];
const dimensions = ['core_motivations','decision_style','communication_style','relationship_orientation','conflict_response','pressure_response','leadership_followership','change_approach','risk_approach','planning_execution','strengths','overextensions','confusion_zones','nonqualifiers'];

test('all four colors define every required behavioral dimension', () => {
  assert.deepEqual(Object.keys(review.color_definitions).sort(), [...colors].sort());
  for (const color of colors) for (const dimension of dimensions) assert.ok(review.color_definitions[color][dimension]?.length, `${color} missing ${dimension}`);
});

test('all 24 cohort proposals receive exactly one calibration disposition', () => {
  assert.equal(review.proposal_reviews.length, 24);
  assert.equal(new Set(review.proposal_reviews.map((item) => item.proposal_id)).size, 24);
  assert.deepEqual([...review.proposal_reviews.map((item) => item.proposal_id)].sort(), [...cohort.proposals.map((item) => item.proposal_id)].sort());
  for (const item of review.proposal_reviews) {
    assert.ok(['KEEP_AS_CANDIDATE','REVISE_AND_REVIEW','AMBIGUOUS_AFTER_REVISION','REJECT'].includes(item.disposition));
    assert.ok(item.why_this_color.length > 80);
    assert.ok(item.social_desirability_finding.length > 30);
    if (item.disposition === 'REVISE_AND_REVIEW') assert.ok(item.revised_wording || item.revised_options);
    if (item.disposition === 'REJECT') assert.equal(item.revised_wording, null);
  }
});

test('review remains proposal-only and isolated from application runtime', () => {
  assert.equal(review.status, 'OWNER_REVIEW_ONLY_NOT_RUNTIME_AUTHORITY');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /cohort-01-color-model-review|v2-color-model-foundation/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
