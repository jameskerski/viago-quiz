#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const schema = read("data/v2-governance/canonical-question-metadata-schema-v1.json");
const taxonomy = read("data/v2-governance/canonical-question-taxonomies-v1.json");
const approval = read("data/v2-reconstruction/batch-01-owner-approval.json");
const batch01 = read("data/v2-reconstruction/review-batch-01.json");
const batch02 = read("data/v2-reconstruction/review-batch-02.json");
const audit = read("data/v2-audit/current-question-audit.json");

assert.equal(schema.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(taxonomy.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(schema.runtime_authority, false);
assert.equal(taxonomy.runtime_authority, false);
assert.equal(approval.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.deepEqual(approval.approved_counts, { KEEP_EXACTLY: 3, REWORD: 8, REPLACE: 9, RETIRE: 5 });
assert.equal(batch01.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch02.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch02.production_impact, "NONE");
assert.equal(batch02.questions.length, 25);
assert.deepEqual(batch02.questions.map((item) => item.question_id), audit.questions.slice(25, 50).map((item) => item.canonical_id));
assert.deepEqual(batch02.counts, { KEEP_EXACTLY: 5, REWORD: 7, REPLACE: 7, RETIRE: 6 });
assert.deepEqual(batch02.cumulative_counts, { KEEP_EXACTLY: 8, REWORD: 15, REPLACE: 16, RETIRE: 11 });

const allowedDispositions = new Set(["KEEP_EXACTLY", "REWORD", "REPLACE", "RETIRE"]);
const domains = new Set(taxonomy.behavioral_domains);
const contexts = new Set(taxonomy.life_contexts);
const tones = new Set(taxonomy.situational_tones);
const orientations = new Set(taxonomy.orientations);
const pairs = new Set(taxonomy.pairwise_discrimination);

for (const item of batch02.questions) {
  assert.ok(allowedDispositions.has(item.proposed_disposition));
  assert.equal(item.origin, "LEGACY");
  assert.equal(item.runtime_authority, false);
  assert.equal(item.quality.owner_review_state, "OWNER_APPROVED");
  assert.ok(domains.has(item.measurement.behavioral_domain));
  assert.ok(contexts.has(item.measurement.life_context));
  assert.ok(item.measurement.situational_tones.every((tone) => tones.has(tone)));
  assert.ok(orientations.has(item.measurement.orientation));
  assert.ok(item.measurement.pairwise_discrimination.every((pair) => pairs.has(pair)));
  assert.ok(item.measurement.core_traits.length >= 1);
  assert.ok(item.measurement.motivational_tradeoff.length >= 8);
  assert.ok(item.measurement.what_it_measures.length >= 20);
  assert.ok(item.why.length >= 25);
  assert.match(item.current_revision_id, new RegExp(`^legacy:${item.question_id}:`));
  if (item.proposed_disposition === "KEEP_EXACTLY") {
    assert.equal(item.proposed.prompt, item.current.prompt);
    assert.equal(item.proposed_revision_id, null);
    assert.equal(item.replacement, null);
  }
  if (item.proposed_disposition === "REWORD") {
    assert.notEqual(item.proposed.prompt, item.current.prompt);
    assert.match(item.proposed_revision_id, new RegExp(`^legacy:${item.question_id}:proposed-v2-batch-02$`));
    assert.equal(item.replacement, null);
  }
  if (item.proposed_disposition === "REPLACE") {
    assert.ok(item.replacement);
    assert.equal(item.proposed.prompt, item.replacement.prompt);
    assert.ok(["COHORT_01", "COHORT_02", "COHORT_03"].includes(item.replacement.origin));
  }
  if (item.proposed_disposition === "RETIRE") {
    assert.equal(item.proposed, null);
    assert.equal(item.replacement, null);
  }
}

assert.equal(batch02.coverage.by_context["general-cross-context"], 25);
assert.ok(Object.values(batch02.coverage.pairwise_opportunities).every((count) => count > 0));

console.log(JSON.stringify({
  status: "PASS",
  questions: batch02.questions.length,
  counts: batch02.counts,
  cumulative_counts: batch02.cumulative_counts,
  production_impact: batch02.production_impact,
}, null, 2));
