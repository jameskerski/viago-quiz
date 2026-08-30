import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const simulation = JSON.parse(readFileSync("data/v2-research/assessment-assembler-simulation.json", "utf8"));
const examples = JSON.parse(readFileSync("data/v2-research/example-attempt-manifests.json", "utf8"));
const workContexts = new Set([
  "work-business", "team", "leadership", "customer-service", "customer-pressure",
  "onboarding", "team-decision", "technology", "creative-work", "creative-collaboration",
]);

assert.equal(simulation.status, "NON_PRODUCTION_RESEARCH_COMPLETE");
assert.equal(simulation.generated_at, null, "research output must be byte-stable across reruns");
assert.deepEqual(simulation.bank_profile.by_source, {
  cohort_01: 16,
  cohort_02: 24,
  cohort_03: 15,
  legacy_active: 151,
});
assert.equal(simulation.bank_profile.total, 206);
assert.equal(simulation.bank_profile.by_type.LIKERT, 144);
assert.equal(simulation.bank_profile.by_type.SINGLE_SELECT, 62);
assert.equal(simulation.scenarios.length, 6);
assert.ok(simulation.scenarios.every((scenario) => scenario.iterations === 5000));

const architectureB = simulation.assembler.architectures.B_EQUAL_24L_26S;
assert.equal(architectureB.single, 26);
assert.deepEqual(architectureB.likert, { red: 6, blue: 6, yellow: 6, green: 6 });

for (const color of ["red", "blue", "yellow", "green"]) {
  assert.equal(simulation.scoring_comparison.B_EQUAL_24L_26S[color].theoretical_max_raw, 128);
  assert.equal(simulation.scoring_comparison.B_EQUAL_24L_26S[color].neutral_uniform_expected_raw, 38);
}
assert.equal(simulation.scoring_comparison.A_CURRENT_25_25_6_6_6_7.green.theoretical_max_raw, 128);
assert.equal(simulation.scoring_comparison.A_CURRENT_25_25_6_6_6_7.red.theoretical_max_raw, 124);

assert.equal(examples.manifests.length, 5);
assert.equal(examples.bank_version, simulation.bank_profile.bank_version);
assert.equal(examples.assembler_version, simulation.assembler.assembler_version);

for (const manifest of examples.manifests) {
  assert.equal(manifest.architecture, "B_EQUAL_24L_26S");
  assert.equal(manifest.admission_mode, "cap_weak_legacy");
  assert.equal(manifest.questions.length, 50);
  assert.equal(new Set(manifest.questions.map((q) => q.question_id)).size, 50);
  assert.equal(new Set(manifest.questions.map((q) => q.semantic_family)).size, 50);
  assert.deepEqual(manifest.questions.map((q) => q.position), Array.from({ length: 50 }, (_, index) => index + 1));

  const single = manifest.questions.filter((q) => q.qtype === "SINGLE_SELECT");
  const likert = manifest.questions.filter((q) => q.qtype === "LIKERT");
  assert.equal(single.length, 26);
  assert.equal(likert.length, 24);
  assert.ok(single.every((q) => q.option_order.length === 4));
  assert.ok(likert.every((q) => q.option_order.length === 0));
  for (const color of ["red", "blue", "yellow", "green"]) {
    assert.equal(likert.filter((q) => q.color === color).length, 6);
  }

  assert.ok(new Set(manifest.questions.map((q) => q.domain)).size >= 12);
  assert.ok(new Set(manifest.questions.map((q) => q.context)).size >= 8);
  assert.ok(manifest.questions.filter((q) => workContexts.has(q.raw_context)).length <= 8);
  assert.ok(manifest.questions.filter((q) => q.weak_legacy).length <= 5);
}

const recommended = simulation.scenarios.find((scenario) => scenario.scenario_id === "RESEARCH_B_CAPPED");
const baseline = simulation.scenarios.find((scenario) => scenario.scenario_id === "PRODUCTION_BASELINE_LEGACY_A_NORMAL");
assert.ok(recommended.pairwise_overlap.total.mean < baseline.pairwise_overlap.total.mean);
assert.equal(recommended.within_attempt.semantic_family_collisions.max, 0);
assert.ok(recommended.within_attempt.workplace_questions.max <= 8);
assert.ok(recommended.within_attempt.weak_legacy_questions.max <= 5);

console.log(JSON.stringify({
  status: "PASS",
  bank_version: examples.bank_version,
  assembler_version: examples.assembler_version,
  simulated_attempts: simulation.scenarios.reduce((sum, scenario) => sum + scenario.iterations, 0),
  example_manifests_validated: examples.manifests.length,
  production_impact: simulation.production_impact,
}, null, 2));
