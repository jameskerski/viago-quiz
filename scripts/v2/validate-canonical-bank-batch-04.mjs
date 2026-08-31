#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const schema = read("data/v2-governance/canonical-question-metadata-schema-v1.json");
const taxonomy = read("data/v2-governance/canonical-question-taxonomies-v1.json");
const approval = read("data/v2-reconstruction/batch-03-owner-approval.json");
const batches = [1, 2, 3, 4].map((number) => read(`data/v2-reconstruction/review-batch-0${number}.json`));
const batch = batches[3];
const audit = read("data/v2-audit/current-question-audit.json");
const backlog = read("data/v2-reconstruction/question-expansion-backlog.json");

assert.equal(schema.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(taxonomy.status, "OWNER_APPROVED_NON_RUNTIME");
assert.equal(approval.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batches[2].status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch.production_impact, "NONE");
assert.equal(batch.questions.length, 25);
assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(75, 100).map((item) => item.canonical_id));
assert.deepEqual(batch.counts, { KEEP_EXACTLY: 1, REWORD: 11, REPLACE: 2, RETIRE: 11 });
assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 13, REWORD: 34, REPLACE: 24, RETIRE: 29 });

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
  assert.equal(item.quality.owner_review_state, "OWNER_APPROVED");
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
    assert.match(item.proposed_revision_id, new RegExp(`^legacy:${item.question_id}:proposed-v2-batch-04$`));
    assert.equal(item.replacement, null);
  } else if (item.proposed_disposition === "REPLACE") {
    assert.ok(item.replacement);
    assert.equal(item.proposed.prompt, item.replacement.prompt);
  } else {
    assert.equal(item.proposed, null);
    assert.equal(item.replacement, null);
  }
  if (item.format === "SINGLE_SELECT" && item.proposed) assert.deepEqual(item.proposed.options.map((option) => option.color).sort(), ["blue", "green", "red", "yellow"]);
}

assert.ok(backlog.entries.length >= 8);
assert.equal(new Set(backlog.entries.map((item) => item.backlog_id)).size, backlog.entries.length);
const priorBacklog = backlog.entries.filter((item) => item.discovered_in === "BATCH_03");
const newBacklog = backlog.entries.filter((item) => item.discovered_in === "BATCH_04");
assert.equal(priorBacklog.length, 6);
assert.ok(priorBacklog.every((item) => item.owner_review_state === "OWNER_APPROVED"));
assert.equal(newBacklog.length, 2);
assert.ok(newBacklog.every((item) => item.owner_review_state === "OWNER_APPROVED"));
for (const item of backlog.entries) {
  assert.ok(["HIGH", "MEDIUM", "LOW"].includes(item.priority));
  assert.ok(["LIKERT", "SINGLE_SELECT", "EITHER", "MULTIPLE_PARALLEL_ITEMS"].includes(item.needed_format));
  assert.ok(item.life_contexts.every((context) => contexts.has(context)));
  assert.ok(item.situational_tones.every((tone) => tones.has(tone)));
  assert.ok(item.orientations.every((orientation) => orientations.has(orientation)));
}
assert.equal(batch.coverage.by_context["general-cross-context"], 49);
assert.equal(batch.coverage.by_orientation.SELF_PREFERENCE, 47);
assert.equal(batch.coverage.by_orientation.PREFERENCE_IN_OTHERS, 4);
assert.equal(batch.coverage.by_tone.recovery, 2);
assert.ok(Object.values(batch.coverage.pairwise_opportunities).every((count) => count > 0));

console.log(JSON.stringify({ status: "PASS", questions: 25, counts: batch.counts, cumulative_counts: batch.cumulative_counts, approved_backlog_entries: priorBacklog.length, pending_backlog_entries: newBacklog.length, production_impact: "NONE" }, null, 2));
