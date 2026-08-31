#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const schema = read("data/v2-governance/canonical-question-metadata-schema-v1.json");
const taxonomy = read("data/v2-governance/canonical-question-taxonomies-v1.json");
const approval = read("data/v2-reconstruction/batch-04-owner-approval.json");
const batches = [1, 2, 3, 4, 5].map((number) => read(`data/v2-reconstruction/review-batch-0${number}.json`));
const batch = batches[4];
const audit = read("data/v2-audit/current-question-audit.json");
const backlog = read("data/v2-reconstruction/question-expansion-backlog.json");

assert.equal(schema.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(taxonomy.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(approval.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batches[3].status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch.status, "PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION");
assert.equal(batch.production_impact, "NONE");
assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(100, 125).map((item) => item.canonical_id));
assert.deepEqual(batch.counts, { KEEP_EXACTLY: 1, REWORD: 7, REPLACE: 2, RETIRE: 15 });
assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 14, REWORD: 41, REPLACE: 26, RETIRE: 44 });

const domains = new Set(taxonomy.behavioral_domains);
const contexts = new Set(taxonomy.life_contexts);
const tones = new Set(taxonomy.situational_tones);
const orientations = new Set(taxonomy.orientations);
const pairs = new Set(taxonomy.pairwise_discrimination);
for (const item of batch.questions) {
  assert.ok(["KEEP_EXACTLY", "REWORD", "REPLACE", "RETIRE"].includes(item.proposed_disposition));
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
  if (item.proposed_disposition === "KEEP_EXACTLY") assert.equal(item.proposed.prompt, item.current.prompt);
  if (item.proposed_disposition === "REWORD") {
    assert.notEqual(item.proposed.prompt, item.current.prompt);
    assert.match(item.proposed_revision_id, new RegExp(`^legacy:${item.question_id}:proposed-v2-batch-05$`));
  }
  if (item.proposed_disposition === "REPLACE") {
    assert.ok(item.replacement);
    assert.equal(item.proposed.prompt, item.replacement.prompt);
  }
  if (item.proposed_disposition === "RETIRE") {
    assert.equal(item.proposed, null);
    assert.equal(item.replacement, null);
  }
  if (item.format === "SINGLE_SELECT" && item.proposed) assert.deepEqual(item.proposed.options.map((option) => option.color).sort(), ["blue", "green", "red", "yellow"]);
}

assert.equal(backlog.entries.length, 9);
assert.equal(new Set(backlog.entries.map((item) => item.backlog_id)).size, 9);
assert.ok(backlog.entries.slice(0, 8).every((item) => item.owner_review_state === "OWNER_APPROVED"));
const newBacklog = backlog.entries.filter((item) => item.discovered_in === "BATCH_05");
assert.equal(newBacklog.length, 1);
assert.equal(newBacklog[0].backlog_id, "EXP-009");
assert.equal(newBacklog[0].owner_review_state, "PENDING_BATCH_REVIEW");
assert.equal(batch.coverage.by_context["general-cross-context"], 60);
assert.equal(batch.coverage.by_orientation.SELF_PREFERENCE, 55);
assert.equal(batch.coverage.by_orientation.PREFERENCE_IN_OTHERS, 6);
assert.equal(batch.coverage.by_tone.recovery, 2);
assert.ok(Object.values(batch.coverage.pairwise_opportunities).every((count) => count > 0));

console.log(JSON.stringify({ status: "PASS", questions: 25, counts: batch.counts, cumulative_counts: batch.cumulative_counts, approved_backlog_entries: 8, pending_backlog_entries: 1, production_impact: "NONE" }, null, 2));
