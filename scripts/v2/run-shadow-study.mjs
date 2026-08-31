#!/usr/bin/env node

/**
 * Read-only shadow analysis over the immutable rollback-retirement snapshot.
 * The six rollback-only attempts are excluded by manifest disposition. Outputs
 * contain aggregate evidence only and never alter or re-score stored records.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DEFAULT_ARCHIVE = "/Users/jameskerski/PCS-Secure/Credential-Registry/VIAGO__ROLLBACK_RETIREMENT__20260829T231712.741Z";
const ARCHIVE = process.env.VIAGO_HISTORICAL_SNAPSHOT_DIR || DEFAULT_ARCHIVE;
const SNAPSHOT = path.join(ARCHIVE, "full-snapshot");
const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));
const readRepoJson = (relative) => readJson(path.join(ROOT, relative));
const readJsonlGzip = (file) => zlib.gunzipSync(fs.readFileSync(file)).toString("utf8").trim().split("\n").filter(Boolean).map(JSON.parse);
const sha256 = (value) => crypto.createHash("sha256").update(value).digest("hex");
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
const pct = (numerator, denominator) => Number((100 * numerator / (denominator || 1)).toFixed(2));
const round = (value, digits = 4) => Number(value.toFixed(digits));
const percentile = (values, p) => {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.max(0, Math.min(ordered.length - 1, Math.floor((ordered.length - 1) * p)))];
};
const summarize = (values) => ({
  min: Math.min(...values),
  p05: percentile(values, 0.05),
  mean: round(mean(values)),
  p50: percentile(values, 0.5),
  p95: percentile(values, 0.95),
  max: Math.max(...values),
});
const intersectionSize = (left, right) => {
  const rightSet = new Set(right);
  return left.reduce((count, value) => count + Number(rightSet.has(value)), 0);
};

const manifest = readJson(path.join(ARCHIVE, "MANIFEST.json"));
if (manifest.disposition !== "ARCHIVE_ONLY_DO_NOT_MERGE") throw new Error("Unexpected archive disposition.");
const archiveOnlyAttemptIds = new Set(manifest.attempt_ids);

const sourceFiles = ["questions", "question_options", "quiz_attempts", "quiz_attempt_questions", "quiz_attempt_answers"];
const sourceChecks = {};
for (const table of sourceFiles) {
  const file = path.join(SNAPSHOT, `${table}.jsonl.gz`);
  const expected = manifest.full_public_snapshot.files.find((item) => item.table === table);
  const compressed = fs.readFileSync(file);
  const actualHash = sha256(compressed);
  if (!expected || expected.compressed_sha256 !== actualHash) throw new Error(`Archive checksum mismatch for ${table}.`);
  sourceChecks[table] = { rows: expected.rows, compressed_sha256: actualHash, verified: true };
}

const questions = readJsonlGzip(path.join(SNAPSHOT, "questions.jsonl.gz"));
const options = readJsonlGzip(path.join(SNAPSHOT, "question_options.jsonl.gz"));
const attempts = readJsonlGzip(path.join(SNAPSHOT, "quiz_attempts.jsonl.gz")).filter((item) => !archiveOnlyAttemptIds.has(item.id));
const attemptIdSet = new Set(attempts.map((item) => item.id));
const assignments = readJsonlGzip(path.join(SNAPSHOT, "quiz_attempt_questions.jsonl.gz")).filter((item) => attemptIdSet.has(item.attempt_id));
const answers = readJsonlGzip(path.join(SNAPSHOT, "quiz_attempt_answers.jsonl.gz")).filter((item) => attemptIdSet.has(item.attempt_id));

const questionById = new Map(questions.map((item) => [item.id, item]));
const optionById = new Map(options.map((item) => [item.id, item]));
const audit = readRepoJson("data/v2-audit/current-question-audit.json");
const severeFlags = new Set(["COLOR_ASSIGNMENT_QUESTIONABLE", "AMBIGUOUS", "DOUBLE_BARRELED", "SOCIAL_DESIRABILITY_RISK", "SEMANTICALLY_OVERLAPPING"]);
const weakIds = new Set(audit.questions.filter((item) => item.color_assignment_confidence === "LOW" || item.quality_classifications.some((flag) => severeFlags.has(flag))).map((item) => item.canonical_id));

const assignmentsByAttempt = new Map();
const answersByAttempt = new Map();
for (const item of assignments) {
  if (!assignmentsByAttempt.has(item.attempt_id)) assignmentsByAttempt.set(item.attempt_id, []);
  assignmentsByAttempt.get(item.attempt_id).push(item);
}
for (const item of answers) {
  if (!answersByAttempt.has(item.attempt_id)) answersByAttempt.set(item.attempt_id, []);
  answersByAttempt.get(item.attempt_id).push(item);
}

function expectedCurrentShape(rows) {
  if (rows.length !== 50 || new Set(rows.map((item) => item.question_id)).size !== 50) return false;
  const single = rows.filter((item) => item.qtype === "single").length;
  const colors = { red: 0, blue: 0, yellow: 0, green: 0 };
  for (const row of rows.filter((item) => item.qtype === "likert")) {
    const color = questionById.get(row.question_id)?.likert_color;
    if (color in colors) colors[color] += 1;
  }
  return single === 25 && colors.red === 6 && colors.blue === 6 && colors.yellow === 6 && colors.green === 7;
}

function contributionsFor(answerRows) {
  return answerRows.flatMap((answer) => {
    if (answer.qtype === "likert") {
      const color = questionById.get(answer.question_id)?.likert_color;
      if (!color || answer.likert_value === null) return [];
      return [{ question_id: answer.question_id, qtype: "likert", color, points: Number(answer.likert_value), weak: weakIds.has(answer.question_id) }];
    }
    const option = optionById.get(answer.option_id);
    if (!option) return [];
    return ["red", "blue", "green", "yellow"].filter((color) => Number(option[color]) > 0).map((color) => ({
      question_id: answer.question_id,
      qtype: "single",
      color,
      points: Number(option[color]),
      weak: weakIds.has(answer.question_id),
    }));
  });
}

const colorOrder = new Map(["red", "blue", "green", "yellow"].map((color, index) => [color, index]));
function rank(contributions) {
  const aggregates = new Map(["red", "blue", "green", "yellow"].map((color) => [color, { color, score: 0, max_hit: 0, positive_hits: 0 }]));
  for (const item of contributions) {
    const aggregate = aggregates.get(item.color);
    aggregate.score += item.points;
    aggregate.max_hit = Math.max(aggregate.max_hit, item.points);
    aggregate.positive_hits += Number(item.points > 0);
  }
  return [...aggregates.values()].sort((left, right) => right.score - left.score || right.max_hit - left.max_hit || right.positive_hits - left.positive_hits || colorOrder.get(left.color) - colorOrder.get(right.color));
}

function normalizedGreenScoreOrder(contributions) {
  const aggregates = new Map(["red", "blue", "green", "yellow"].map((color) => [color, { color, score: 0, max_hit: 0, positive_hits: 0 }]));
  for (const item of contributions) {
    const aggregate = aggregates.get(item.color);
    aggregate.score += item.qtype === "likert" && item.color === "green" ? item.points * 6 / 7 : item.points;
    aggregate.max_hit = Math.max(aggregate.max_hit, item.points);
    aggregate.positive_hits += Number(item.points > 0);
  }
  return [...aggregates.values()].sort((left, right) => right.score - left.score || right.max_hit - left.max_hit || right.positive_hits - left.positive_hits || colorOrder.get(left.color) - colorOrder.get(right.color));
}

const eligibleAttempts = attempts.filter((attempt) => expectedCurrentShape(assignmentsByAttempt.get(attempt.id) || []));
const completedAttempts = eligibleAttempts.filter((attempt) => {
  const assigned = assignmentsByAttempt.get(attempt.id) || [];
  const responseRows = answersByAttempt.get(attempt.id) || [];
  return responseRows.length === 50 && new Set(responseRows.map((item) => item.question_id)).size === 50 && responseRows.every((item) => assigned.some((assignment) => assignment.question_id === item.question_id));
});

const weakCounts = [];
const weakPointShares = [];
const margins = [];
const exactScoreTies = [];
const nearTies = [];
const normalizedWinnerChanges = [];
const normalizedOrderingChanges = [];
const anyGreenOmissionWinnerChanges = [];
let normalizedWinnerChangesAmongNearTies = 0;
let greenOmissionSensitiveAmongNearTies = 0;
const normalizedWinnerTransitions = new Map();
const greenOmissionCounterfactuals = { total: 0, winner_changes: 0, ordering_changes: 0 };
const weakRemovalWinnerChanges = [];
const winnerCounts = { red: 0, blue: 0, green: 0, yellow: 0 };

for (const attempt of completedAttempts) {
  const assigned = assignmentsByAttempt.get(attempt.id);
  const attemptContributions = contributionsFor(answersByAttempt.get(attempt.id));
  const current = rank(attemptContributions);
  winnerCounts[current[0].color] += 1;
  const margin = current[0].score - current[1].score;
  margins.push(margin);
  exactScoreTies.push(Number(margin === 0));
  nearTies.push(Number(margin <= 4));
  weakCounts.push(assigned.filter((item) => weakIds.has(item.question_id)).length);
  const allPoints = attemptContributions.reduce((sum, item) => sum + item.points, 0);
  const weakPoints = attemptContributions.filter((item) => item.weak).reduce((sum, item) => sum + item.points, 0);
  weakPointShares.push(allPoints === 0 ? 0 : weakPoints / allPoints);

  const normalized = normalizedGreenScoreOrder(attemptContributions);
  const normalizedWinnerChanged = normalized[0].color !== current[0].color;
  normalizedWinnerChanges.push(Number(normalizedWinnerChanged));
  if (normalizedWinnerChanged) {
    normalizedWinnerTransitions.set(`${current[0].color}->${normalized[0].color}`, (normalizedWinnerTransitions.get(`${current[0].color}->${normalized[0].color}`) || 0) + 1);
    if (margin <= 4) normalizedWinnerChangesAmongNearTies += 1;
  }
  normalizedOrderingChanges.push(Number(normalized.map((item) => item.color).join(",") !== current.map((item) => item.color).join(",")));

  let attemptWinnerSensitive = false;
  const greenLikert = attemptContributions.filter((item) => item.qtype === "likert" && item.color === "green");
  for (const greenItem of greenLikert) {
    const counterfactual = rank(attemptContributions.filter((item) => item !== greenItem));
    greenOmissionCounterfactuals.total += 1;
    if (counterfactual[0].color !== current[0].color) {
      greenOmissionCounterfactuals.winner_changes += 1;
      attemptWinnerSensitive = true;
    }
    if (counterfactual.map((item) => item.color).join(",") !== current.map((item) => item.color).join(",")) greenOmissionCounterfactuals.ordering_changes += 1;
  }
  anyGreenOmissionWinnerChanges.push(Number(attemptWinnerSensitive));
  if (attemptWinnerSensitive && margin <= 4) greenOmissionSensitiveAmongNearTies += 1;

  const withoutWeak = rank(attemptContributions.filter((item) => !item.weak));
  weakRemovalWinnerChanges.push(Number(withoutWeak[0].color !== current[0].color));
}

const chronological = [...eligibleAttempts].sort((left, right) => String(left.created_at).localeCompare(String(right.created_at)));
const historicalOverlap = { total: [], single: [], likert: [] };
const historicalQuestionFrequency = new Map();
for (let index = 0; index < chronological.length; index += 1) {
  const currentRows = assignmentsByAttempt.get(chronological[index].id);
  for (const row of currentRows) historicalQuestionFrequency.set(row.question_id, (historicalQuestionFrequency.get(row.question_id) || 0) + 1);
  if (index === 0) continue;
  const previousRows = assignmentsByAttempt.get(chronological[index - 1].id);
  historicalOverlap.total.push(intersectionSize(currentRows.map((item) => item.question_id), previousRows.map((item) => item.question_id)));
  historicalOverlap.single.push(intersectionSize(currentRows.filter((item) => item.qtype === "single").map((item) => item.question_id), previousRows.filter((item) => item.qtype === "single").map((item) => item.question_id)));
  historicalOverlap.likert.push(intersectionSize(currentRows.filter((item) => item.qtype === "likert").map((item) => item.question_id), previousRows.filter((item) => item.qtype === "likert").map((item) => item.question_id)));
}

const simulation = readRepoJson("data/v2-research/assessment-assembler-simulation.json");
const designB = simulation.scenarios.find((item) => item.scenario_id === "RESEARCH_B_CAPPED");
const frequencyMap = designB.question_selection_frequency.by_question;

function resolveCandidateMetadata() {
  const cohort01Base = new Map(readRepoJson("data/v2-proposals/cohort-01.json").proposals.map((item) => [item.proposal_id, item]));
  const cohort01Polished = readRepoJson("data/v2-proposals/cohort-01-polished-candidates.json").candidates;
  const cohort01Revisions = new Map(readRepoJson("data/v2-proposals/cohort-01-desirability-balance-revisions.json").revisions.map((item) => [item.proposal_id, item]));
  const cohort01 = cohort01Polished.map((item) => ({ ...cohort01Base.get(item.proposal_id), ...item, ...(cohort01Revisions.get(item.proposal_id) || {}) }));
  const cohort02Base = readRepoJson("data/v2-proposals/cohort-02.json").candidates;
  const cohort02Revisions = new Map(readRepoJson("data/v2-proposals/cohort-02-owner-revisions.json").revisions.map((item) => [item.proposal_id, item]));
  const cohort02 = cohort02Base.map((item) => ({ ...item, ...(cohort02Revisions.get(item.proposal_id) || {}) }));
  const cohort03Base = readRepoJson("data/v2-proposals/cohort-03.json").candidates;
  const cohort03Changes = readRepoJson("data/v2-proposals/cohort-03-owner-revisions.json");
  const cohort03Revisions = new Map(cohort03Changes.revisions.map((item) => [item.proposal_id, item]));
  const deferred = new Set(cohort03Changes.deferred.map((item) => item.proposal_id));
  const cohort03 = cohort03Base.filter((item) => !deferred.has(item.proposal_id)).map((item) => ({ ...item, ...(cohort03Revisions.get(item.proposal_id) || {}) }));
  return [
    ...cohort01.map((item) => ({ ...item, cohort: "cohort_01" })),
    ...cohort02.map((item) => ({ ...item, cohort: "cohort_02" })),
    ...cohort03.map((item) => ({ ...item, cohort: "cohort_03" })),
  ];
}

const candidates = resolveCandidateMetadata();
const candidateFrequencies = candidates.map((item) => ({
  proposal_id: item.proposal_id,
  cohort: item.cohort,
  question_type: item.question_type,
  domain: item.behavioral_domain,
  context: item.context,
  semantic_family: item.semantic_family,
  selected: frequencyMap[item.proposal_id] || 0,
  selection_rate_pct: pct(frequencyMap[item.proposal_id] || 0, designB.iterations),
})).sort((left, right) => right.selected - left.selected || left.proposal_id.localeCompare(right.proposal_id));

const candidateRates = candidateFrequencies.map((item) => item.selection_rate_pct);
const currentFrequencyValues = [...historicalQuestionFrequency.values()];
const domainEntries = Object.entries(designB.average_domain_distribution).sort(([, left], [, right]) => left - right);
const contextEntries = Object.entries(designB.average_context_distribution).sort(([, left], [, right]) => left - right);

const output = {
  schema_version: "1.0.0",
  status: "NON_PRODUCTION_SHADOW_STUDY_COMPLETE",
  generated_at: null,
  source: {
    archive_identity: path.basename(ARCHIVE),
    source_project: manifest.source_project,
    source_schema: manifest.source_schema,
    authoritative_production: manifest.authoritative_production,
    exported_at: manifest.exported_at,
    archive_only_attempts_excluded: archiveOnlyAttemptIds.size,
    source_checks: sourceChecks,
  },
  population: {
    archived_attempts_after_archive_only_exclusion: attempts.length,
    attempts_with_expected_current_50_question_shape: eligibleAttempts.length,
    completed_attempts_with_50_unique_assigned_answers: completedAttempts.length,
    completion_evidence_coverage_pct: pct(completedAttempts.length, eligibleAttempts.length),
  },
  current_historical_evidence: {
    opportunity_shape: { single: 25, likert: { red: 6, blue: 6, yellow: 6, green: 7 }, varies_by_random_selection: false },
    chronological_adjacent_attempt_overlap: {
      total: summarize(historicalOverlap.total),
      single: summarize(historicalOverlap.single),
      likert: summarize(historicalOverlap.likert),
    },
    question_selection_frequency: {
      eligible_attempts: eligibleAttempts.length,
      questions_observed: historicalQuestionFrequency.size,
      selected_count_summary: summarize(currentFrequencyValues),
    },
    completed_results: {
      winner_counts: winnerCounts,
      top_margin: summarize(margins),
      exact_top_score_tie_count: exactScoreTies.reduce((sum, value) => sum + value, 0),
      exact_top_score_tie_pct: pct(exactScoreTies.reduce((sum, value) => sum + value, 0), completedAttempts.length),
      near_tie_margin_lte_4_count: nearTies.reduce((sum, value) => sum + value, 0),
      near_tie_margin_lte_4_pct: pct(nearTies.reduce((sum, value) => sum + value, 0), completedAttempts.length),
    },
  },
  green_opportunity_sensitivity: {
    structural_difference: { max_points_advantage: 4, neutral_uniform_expected_advantage: 2 },
    simulation_only_green_six_sevenths_score_scaling: {
      winner_change_count: normalizedWinnerChanges.reduce((sum, value) => sum + value, 0),
      winner_change_pct: pct(normalizedWinnerChanges.reduce((sum, value) => sum + value, 0), completedAttempts.length),
      winner_transitions: Object.fromEntries([...normalizedWinnerTransitions].sort()),
      winner_changes_among_near_ties: normalizedWinnerChangesAmongNearTies,
      near_tie_sensitivity_pct: pct(normalizedWinnerChangesAmongNearTies, nearTies.reduce((sum, value) => sum + value, 0)),
      full_ordering_change_count: normalizedOrderingChanges.reduce((sum, value) => sum + value, 0),
      full_ordering_change_pct: pct(normalizedOrderingChanges.reduce((sum, value) => sum + value, 0), completedAttempts.length),
      interpretation: "Sensitivity diagnostic only; not a stored rescore and not Design B response evidence.",
    },
    leave_one_observed_green_likert_answer_out: {
      counterfactuals: greenOmissionCounterfactuals.total,
      winner_changes: greenOmissionCounterfactuals.winner_changes,
      winner_change_pct: pct(greenOmissionCounterfactuals.winner_changes, greenOmissionCounterfactuals.total),
      ordering_changes: greenOmissionCounterfactuals.ordering_changes,
      ordering_change_pct: pct(greenOmissionCounterfactuals.ordering_changes, greenOmissionCounterfactuals.total),
      attempts_sensitive_to_at_least_one_omission: anyGreenOmissionWinnerChanges.reduce((sum, value) => sum + value, 0),
      attempts_sensitive_pct: pct(anyGreenOmissionWinnerChanges.reduce((sum, value) => sum + value, 0), completedAttempts.length),
      sensitive_attempts_among_near_ties: greenOmissionSensitiveAmongNearTies,
      near_tie_sensitivity_pct: pct(greenOmissionSensitiveAmongNearTies, nearTies.reduce((sum, value) => sum + value, 0)),
    },
  },
  weak_legacy_evidence: {
    weak_question_count_per_completed_current_attempt: summarize(weakCounts),
    attempts_over_design_b_cap: weakCounts.filter((value) => value > 5).length,
    attempts_over_design_b_cap_pct: pct(weakCounts.filter((value) => value > 5).length, completedAttempts.length),
    weak_points_share: {
      mean_pct: round(100 * mean(weakPointShares), 2),
      p50_pct: round(100 * percentile(weakPointShares, 0.5), 2),
      p95_pct: round(100 * percentile(weakPointShares, 0.95), 2),
    },
    remove_all_weak_answers_winner_change_count: weakRemovalWinnerChanges.reduce((sum, value) => sum + value, 0),
    remove_all_weak_answers_winner_change_pct: pct(weakRemovalWinnerChanges.reduce((sum, value) => sum + value, 0), completedAttempts.length),
    caveat: "Removal sensitivity is not evidence that the weak item caused an incorrect result; it changes opportunity and uses audit flags rather than response calibration.",
  },
  design_b_capped: {
    simulation_attempts: designB.iterations,
    pairwise_overlap: designB.pairwise_overlap,
    within_attempt: designB.within_attempt,
    question_selection_frequency: {
      coefficient_of_variation: designB.question_selection_frequency.coefficient_of_variation,
      all_question_summary: designB.question_selection_frequency.summary,
      candidate_selection_rate_pct: summarize(candidateRates),
      top_15_candidates: candidateFrequencies.slice(0, 15),
      bottom_15_candidates: candidateFrequencies.slice(-15).reverse(),
    },
    average_source_distribution: designB.average_source_distribution,
    average_domain_distribution: designB.average_domain_distribution,
    average_context_distribution: designB.average_context_distribution,
    five_sparsest_domains: Object.fromEntries(domainEntries.slice(0, 5)),
    five_sparsest_contexts: Object.fromEntries(contextEntries.slice(0, 5)),
  },
  proof_boundaries: {
    computationally_supported: [
      "Current opportunity quotas are invariant and structurally favor Green by one Likert item.",
      "Historical assignment/answer distributions, tie margins, weak-item exposure, and sensitivity counterfactuals.",
      "Design B assembly frequency, repeat overlap, semantic collision, and metadata diversity under fixed seeds.",
    ],
    requires_human_response_data: [
      "Whether Design B preserves recognizable dominant/secondary colors.",
      "Reliability, retest stability, ambiguity, gameability, and item discrimination.",
      "Whether weak-item capping improves respondent-perceived quality or empirical validity.",
      "Direct legacy-versus-Design-B result agreement because respondents did not answer the unasked Design B items.",
    ],
  },
  decision: "CURRENT_206_POOL_SUFFICIENT_FOR_HUMAN_VALIDATION",
  production_impact: "NONE",
};

fs.mkdirSync(path.join(ROOT, "data/v2-research"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/v2-research/shadow-study-results.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  status: output.status,
  population: output.population,
  green: output.green_opportunity_sensitivity,
  weak: output.weak_legacy_evidence,
  decision: output.decision,
  production_impact: output.production_impact,
}, null, 2));
