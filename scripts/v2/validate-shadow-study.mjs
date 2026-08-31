#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const results = JSON.parse(fs.readFileSync("data/v2-research/shadow-study-results.json", "utf8"));
const protocol = JSON.parse(fs.readFileSync("data/v2-research/human-validation-protocol.json", "utf8"));

assert.equal(results.status, "NON_PRODUCTION_SHADOW_STUDY_COMPLETE");
assert.equal(results.generated_at, null);
assert.equal(results.production_impact, "NONE");
assert.equal(results.source.archive_only_attempts_excluded, 6);
assert.ok(Object.values(results.source.source_checks).every((item) => item.verified));
assert.equal(results.population.archived_attempts_after_archive_only_exclusion, 1972);
assert.equal(results.population.attempts_with_expected_current_50_question_shape, 1940);
assert.equal(results.population.completed_attempts_with_50_unique_assigned_answers, 1259);

assert.equal(results.current_historical_evidence.opportunity_shape.varies_by_random_selection, false);
assert.equal(results.current_historical_evidence.completed_results.exact_top_score_tie_count, 25);
assert.equal(results.current_historical_evidence.completed_results.near_tie_margin_lte_4_count, 218);
assert.equal(results.green_opportunity_sensitivity.structural_difference.max_points_advantage, 4);
assert.equal(results.green_opportunity_sensitivity.structural_difference.neutral_uniform_expected_advantage, 2);
assert.equal(results.green_opportunity_sensitivity.simulation_only_green_six_sevenths_score_scaling.winner_change_count, 47);
assert.equal(results.green_opportunity_sensitivity.simulation_only_green_six_sevenths_score_scaling.winner_changes_among_near_ties, 47);

assert.equal(results.weak_legacy_evidence.attempts_over_design_b_cap_pct, 100);
assert.equal(results.design_b_capped.within_attempt.weak_legacy_questions.max, 5);
assert.equal(results.design_b_capped.within_attempt.semantic_family_collisions.max, 0);
assert.ok(results.design_b_capped.within_attempt.unique_domains.min >= 12);
assert.ok(results.design_b_capped.within_attempt.unique_contexts.min >= 8);
assert.ok(results.design_b_capped.pairwise_overlap.total.mean < results.current_historical_evidence.chronological_adjacent_attempt_overlap.total.mean);

assert.equal(results.decision, "CURRENT_206_POOL_SUFFICIENT_FOR_HUMAN_VALIDATION");
assert.equal(protocol.status, "PROPOSED_NOT_LAUNCHED_OWNER_APPROVAL_REQUIRED");
assert.equal(protocol.production_impact, "NONE");
assert.equal(protocol.analysis_governance.deployment_authority, false);
assert.equal(protocol.analysis_governance.contact_authority, false);

console.log(JSON.stringify({
  status: "PASS",
  historical_completed_attempts: results.population.completed_attempts_with_50_unique_assigned_answers,
  design_b_simulated_attempts: results.design_b_capped.simulation_attempts,
  decision: results.decision,
  production_impact: results.production_impact,
}, null, 2));
