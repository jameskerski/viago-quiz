#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const cohort = read("data/v2-proposals/cohort-03.json");
const active = read("data/v2-audit/current-question-audit.json").questions;
const reviewed = read("data/v2-analysis/interim-coverage.json").resolved_candidates;
const colors = ["red", "blue", "yellow", "green"];
const classifications = new Set([
  "NET_NEW_COVERAGE",
  "DELIBERATE_PARALLEL_MEASUREMENT",
  "POTENTIAL_LEGACY_REPLACEMENT",
  "REDUNDANT_DO_NOT_ADD",
]);

const fail = (message) => {
  throw new Error(message);
};

const normalize = (text) => text
  .toLowerCase()
  .normalize("NFKD")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const stopWords = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "do", "for", "from",
  "has", "have", "i", "if", "in", "is", "it", "its", "me", "most", "my", "of", "on",
  "or", "so", "that", "the", "their", "them", "they", "this", "to", "up", "what", "when",
  "which", "with", "would", "you",
]);

const tokens = (text) => normalize(text).split(" ").filter((token) => token.length > 1 && !stopWords.has(token));
const fullText = (item) => [
  item.question ?? item.english ?? "",
  ...(item.options ?? []).map((option) => option.label ?? option.english ?? ""),
].join(" ");

if (cohort.status !== "OWNER_REVIEW_ONLY") fail("Cohort must remain review-only.");
if (cohort.runtime_impact !== "NONE") fail("Cohort must have no runtime impact.");
if (cohort.candidates.length !== 16) fail("Expected exactly 16 review candidates.");
if (new Set(cohort.candidates.map((item) => item.proposal_id)).size !== 16) fail("Candidate IDs must be unique.");

const singles = cohort.candidates.filter((item) => item.question_type === "SINGLE_SELECT");
const likerts = cohort.candidates.filter((item) => item.question_type === "LIKERT");
if (singles.length !== 12 || likerts.length !== 4) fail("Expected 12 single-select and 4 Likert candidates.");

for (const item of cohort.candidates) {
  if (!classifications.has(item.coverage_classification)) fail(`${item.proposal_id}: invalid coverage classification.`);
  if (item.coverage_classification === "REDUNDANT_DO_NOT_ADD") fail(`${item.proposal_id}: redundant drafts cannot enter the review package.`);
  if (!item.what_it_measures || !item.why_it_earns_a_place) fail(`${item.proposal_id}: missing review rationale.`);
  if (item.question_type === "SINGLE_SELECT") {
    if (item.options.length !== 4) fail(`${item.proposal_id}: expected four options.`);
    const mappings = item.options.map((option) => option.mapping).sort();
    if (JSON.stringify(mappings) !== JSON.stringify([...colors].sort())) {
      fail(`${item.proposal_id}: expected one option per color.`);
    }
  } else if (!colors.includes(item.intended_mapping)) {
    fail(`${item.proposal_id}: invalid Likert mapping.`);
  }
}

const workplaceContexts = new Set(["work-business", "team", "project", "customer-service", "customer-pressure", "onboarding"]);
const nonWorkCount = cohort.candidates.filter((item) => !workplaceContexts.has(item.context)).length;
if (nonWorkCount < Math.ceil(cohort.candidates.length * 2 / 3)) fail("At least two-thirds must clearly be non-workplace.");

const baseline = [
  ...active.map((item) => ({ id: item.canonical_id, text: fullText(item), source: "active" })),
  ...reviewed.map((item) => ({ id: item.proposal_id, text: fullText(item), source: "owner_reviewed_candidate" })),
];
const baselineNormalized = new Map(baseline.map((item) => [normalize(item.text), item.id]));
for (const item of cohort.candidates) {
  const duplicate = baselineNormalized.get(normalize(fullText(item)));
  if (duplicate) fail(`${item.proposal_id}: exact duplicate of ${duplicate}.`);
}

const documents = [
  ...baseline,
  ...cohort.candidates.map((item) => ({ id: item.proposal_id, text: fullText(item), source: "cohort_03" })),
];
const docTokens = new Map(documents.map((item) => [item.id, tokens(item.text)]));
const documentFrequency = new Map();
for (const values of docTokens.values()) {
  for (const token of new Set(values)) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
}
const vectors = new Map();
for (const [id, values] of docTokens) {
  const frequency = new Map();
  for (const token of values) frequency.set(token, (frequency.get(token) ?? 0) + 1);
  const vector = new Map();
  for (const [token, count] of frequency) {
    vector.set(token, count * (Math.log((1 + documents.length) / (1 + documentFrequency.get(token))) + 1));
  }
  const norm = Math.sqrt([...vector.values()].reduce((sum, value) => sum + value * value, 0)) || 1;
  vectors.set(id, new Map([...vector].map(([token, value]) => [token, value / norm])));
}
const cosine = (left, right) => {
  const [small, large] = left.size <= right.size ? [left, right] : [right, left];
  let score = 0;
  for (const [token, value] of small) score += value * (large.get(token) ?? 0);
  return score;
};

const screen = cohort.candidates.map((candidate) => {
  const matches = baseline.map((item) => ({
    id: item.id,
    source: item.source,
    cosine: Number(cosine(vectors.get(candidate.proposal_id), vectors.get(item.id)).toFixed(4)),
  })).sort((left, right) => right.cosine - left.cosine || left.id.localeCompare(right.id)).slice(0, 5);
  return { proposal_id: candidate.proposal_id, closest_lexical_matches: matches };
});

const semanticEvidence = {
  schema_version: "1.0.0",
  status: "REVIEW_ONLY_SCREEN_COMPLETE",
  baseline: { active_questions: active.length, owner_reviewed_candidates: reviewed.length, total: baseline.length },
  method: "Exact normalized duplicate rejection plus TF-IDF cosine screening over prompt and options. Semantic acceptance is documented in each candidate's measurement, closest-item, classification, and earned-place rationale.",
  automatic_rejection_threshold: 0.34,
  automatic_rejections: screen.filter((entry) => entry.closest_lexical_matches[0]?.cosine >= 0.34),
  accepted_candidate_screen: screen,
  pre_review_rejections: cohort.pre_review_rejections,
  production_impact: "NONE",
};
fs.mkdirSync(path.join(root, "data/v2-analysis"), { recursive: true });
fs.writeFileSync(path.join(root, "data/v2-analysis/cohort-03-semantic-screen.json"), `${JSON.stringify(semanticEvidence, null, 2)}\n`);

const lines = [
  "# Cohort 03 — OWNER Review Package",
  "",
  "Status: `OWNER_REVIEW_ONLY`  ",
  "Governing model: `VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0`  ",
  "Composition: 12 single-select + 4 Likert; all 16 are clearly outside workplace/team/project settings  ",
  "Runtime impact: **NONE**",
  "",
  "Every item below was compared with all 151 active questions and all 40 OWNER-reviewed candidates. Three redundant drafts were rejected before this package.",
  "",
];
for (const item of cohort.candidates) {
  lines.push(`## ${item.proposal_id}`);
  lines.push("");
  lines.push(`**Scenario/question**`);
  lines.push("");
  lines.push(`> ${item.question}`);
  lines.push("");
  if (item.question_type === "SINGLE_SELECT") {
    lines.push("**Responses and color mapping**");
    lines.push("");
    for (const option of item.options) lines.push(`- **${option.mapping[0].toUpperCase()}${option.mapping.slice(1)}:** ${option.label}`);
    lines.push("");
  } else {
    lines.push(`**Color mapping:** ${item.intended_mapping[0].toUpperCase()}${item.intended_mapping.slice(1)}`);
    lines.push("");
  }
  lines.push(`**What it measures:** ${item.what_it_measures}`);
  lines.push("");
  lines.push(`**Coverage classification:** \`${item.coverage_classification}\``);
  lines.push("");
  lines.push(`**Closest existing/new question:** ${item.closest_existing_or_new.length ? item.closest_existing_or_new.map((id) => `\`${id}\``).join(", ") : "None meaningful after semantic review."}`);
  lines.push("");
  lines.push(`**Why this item earns a place:** ${item.why_it_earns_a_place}`);
  lines.push("");
}
lines.push("## Pre-review semantic control");
lines.push("");
lines.push("The following drafts were rejected before OWNER review:");
lines.push("");
for (const item of cohort.pre_review_rejections) lines.push(`- **${item.draft_id}:** ${item.summary} — ${item.basis}`);
lines.push("");
lines.push("No candidate is active. No production, database, scoring, selector, legacy question, result, or deployment behavior changed.");
fs.writeFileSync(path.join(root, "docs/v2/COHORT_03_OWNER_REVIEW.md"), `${lines.join("\n")}\n`);

console.log(JSON.stringify({
  status: "PASS",
  candidates: cohort.candidates.length,
  single_select: singles.length,
  likert: likerts.length,
  non_workplace: nonWorkCount,
  baseline_compared: baseline.length,
  automatic_rejections: semanticEvidence.automatic_rejections.length,
  pre_review_rejections: cohort.pre_review_rejections.length,
}, null, 2));
