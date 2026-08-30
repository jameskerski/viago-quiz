import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cohort = JSON.parse(fs.readFileSync(new URL('../data/v2-proposals/cohort-01.json', import.meta.url)));
const audit = JSON.parse(fs.readFileSync(new URL('../data/v2-audit/current-question-audit.json', import.meta.url)));
const canonicalIds = new Set(audit.questions.map((question) => question.canonical_id));
const required = ['proposal_id','question_type','wording','intended_color','behavioral_domain','context','measurement_direction','intensity','semantic_family','need','closest_existing','difference','color_assignment_confidence','ambiguity_risk','social_desirability_risk','recommendation'];

test('cohort is explicitly review-only and contains 24 non-production proposal identities', () => {
  assert.equal(cohort.status, 'OWNER_REVIEW_ONLY_NOT_RUNTIME_AUTHORITY');
  assert.equal(cohort.governance.runtime_eligible, false);
  assert.equal(cohort.governance.production_uuid_assignment, false);
  assert.equal(cohort.proposals.length, 24);
  assert.equal(new Set(cohort.proposals.map((proposal) => proposal.proposal_id)).size, 24);
  assert.ok(cohort.proposals.every((proposal) => !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(proposal.proposal_id)));
});

test('every proposal has complete controlled review metadata and valid canonical comparisons', () => {
  for (const proposal of cohort.proposals) {
    for (const field of required) assert.ok(Object.hasOwn(proposal, field), `${proposal.proposal_id} missing ${field}`);
    assert.ok(['LIKERT','SINGLE_SELECT'].includes(proposal.question_type));
    assert.ok(['ADD_CANDIDATE','REVISE_BEFORE_CONSIDERATION','EXPERIMENTAL'].includes(proposal.recommendation));
    assert.ok(['HIGH','MODERATE','LOW','DISPUTED'].includes(proposal.color_assignment_confidence));
    assert.ok(['LOW','MODERATE','HIGH'].includes(proposal.ambiguity_risk));
    assert.ok(['LOW','MODERATE','HIGH'].includes(proposal.social_desirability_risk));
    assert.ok(proposal.closest_existing.every((id) => canonicalIds.has(id)), `${proposal.proposal_id} has an unknown canonical comparison`);
  }
});

test('single-select experiments have exactly one defensible option per color', () => {
  const singles = cohort.proposals.filter((proposal) => proposal.question_type === 'SINGLE_SELECT');
  assert.equal(singles.length, 8);
  for (const proposal of singles) {
    assert.equal(proposal.intended_color, 'multi-color');
    assert.equal(proposal.options.length, 4);
    assert.deepEqual([...proposal.options.map((option) => option.color)].sort(), ['blue','green','red','yellow']);
    assert.ok(proposal.options.every((option) => option.label.length >= 20));
  }
});

test('proposal wording is unique within the cohort and not an exact active-corpus duplicate', () => {
  const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const proposed = cohort.proposals.map((proposal) => normalize(proposal.wording));
  const active = new Set(audit.questions.map((question) => normalize(question.english)));
  assert.equal(new Set(proposed).size, proposed.length);
  assert.ok(proposed.every((wording) => !active.has(wording)));
});

test('proposal bank is architecturally isolated from application runtime imports', () => {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const runtimeFiles = [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))];
  for (const file of runtimeFiles) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /data\/v2-proposals|cohort-01\.json/);
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const child = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(child);
    else if (/\.(?:ts|tsx|js|mjs)$/.test(entry.name)) yield child;
  }
}
