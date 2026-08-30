#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const base = read("data/v2-proposals/cohort-03.json");
const amendment = read("data/v2-proposals/cohort-03-owner-revisions.json");
const colors = ["blue", "green", "red", "yellow"];
const fail = (message) => { throw new Error(message); };

if (amendment.status !== "OWNER_REVIEW_REVISION_ONLY") fail("Amendment must remain review-only.");
if (amendment.runtime_impact !== "NONE" || amendment.production_impact !== "NONE") fail("Runtime and production impact must remain NONE.");
if (amendment.revisions.length !== 3) fail("Expected exactly three revised candidates.");
if (amendment.deferred.length !== 1) fail("Expected exactly one deferred candidate.");

const revisionIds = amendment.revisions.map((item) => item.proposal_id).sort();
if (JSON.stringify(revisionIds) !== JSON.stringify(["C03-L-B-01", "C03-S-01", "C03-S-04"])) {
  fail("Only the three OWNER-requested candidates may be revised.");
}
if (amendment.deferred[0].proposal_id !== "C03-S-11" || amendment.deferred[0].disposition !== "DEFER_REDUNDANCY") {
  fail("C03-S-11 must be the sole DEFER_REDUNDANCY item.");
}

const baseById = new Map(base.candidates.map((item) => [item.proposal_id, item]));
const revisionById = new Map(amendment.revisions.map((item) => [item.proposal_id, item]));
for (const id of revisionIds) if (!baseById.has(id)) fail(`${id} is missing from the source package.`);

for (const revision of amendment.revisions) {
  if (revision.question_type === "SINGLE_SELECT") {
    const mappings = revision.options.map((option) => option.mapping).sort();
    if (JSON.stringify(mappings) !== JSON.stringify(colors)) fail(`${revision.proposal_id} must retain exactly one option per color.`);
  }
}

const resolved = base.candidates
  .filter((item) => item.proposal_id !== "C03-S-11")
  .map((item) => ({ ...item, ...(revisionById.get(item.proposal_id) ?? {}) }));
if (resolved.length !== 15 || amendment.current_candidate_count_after_disposition !== 15) fail("Current Cohort 03 must contain 15 candidates.");
if (resolved.filter((item) => item.question_type === "SINGLE_SELECT").length !== 11) fail("Expected 11 retained single-select candidates.");
if (resolved.filter((item) => item.question_type === "LIKERT").length !== 4) fail("Expected 4 retained Likert candidates.");

const forbiddenYellow = "who it matters to";
const revisedS01 = revisionById.get("C03-S-01");
if (revisedS01.options.find((option) => option.mapping === "yellow").label.toLowerCase().includes(forbiddenYellow)) {
  fail("C03-S-01 Yellow still depends on an external beneficiary.");
}
const revisedS04 = revisionById.get("C03-S-04");
const greenS04 = revisedS04.options.find((option) => option.mapping === "green").label.toLowerCase();
if (!greenS04.includes("constraints") || !greenS04.includes("predictable")) fail("C03-S-04 Green must express constraints and predictability.");
const revisedBlue = revisionById.get("C03-L-B-01").question.toLowerCase();
for (const signal of ["energized", "exchange", "possibilities"]) if (!revisedBlue.includes(signal)) fail(`C03-L-B-01 is missing Blue signal: ${signal}.`);

console.log(JSON.stringify({
  status: "PASS",
  revised: revisionIds,
  deferred: amendment.deferred[0],
  current_candidate_count: resolved.length,
  single_select: resolved.filter((item) => item.question_type === "SINGLE_SELECT").length,
  likert: resolved.filter((item) => item.question_type === "LIKERT").length,
  runtime_impact: "NONE"
}, null, 2));
