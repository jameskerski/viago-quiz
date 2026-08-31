#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const schema = read("data/v2-governance/canonical-question-metadata-schema-v1.json");
const taxonomy = read("data/v2-governance/canonical-question-taxonomies-v1.json");
const batch = read("data/v2-reconstruction/review-batch-01.json");
const audit = read("data/v2-audit/current-question-audit.json");

assert.equal(schema.status, "PROPOSED_FOR_OWNER_REVIEW");
assert.equal(schema.runtime_authority, false);
assert.equal(taxonomy.status, "PROPOSED_FOR_OWNER_REVIEW");
assert.equal(taxonomy.runtime_authority, false);
assert.equal(batch.status, "PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION");
assert.equal(batch.production_impact, "NONE");
assert.equal(batch.questions.length, 25);
assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(0, 25).map((item) => item.canonical_id));
assert.deepEqual(batch.counts, { KEEP_EXACTLY: 3, REWORD: 8, REPLACE: 9, RETIRE: 5 });

const allowedDispositions = new Set(["KEEP_EXACTLY", "REWORD", "REPLACE", "RETIRE"]);
const domains = new Set(taxonomy.behavioral_domains);
const contexts = new Set(taxonomy.life_contexts);
const tones = new Set(taxonomy.situational_tones);
const orientations = new Set(taxonomy.orientations);
const pairs = new Set(taxonomy.pairwise_discrimination);

for (const item of batch.questions) {
  assert.ok(allowedDispositions.has(item.proposed_disposition));
  assert.equal(item.origin, "LEGACY");
  assert.ok(["LIKERT", "SINGLE_SELECT"].includes(item.format));
  assert.equal(item.runtime_authority, false);
  assert.equal(item.quality.owner_review_state, "PENDING_BATCH_REVIEW");
  assert.ok(domains.has(item.measurement.behavioral_domain));
  assert.ok(contexts.has(item.measurement.life_context));
  assert.ok(item.measurement.situational_tones.every((tone) => tones.has(tone)));
  assert.ok(orientations.has(item.measurement.orientation));
  assert.ok(item.measurement.pairwise_discrimination.every((pair) => pairs.has(pair)));
  assert.ok(item.measurement.core_traits.length >= 1);
  assert.ok(item.measurement.motivational_tradeoff.length >= 8);
  assert.ok(item.measurement.what_it_measures.length >= 20);
  assert.ok(item.why.length >= 25);
  if (item.proposed_disposition === "KEEP_EXACTLY") {
    assert.equal(item.proposed.prompt, item.current.prompt);
    assert.equal(item.replacement, null);
  }
  if (item.proposed_disposition === "REWORD") {
    assert.notEqual(item.proposed.prompt, item.current.prompt);
    assert.ok(item.proposed_revision_id);
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

assert.equal(Object.keys(batch.coverage.by_domain).length, 12);
assert.equal(Object.keys(batch.coverage.by_context).length, 9);
assert.ok(Object.values(batch.coverage.pairwise_opportunities).every((count) => count > 0));

console.log(JSON.stringify({
  status: "PASS",
  schema: schema.schema_id,
  taxonomy: taxonomy.taxonomy_id,
  questions: batch.questions.length,
  counts: batch.counts,
  production_impact: batch.production_impact,
}, null, 2));
