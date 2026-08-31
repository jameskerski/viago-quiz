import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const results = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-research/shadow-study-results.json'), 'utf8'));
const protocol = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-research/human-validation-protocol.json'), 'utf8'));

test('shadow study uses immutable evidence and excludes rollback-only attempts', () => {
  assert.equal(results.status, 'NON_PRODUCTION_SHADOW_STUDY_COMPLETE');
  assert.equal(results.generated_at, null);
  assert.equal(results.source.archive_only_attempts_excluded, 6);
  assert.equal(results.population.archived_attempts_after_archive_only_exclusion, 1972);
  assert.equal(results.population.attempts_with_expected_current_50_question_shape, 1940);
  assert.equal(results.population.completed_attempts_with_50_unique_assigned_answers, 1259);
  assert.ok(Object.values(results.source.source_checks).every((item) => item.verified));
});

test('current and Design B opportunity claims are bounded to supported evidence', () => {
  assert.deepEqual(results.current_historical_evidence.opportunity_shape, {
    single: 25,
    likert: { red: 6, blue: 6, yellow: 6, green: 7 },
    varies_by_random_selection: false,
  });
  assert.equal(results.green_opportunity_sensitivity.structural_difference.max_points_advantage, 4);
  assert.equal(results.green_opportunity_sensitivity.structural_difference.neutral_uniform_expected_advantage, 2);
  assert.equal(results.design_b_capped.within_attempt.semantic_family_collisions.max, 0);
  assert.equal(results.design_b_capped.within_attempt.weak_legacy_questions.max, 5);
});

test('human protocol remains proposed, paired, and non-clinical', () => {
  assert.equal(protocol.status, 'PROPOSED_NOT_LAUNCHED_OWNER_APPROVAL_REQUIRED');
  assert.equal(protocol.design.type, 'randomized paired crossover');
  assert.equal(protocol.design.answer_handling.includes('Never project answers'), true);
  assert.equal(protocol.analysis_governance.deployment_authority, false);
  assert.equal(protocol.analysis_governance.contact_authority, false);
  assert.ok(protocol.analysis_governance.claims_not_authorized.includes('clinical validity'));
});

test('shadow artifacts remain isolated from application runtime', () => {
  const runtimeFiles = [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))];
  for (const file of runtimeFiles) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /shadow-study-results|human-validation-protocol|run-shadow-study/);
  }
  assert.equal(results.production_impact, 'NONE');
  assert.equal(protocol.production_impact, 'NONE');
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}
