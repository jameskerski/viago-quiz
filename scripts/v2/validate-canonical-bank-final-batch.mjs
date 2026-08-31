#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
const read = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const batch = read("data/v2-reconstruction/review-final-batch.json");
const audit = read("data/v2-audit/current-question-audit.json");
const taxonomy = read("data/v2-governance/canonical-question-taxonomies-v1.json");
const approval = read("data/v2-reconstruction/batch-05-owner-approval.json");
const backlog = read("data/v2-reconstruction/question-expansion-backlog.json");
assert.equal(approval.status, "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION");
assert.equal(batch.status, "PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION");
assert.equal(batch.production_impact, "NONE");
assert.deepEqual(batch.questions.map((x) => x.question_id), audit.questions.slice(125).map((x) => x.canonical_id));
assert.deepEqual(batch.counts, { KEEP_EXACTLY: 5, REWORD: 9, REPLACE: 2, RETIRE: 10 });
assert.deepEqual(batch.final_legacy_counts, { KEEP_EXACTLY: 19, REWORD: 50, REPLACE: 28, RETIRE: 54 });
assert.deepEqual(batch.final_legacy_percentages, { KEEP_EXACTLY: 12.58, REWORD: 33.11, REPLACE: 18.54, RETIRE: 35.76 });
assert.equal(Object.values(batch.final_legacy_counts).reduce((a,b) => a+b, 0), 151);
assert.equal(batch.reconstructed_legacy_coverage.admitted_question_count, 97);
assert.equal(batch.reconstructed_legacy_coverage.retired_question_count, 54);
const domains = new Set(taxonomy.behavioral_domains), contexts = new Set(taxonomy.life_contexts), tones = new Set(taxonomy.situational_tones), orientations = new Set(taxonomy.orientations), pairs = new Set(taxonomy.pairwise_discrimination);
for (const x of batch.questions) {
  assert.equal(x.runtime_authority, false);
  assert.equal(x.quality.owner_review_state, "PENDING_BATCH_REVIEW");
  assert.ok(domains.has(x.measurement.behavioral_domain));
  assert.ok(contexts.has(x.measurement.life_context));
  assert.ok(x.measurement.situational_tones.every((v) => tones.has(v)));
  assert.ok(orientations.has(x.measurement.orientation));
  assert.ok(x.measurement.pairwise_discrimination.every((v) => pairs.has(v)));
  if (x.format === "SINGLE_SELECT" && x.proposed) assert.deepEqual(x.proposed.options.map((o) => o.color).sort(), ["blue","green","red","yellow"]);
  if (x.proposed_disposition === "KEEP_EXACTLY") assert.equal(x.proposed.prompt, x.current.prompt);
  if (x.proposed_disposition === "REWORD") assert.notEqual(x.proposed.prompt, x.current.prompt);
  if (x.proposed_disposition === "REPLACE") assert.ok(x.replacement);
  if (x.proposed_disposition === "RETIRE") assert.equal(x.proposed, null);
}
assert.equal(backlog.entries.length, 9);
assert.ok(backlog.entries.every((x) => x.owner_review_state === "OWNER_APPROVED"));
for (const key of ["virtue_loading","stereotypes","color_contamination","duplicates","deficit_framing","context_problems","competency_self_esteem","weak_discrimination"]) assert.ok(batch.legacy_reconstruction_findings[key]);
console.log(JSON.stringify({ status: "PASS", questions: 26, counts: batch.counts, totals: batch.final_legacy_counts, admitted: 97, production_impact: "NONE" }, null, 2));
