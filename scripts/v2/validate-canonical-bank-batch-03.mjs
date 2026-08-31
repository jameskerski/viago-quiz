#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const schema = read("data/v2-governance/canonical-question-metadata-schema-v1.json");
const taxonomy = read("data/v2-governance/canonical-question-taxonomies-v1.json");
const approval = read("data/v2-reconstruction/batch-02-owner-approval.json");
const batches = [1, 2, 3].map((number) => read(`data/v2-reconstruction/review-batch-0${number}.json`));
const batch = batches[2];
const audit = read("data/v2-audit/current-question-audit.json");
const backlog = read("data/v2-reconstruction/question-expansion-backlog.json");

assert.equal(schema.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(taxonomy.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(approval.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batches[1].status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch.status, "PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION");
assert.equal(batch.production_impact, "NONE");
assert.equal(batch.questions.length, 25);
assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(50, 75).map((item) => item.canonical_id));
assert.deepEqual(batch.counts, { KEEP_EXACTLY: 4, REWORD: 8, REPLACE: 6, RETIRE: 7 });
assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 12, REWORD: 23, REPLACE: 22, RETIRE: 18 });

const allowedDispositions = new Set(["KEEP_EXACTLY", "REWORD", "REPLACE", "RETIRE"]);
const domains = new Set(taxonomy.behavioral_domains);
const contexts = new Set(taxonomy.life_contexts);
const tones = new Set(taxonomy.situational_tones);
const orientations = new Set(taxonomy.orientations);
const pairs = new Set(taxonomy.pairwise_discrimination);
for (const item of batch.questions) {
  assert.ok(allowedDispositions.has(item.proposed_disposition));
  assert.equal(item.origin, "LEGACY");
  assert.equal(item.runtime_authority, false);
  assert.equal(item.quality.owner_review_state, "PENDING_BATCH_REVIEW");
  assert.ok(domains.has(item.measurement.behavioral_domain));
  assert.ok(contexts.has(item.measurement.life_context));
  assert.ok(item.measurement.situational_tones.every((tone) => tones.has(tone)));
  assert.ok(orientations.has(item.measurement.orientation));
  assert.ok(item.measurement.pairwise_discrimination.every((pair) => pairs.has(pair)));
  assert.ok(item.measurement.what_it_measures.length >= 20);
  assert.ok(item.measurement.motivational_tradeoff.length >= 8);
  assert.ok(item.measurement.semantic_family.length >= 8);
  assert.ok(item.why.length >= 30);
  assert.match(item.current_revision_id, new RegExp(`^legacy:${item.question_id}:production-baseline$`));
  if (item.proposed_disposition === "KEEP_EXACTLY") {
    assert.equal(item.proposed.prompt, item.current.prompt);
    assert.equal(item.replacement, null);
  } else if (item.proposed_disposition === "REWORD") {
    assert.notEqual(item.proposed.prompt, item.current.prompt);
    assert.match(item.proposed_revision_id, new RegExp(`^legacy:${item.question_id}:proposed-v2-batch-03$`));
    assert.equal(item.replacement, null);
  } else if (item.proposed_disposition === "REPLACE") {
    assert.ok(item.replacement);
    assert.equal(item.proposed.prompt, item.replacement.prompt);
    assert.match(item.replacement.question_id, /^C0[1-3]-/);
  } else {
    assert.equal(item.proposed, null);
    assert.equal(item.replacement, null);
  }
  if (item.format === "SINGLE_SELECT" && item.proposed) {
    assert.deepEqual(item.proposed.options.map((option) => option.color).sort(), ["blue", "green", "red", "yellow"]);
  }
}

assert.equal(backlog.backlog_id, "VIAGO_QUESTION_EXPANSION_BACKLOG");
assert.equal(backlog.production_impact, "NONE");
assert.equal(backlog.entries.length, 6);
assert.equal(new Set(backlog.entries.map((item) => item.backlog_id)).size, 6);
for (const item of backlog.entries) {
  assert.ok(["HIGH", "MEDIUM", "LOW"].includes(item.priority));
  assert.ok(["LIKERT", "SINGLE_SELECT", "EITHER", "MULTIPLE_PARALLEL_ITEMS"].includes(item.needed_format));
  assert.ok(item.life_contexts.every((context) => contexts.has(context)));
  assert.ok(item.situational_tones.every((tone) => tones.has(tone)));
  assert.ok(item.orientations.every((orientation) => orientations.has(orientation)));
}
assert.equal(batch.coverage.by_context["general-cross-context"], 38);
assert.equal(batch.coverage.by_orientation.SELF_PREFERENCE, 39);
assert.equal(batch.coverage.by_orientation.PREFERENCE_IN_OTHERS, 2);
assert.ok(Object.values(batch.coverage.pairwise_opportunities).every((count) => count > 0));

console.log(JSON.stringify({ status: "PASS", questions: 25, counts: batch.counts, cumulative_counts: batch.cumulative_counts, backlog_entries: backlog.entries.length, production_impact: "NONE" }, null, 2));
