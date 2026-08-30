#!/usr/bin/env node

/**
 * Deterministic, offline VIAGO assessment-assembler research simulator.
 *
 * This module reads repository audit/proposal artifacts only. It does not import
 * application code, connect to Supabase, alter pick_balanced_questions_50, or
 * write outside data/v2-research and analysis.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUTPUT_DIR = path.join(ROOT, "data/v2-research");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));
const hash = (value) => crypto.createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");

class HashRandom {
  constructor(seed) {
    this.seed = String(seed);
    this.counter = 0;
  }
  next() {
    const digest = crypto.createHash("sha256").update(`${this.seed}|${this.counter++}`).digest();
    return digest.readUIntBE(0, 6) / 2 ** 48;
  }
  shuffle(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(this.next() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }
}

class UnionFind {
  constructor(ids) {
    this.parent = new Map(ids.map((id) => [id, id]));
  }
  find(id) {
    if (!this.parent.has(id)) this.parent.set(id, id);
    const parent = this.parent.get(id);
    if (parent !== id) this.parent.set(id, this.find(parent));
    return this.parent.get(id);
  }
  union(left, right) {
    const a = this.find(left);
    const b = this.find(right);
    if (a !== b) this.parent.set(b, a < b ? a : b);
  }
}

const normalizeType = (value) => {
  const normalized = value.toUpperCase().replaceAll("-", "_");
  return normalized === "SINGLE" || normalized === "SINGLE_SELECT" ? "SINGLE_SELECT" : normalized;
};
const severeFlags = new Set([
  "COLOR_ASSIGNMENT_QUESTIONABLE",
  "AMBIGUOUS",
  "DOUBLE_BARRELED",
  "SOCIAL_DESIRABILITY_RISK",
  "SEMANTICALLY_OVERLAPPING",
]);
const workContexts = new Set([
  "work-business", "team", "leadership", "customer-service", "customer-pressure",
  "onboarding", "team-decision", "technology", "creative-work", "creative-collaboration",
]);

function normalizeDomain(value) {
  return ["problem-framing", "everyday-problem-solving"].includes(value) ? "problem-solving-learning" : value;
}

function normalizeContext(value) {
  if (["team", "team-decision", "onboarding", "creative-collaboration"].includes(value)) return "team";
  if (["work-business", "customer-service", "customer-pressure", "technology", "creative-work"].includes(value)) return "work-business";
  if (["unfamiliar-situation", "unfamiliar-social-situation"].includes(value)) return "unfamiliar-situation";
  if (["conflict", "family-memory"].includes(value)) return "conflict";
  if (["pressure"].includes(value)) return "pressure";
  if (["leadership"].includes(value)) return "leadership";
  if (["communication", "everyday-recommendation"].includes(value)) return "communication";
  if (["planning", "travel", "leisure-travel", "personal-travel", "household-purchase", "family-tradition", "home", "home-transition", "daily-routine"].includes(value)) return "planning";
  if (["social", "friendship", "personal-relationship", "group-recreation", "community", "community-event", "community-belonging", "volunteer"].includes(value)) return "social";
  return "personal-preference";
}

function resolveCohort01() {
  const metadata = new Map(read("data/v2-proposals/cohort-01.json").proposals.map((item) => [item.proposal_id, item]));
  const polished = read("data/v2-proposals/cohort-01-polished-candidates.json").candidates;
  const revisions = new Map(read("data/v2-proposals/cohort-01-desirability-balance-revisions.json").revisions.map((item) => [item.proposal_id, item]));
  return polished.map((item) => ({ ...metadata.get(item.proposal_id), ...item, ...(revisions.get(item.proposal_id) ?? {}) }));
}

function resolveCohort02() {
  const base = read("data/v2-proposals/cohort-02.json").candidates;
  const revisions = new Map(read("data/v2-proposals/cohort-02-owner-revisions.json").revisions.map((item) => [item.proposal_id, item]));
  return base.map((item) => ({ ...item, ...(revisions.get(item.proposal_id) ?? {}) }));
}

function resolveCohort03() {
  const base = read("data/v2-proposals/cohort-03.json").candidates;
  const amendment = read("data/v2-proposals/cohort-03-owner-revisions.json");
  const revisions = new Map(amendment.revisions.map((item) => [item.proposal_id, item]));
  const deferred = new Set(amendment.deferred.map((item) => item.proposal_id));
  return base.filter((item) => !deferred.has(item.proposal_id)).map((item) => ({ ...item, ...(revisions.get(item.proposal_id) ?? {}) }));
}

function candidateToResearch(item, cohort) {
  const qtype = normalizeType(item.question_type);
  const options = qtype === "SINGLE_SELECT"
    ? item.options.map((option, index) => ({ id: `${item.proposal_id}:option:${index + 1}`, mapping: option.mapping, label: option.label }))
    : [];
  return {
    id: item.proposal_id,
    source: cohort,
    qtype,
    color: qtype === "LIKERT" ? (item.intended_mapping ?? item.intended_color) : null,
    domain: normalizeDomain(item.behavioral_domain),
    context: normalizeContext(item.context),
    raw_context: item.context,
    semantic_family_label: `${cohort}:${item.semantic_family}`,
    prompt: item.question ?? item.wording,
    options,
    confidence: "OWNER_REVIEWED",
    quality_flags: [],
    weak_legacy: false,
    workplace: workContexts.has(item.context),
  };
}

function buildBank() {
  const audit = read("data/v2-audit/current-question-audit.json");
  const legacy = audit.questions.map((item) => ({
    id: item.canonical_id,
    source: "legacy_active",
    qtype: normalizeType(item.question_type),
    color: item.assigned_color,
    domain: normalizeDomain(item.proposed_taxonomy.behavioral_domain),
    context: normalizeContext(item.proposed_taxonomy.context),
    raw_context: item.proposed_taxonomy.context,
    semantic_family_label: `legacy:${item.canonical_id}`,
    prompt: item.english,
    options: item.options.map((option) => ({
      id: option.canonical_id,
      mapping: Object.entries(option.weights).find(([, value]) => value > 0)?.[0] ?? null,
      label: option.english,
    })),
    confidence: item.color_assignment_confidence,
    quality_flags: item.quality_classifications,
    weak_legacy: item.color_assignment_confidence === "LOW" || item.quality_classifications.some((flag) => severeFlags.has(flag)),
    workplace: workContexts.has(item.proposed_taxonomy.context),
  }));
  const candidates = [
    ...resolveCohort01().map((item) => candidateToResearch(item, "cohort_01")),
    ...resolveCohort02().map((item) => candidateToResearch(item, "cohort_02")),
    ...resolveCohort03().map((item) => candidateToResearch(item, "cohort_03")),
  ];
  if (legacy.length !== 151 || candidates.length !== 55) throw new Error(`Unexpected bank counts ${legacy.length}+${candidates.length}.`);
  const bank = [...legacy, ...candidates];
  const union = new UnionFind(bank.map((item) => item.id));

  for (const pair of audit.semantic_overlap_pairs) union.union(pair.left_id, pair.right_id);
  const byFamily = new Map();
  for (const item of candidates) {
    const key = item.semantic_family_label;
    if (!byFamily.has(key)) byFamily.set(key, []);
    byFamily.get(key).push(item.id);
  }
  for (const ids of byFamily.values()) for (let index = 1; index < ids.length; index += 1) union.union(ids[0], ids[index]);

  const deliberateSemanticEdges = [
    ["C01-S-07", "C02-S-15"],
    ["C01-S-03", "C02-S-03"], ["C01-S-03", "C02-S-08"],
    ["C01-S-01", "C02-S-07"],
    ["C02-L-B-02", "66083e12-2f11-4849-976a-7e9d7edebc38"],
    ["C01-L-B-03", "16d86da0-614b-4c2f-a935-51e08ab09baa"],
    ["C01-L-B-03", "a9e9ac76-174c-4b12-b3ea-32edcf609761"],
    ["C01-L-R-05", "d60128b7-cef9-42f3-8841-3b4d024cb71b"],
    ["C01-L-G-01", "4ec48535-9510-4e86-9ee7-a6ea509af280"],
    ["C02-L-G-02", "4d694041-2641-4635-aa79-e5dc6c188682"],
    ["C03-S-01", "C03-L-R-01"],
    ["C03-S-03", "C02-S-05"],
    ["C03-S-04", "C02-S-16"],
    ["C03-S-05", "C01-L-B-02"],
    ["C03-S-07", "C03-L-G-01"],
    ["C03-S-10", "C02-L-Y-01"],
    ["C03-L-Y-01", "C02-L-Y-02"],
  ];
  for (const [left, right] of deliberateSemanticEdges) union.union(left, right);
  for (const item of bank) item.semantic_family = `family:${union.find(item.id)}`;

  const bankVersion = `research-bank-${hash(bank.map((item) => ({
    id: item.id, qtype: item.qtype, color: item.color, domain: item.domain, context: item.context,
    family: item.semantic_family, source: item.source, weak: item.weak_legacy,
  }))).slice(0, 16)}`;
  return { bank, bankVersion };
}

const architectures = {
  A_CURRENT_25_25_6_6_6_7: { single: 25, likert: { red: 6, blue: 6, yellow: 6, green: 7 } },
  B_EQUAL_24L_26S: { single: 26, likert: { red: 6, blue: 6, yellow: 6, green: 6 } },
  C_EQUAL_LIKERT_RICH_28L_22S: { single: 22, likert: { red: 7, blue: 7, yellow: 7, green: 7 } },
};

const assemblerVersion = "viago-research-assembler-1.0.0";
const constraints = {
  semantic_family_max: 1,
  weak_legacy_cap: 5,
  workplace_max: 8,
  minimum_unique_domains: 12,
  minimum_unique_contexts: 8,
};

function admissionAllows(item, mode) {
  return mode !== "exclude_weak_legacy" || !item.weak_legacy;
}

function buildSlots(architecture, rng) {
  const slots = [];
  for (const [color, count] of Object.entries(architecture.likert)) {
    for (let index = 0; index < count; index += 1) slots.push({ qtype: "LIKERT", color });
  }
  for (let index = 0; index < architecture.single; index += 1) slots.push({ qtype: "SINGLE_SELECT", color: null });
  return rng.shuffle(slots);
}

function assembleResearchAttempt({ bank, bankVersion, architectureId, admissionMode, seed, retry = 0 }) {
  const architecture = architectures[architectureId];
  const rng = new HashRandom(`${bankVersion}|${assemblerVersion}|${architectureId}|${admissionMode}|${seed}|retry:${retry}`);
  const slots = buildSlots(architecture, rng);
  const selected = [];
  const selectedIds = new Set();
  const families = new Set();
  const domainCounts = new Map();
  const contextCounts = new Map();
  let weakCount = 0;
  let workCount = 0;

  for (const slot of slots) {
    let eligible = bank.filter((item) => (
      admissionAllows(item, admissionMode)
      && item.qtype === slot.qtype
      && (slot.color === null || item.color === slot.color)
      && !selectedIds.has(item.id)
      && !families.has(item.semantic_family)
      && (!item.workplace || workCount < constraints.workplace_max)
      && (admissionMode !== "cap_weak_legacy" || !item.weak_legacy || weakCount < constraints.weak_legacy_cap)
    ));
    if (eligible.length === 0) throw new Error(`No eligible item for ${architectureId}/${admissionMode}/${seed}/${JSON.stringify(slot)}.`);
    eligible = eligible.map((item) => {
      const score = rng.next();
      return { item, score };
    }).sort((left, right) => left.score - right.score || left.item.id.localeCompare(right.item.id));
    const item = eligible[0].item;
    selected.push(item);
    selectedIds.add(item.id);
    families.add(item.semantic_family);
    domainCounts.set(item.domain, (domainCounts.get(item.domain) ?? 0) + 1);
    contextCounts.set(item.context, (contextCounts.get(item.context) ?? 0) + 1);
    if (item.weak_legacy) weakCount += 1;
    if (item.workplace) workCount += 1;
  }

  const ordered = rng.shuffle(selected).map((item, index) => ({
    position: index + 1,
    question_id: item.id,
    source: item.source,
    qtype: item.qtype,
    color: item.color,
    domain: item.domain,
    context: item.context,
    raw_context: item.raw_context,
    semantic_family: item.semantic_family,
    weak_legacy: item.weak_legacy,
    option_order: item.qtype === "SINGLE_SELECT" ? rng.shuffle(item.options.map((option) => option.id)) : [],
  }));
  const uniqueDomains = new Set(ordered.map((item) => item.domain)).size;
  const uniqueContexts = new Set(ordered.map((item) => item.context)).size;
  if (uniqueDomains < constraints.minimum_unique_domains || uniqueContexts < constraints.minimum_unique_contexts) {
    if (retry >= 99) throw new Error(`Unable to satisfy diversity minima for ${architectureId}/${admissionMode}/${seed}.`);
    return assembleResearchAttempt({ bank, bankVersion, architectureId, admissionMode, seed, retry: retry + 1 });
  }
  return {
    bank_version: bankVersion,
    assembler_version: assemblerVersion,
    architecture: architectureId,
    admission_mode: admissionMode,
    seed,
    construction_retry: retry,
    manifest_hash: hash(ordered),
    questions: ordered,
  };
}

function assembleProductionBaseline({ bank, bankVersion, seed }) {
  const legacy = bank.filter((item) => item.source === "legacy_active");
  const architecture = architectures.A_CURRENT_25_25_6_6_6_7;
  const rng = new HashRandom(`${bankVersion}|production-baseline-model|${seed}`);
  const selected = [];
  for (const [color, count] of Object.entries(architecture.likert)) {
    selected.push(...rng.shuffle(legacy.filter((item) => item.qtype === "LIKERT" && item.color === color)).slice(0, count));
  }
  selected.push(...rng.shuffle(legacy.filter((item) => item.qtype === "SINGLE_SELECT")).slice(0, architecture.single));
  const ordered = rng.shuffle(selected).map((item, index) => ({
    position: index + 1,
    question_id: item.id,
    source: item.source,
    qtype: item.qtype,
    color: item.color,
    domain: item.domain,
    context: item.context,
    raw_context: item.raw_context,
    semantic_family: item.semantic_family,
    weak_legacy: item.weak_legacy,
    option_order: item.qtype === "SINGLE_SELECT" ? rng.shuffle(item.options.map((option) => option.id)) : [],
  }));
  return {
    bank_version: "production-legacy-151-audit-snapshot",
    assembler_version: "production-selector-independent-model",
    architecture: "A_CURRENT_25_25_6_6_6_7",
    admission_mode: "legacy_normal",
    seed,
    manifest_hash: hash(ordered),
    questions: ordered,
  };
}

const intersectionSize = (left, right) => {
  const rightSet = new Set(right);
  return left.reduce((count, value) => count + (rightSet.has(value) ? 1 : 0), 0);
};
const average = (values) => values.reduce((sum, value) => sum + value, 0) / (values.length || 1);
const percentile = (values, p) => {
  const ordered = [...values].sort((a, b) => a - b);
  return ordered[Math.min(ordered.length - 1, Math.max(0, Math.floor((ordered.length - 1) * p)))];
};
const summarize = (values) => ({
  min: Math.min(...values),
  p05: percentile(values, 0.05),
  mean: Number(average(values).toFixed(4)),
  p95: percentile(values, 0.95),
  max: Math.max(...values),
});

function simulateScenario({ id, iterations, build }) {
  const frequencies = new Map();
  const overlaps = { total: [], single: [], likert: [], semantic: [] };
  const uniqueDomains = [];
  const uniqueContexts = [];
  const workplaceCounts = [];
  const weakCounts = [];
  const semanticCollisions = [];
  const domainTotals = new Map();
  const contextTotals = new Map();
  const sourceTotals = new Map();
  let previous = null;
  let first = null;
  for (let index = 0; index < iterations; index += 1) {
    const manifest = build(`${id}:${String(index).padStart(6, "0")}`);
    if (!first) first = manifest;
    const questions = manifest.questions;
    const ids = questions.map((item) => item.question_id);
    const singles = questions.filter((item) => item.qtype === "SINGLE_SELECT").map((item) => item.question_id);
    const likerts = questions.filter((item) => item.qtype === "LIKERT").map((item) => item.question_id);
    const families = questions.map((item) => item.semantic_family);
    for (const item of questions) {
      frequencies.set(item.question_id, (frequencies.get(item.question_id) ?? 0) + 1);
      domainTotals.set(item.domain, (domainTotals.get(item.domain) ?? 0) + 1);
      contextTotals.set(item.context, (contextTotals.get(item.context) ?? 0) + 1);
      sourceTotals.set(item.source, (sourceTotals.get(item.source) ?? 0) + 1);
    }
    uniqueDomains.push(new Set(questions.map((item) => item.domain)).size);
    uniqueContexts.push(new Set(questions.map((item) => item.context)).size);
    workplaceCounts.push(questions.filter((item) => workContexts.has(item.context)).length);
    weakCounts.push(questions.filter((item) => item.weak_legacy).length);
    semanticCollisions.push(questions.length - new Set(families).size);
    if (previous) {
      overlaps.total.push(intersectionSize(ids, previous.ids));
      overlaps.single.push(intersectionSize(singles, previous.singles));
      overlaps.likert.push(intersectionSize(likerts, previous.likerts));
      overlaps.semantic.push(intersectionSize([...new Set(families)], previous.families));
    }
    previous = { ids, singles, likerts, families: [...new Set(families)] };
  }
  const frequencyValues = [...frequencies.values()];
  const meanFrequency = average(frequencyValues);
  const frequencyStd = Math.sqrt(average(frequencyValues.map((value) => (value - meanFrequency) ** 2)));
  return {
    scenario_id: id,
    iterations,
    first_manifest_hash: first.manifest_hash,
    pairwise_overlap: {
      total: summarize(overlaps.total),
      single: summarize(overlaps.single),
      likert: summarize(overlaps.likert),
      semantic_family: summarize(overlaps.semantic),
    },
    within_attempt: {
      unique_domains: summarize(uniqueDomains),
      unique_contexts: summarize(uniqueContexts),
      workplace_questions: summarize(workplaceCounts),
      weak_legacy_questions: summarize(weakCounts),
      semantic_family_collisions: summarize(semanticCollisions),
    },
    question_selection_frequency: {
      selected_question_count: frequencies.size,
      summary: summarize(frequencyValues),
      coefficient_of_variation: Number((frequencyStd / meanFrequency).toFixed(4)),
      by_question: Object.fromEntries([...frequencies].sort(([left], [right]) => left.localeCompare(right))),
    },
    average_domain_distribution: Object.fromEntries([...domainTotals].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => [key, Number((value / iterations).toFixed(4))])),
    average_context_distribution: Object.fromEntries([...contextTotals].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => [key, Number((value / iterations).toFixed(4))])),
    average_source_distribution: Object.fromEntries([...sourceTotals].sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => [key, Number((value / iterations).toFixed(4))])),
  };
}

function scoringComparison() {
  const result = {};
  for (const [id, architecture] of Object.entries(architectures)) {
    result[id] = {};
    for (const color of ["red", "blue", "yellow", "green"]) {
      const likertCount = architecture.likert[color];
      result[id][color] = {
        likert_opportunities: likertCount,
        single_opportunities: architecture.single,
        theoretical_max_raw: 4 * (likertCount + architecture.single),
        neutral_uniform_expected_raw: 2 * likertCount + architecture.single,
      };
    }
  }
  result.A_CURRENT_25_25_6_6_6_7.green_likert_scaled_to_six_equivalent = {
    formula: "single_raw + (likert_raw / 7) * 6",
    theoretical_max: 124,
    neutral_uniform_expected: 37,
    status: "simulation_only_not_authoritative",
  };
  return result;
}

function main() {
  const { bank, bankVersion } = buildBank();
  if (process.argv.includes("--verify-examples")) {
    const saved = read("data/v2-research/example-attempt-manifests.json");
    if (saved.bank_version !== bankVersion || saved.assembler_version !== assemblerVersion) throw new Error("Saved manifest version mismatch.");
    const verified = saved.manifests.map((manifest) => {
      const replay = assembleResearchAttempt({
        bank,
        bankVersion,
        architectureId: manifest.architecture,
        admissionMode: manifest.admission_mode,
        seed: manifest.seed,
      });
      if (JSON.stringify(replay) !== JSON.stringify(manifest)) throw new Error(`Replay mismatch for ${manifest.seed}.`);
      return { seed: manifest.seed, manifest_hash: manifest.manifest_hash, replayed_exactly: true };
    });
    console.log(JSON.stringify({ status: "PASS", bank_version: bankVersion, assembler_version: assemblerVersion, verified }, null, 2));
    return;
  }
  const iterations = 5000;
  const scenarioDefinitions = [
    {
      id: "PRODUCTION_BASELINE_LEGACY_A_NORMAL",
      build: (seed) => assembleProductionBaseline({ bank, bankVersion, seed }),
    },
    {
      id: "RESEARCH_A_CAPPED",
      build: (seed) => assembleResearchAttempt({ bank, bankVersion, architectureId: "A_CURRENT_25_25_6_6_6_7", admissionMode: "cap_weak_legacy", seed }),
    },
    {
      id: "RESEARCH_B_NORMAL",
      build: (seed) => assembleResearchAttempt({ bank, bankVersion, architectureId: "B_EQUAL_24L_26S", admissionMode: "admit_normally", seed }),
    },
    {
      id: "RESEARCH_B_CAPPED",
      build: (seed) => assembleResearchAttempt({ bank, bankVersion, architectureId: "B_EQUAL_24L_26S", admissionMode: "cap_weak_legacy", seed }),
    },
    {
      id: "RESEARCH_B_EXCLUDED",
      build: (seed) => assembleResearchAttempt({ bank, bankVersion, architectureId: "B_EQUAL_24L_26S", admissionMode: "exclude_weak_legacy", seed }),
    },
    {
      id: "RESEARCH_C_CAPPED",
      build: (seed) => assembleResearchAttempt({ bank, bankVersion, architectureId: "C_EQUAL_LIKERT_RICH_28L_22S", admissionMode: "cap_weak_legacy", seed }),
    },
  ];

  const scenarios = scenarioDefinitions.map((definition) => simulateScenario({ ...definition, iterations }));
  const exampleManifests = Array.from({ length: 5 }, (_, index) => assembleResearchAttempt({
    bank,
    bankVersion,
    architectureId: "B_EQUAL_24L_26S",
    admissionMode: "cap_weak_legacy",
    seed: `owner-example-${String(index + 1).padStart(3, "0")}`,
  }));

  const bankProfile = {
    bank_version: bankVersion,
    total: bank.length,
    by_source: Object.fromEntries([...bank.reduce((map, item) => map.set(item.source, (map.get(item.source) ?? 0) + 1), new Map())].sort()),
    by_type: Object.fromEntries([...bank.reduce((map, item) => map.set(item.qtype, (map.get(item.qtype) ?? 0) + 1), new Map())].sort()),
    likert_by_color: Object.fromEntries(["red", "blue", "yellow", "green"].map((color) => [color, bank.filter((item) => item.qtype === "LIKERT" && item.color === color).length])),
    single_select: bank.filter((item) => item.qtype === "SINGLE_SELECT").length,
    weak_legacy: bank.filter((item) => item.weak_legacy).length,
    admitted_after_strict_exclusion: bank.filter((item) => !item.weak_legacy).length,
  };

  const output = {
    schema_version: "1.0.0",
    status: "NON_PRODUCTION_RESEARCH_COMPLETE",
    generated_at: null,
    bank_profile: bankProfile,
    assembler: {
      assembler_version: assemblerVersion,
      deterministic_key: ["bank_version", "assembler_version", "architecture", "admission_mode", "seed"],
      randomness: "SHA-256 counter stream; no AI runtime selection",
      constraints,
      architectures,
      weak_legacy_definition: "LOW assignment confidence OR any of COLOR_ASSIGNMENT_QUESTIONABLE, AMBIGUOUS, DOUBLE_BARRELED, SOCIAL_DESIRABILITY_RISK, SEMANTICALLY_OVERLAPPING",
    },
    scoring_comparison: scoringComparison(),
    scenarios,
    example_manifests: exampleManifests,
    production_impact: "NONE",
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, "assessment-assembler-simulation.json"), `${JSON.stringify(output, null, 2)}\n`);
  fs.writeFileSync(path.join(OUTPUT_DIR, "example-attempt-manifests.json"), `${JSON.stringify({
    schema_version: "1.0.0",
    bank_version: bankVersion,
    assembler_version: assemblerVersion,
    manifests: exampleManifests,
    production_impact: "NONE",
  }, null, 2)}\n`);
  console.log(JSON.stringify({ bankProfile, scenarios: scenarios.map((item) => ({
    id: item.scenario_id,
    overlap: item.pairwise_overlap,
    within_attempt: item.within_attempt,
    frequency_cv: item.question_selection_frequency.coefficient_of_variation,
    sources: item.average_source_distribution,
  })), example_manifest_hashes: exampleManifests.map((item) => item.manifest_hash) }, null, 2));
}

main();
