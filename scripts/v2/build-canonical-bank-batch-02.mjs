#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const read = (relative) => JSON.parse(fs.readFileSync(path.join(ROOT, relative), "utf8"));

function resolvedCandidates() {
  const c1Base = new Map(read("data/v2-proposals/cohort-01.json").proposals.map((item) => [item.proposal_id, item]));
  const c1Revisions = new Map(read("data/v2-proposals/cohort-01-desirability-balance-revisions.json").revisions.map((item) => [item.proposal_id, item]));
  const c1 = read("data/v2-proposals/cohort-01-polished-candidates.json").candidates.map((item) => ({ ...c1Base.get(item.proposal_id), ...item, ...(c1Revisions.get(item.proposal_id) || {}), origin: "COHORT_01" }));
  const c2Revisions = new Map(read("data/v2-proposals/cohort-02-owner-revisions.json").revisions.map((item) => [item.proposal_id, item]));
  const c2 = read("data/v2-proposals/cohort-02.json").candidates.map((item) => ({ ...item, ...(c2Revisions.get(item.proposal_id) || {}), origin: "COHORT_02" }));
  const c3Changes = read("data/v2-proposals/cohort-03-owner-revisions.json");
  const c3Revisions = new Map(c3Changes.revisions.map((item) => [item.proposal_id, item]));
  const deferred = new Set(c3Changes.deferred.map((item) => item.proposal_id));
  const c3 = read("data/v2-proposals/cohort-03.json").candidates.filter((item) => !deferred.has(item.proposal_id)).map((item) => ({ ...item, ...(c3Revisions.get(item.proposal_id) || {}), origin: "COHORT_03" }));
  return new Map([...c1, ...c2, ...c3].map((item) => [item.proposal_id, item]));
}

const allPairs = ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"];
const decisions = [
  { id: "27df6129-27a7-42e5-8cbb-12fb5007190a", disposition: "REPLACE", replacement: "C03-S-09", traits: ["achievement", "energy", "belonging", "consistency"], domain: "general-preference", context: "recreation", tones: ["success-enjoyment", "social-setting"], orientation: "SELF_PREFERENCE", family: "reward-from-casual-activity", pairs: allPairs, measures: "Which source of reward naturally sustains interest in an ordinary activity.", tradeoff: "challenge vs. experience vs. connection vs. mastery", why: "The legacy options make effectiveness, kindness, and correctness virtues while assigning Blue to being liked; the candidate offers four attractive motives." },
  { id: "28c5ada7-9157-449c-927b-212170e6296f", disposition: "REPLACE", replacement: "C02-L-G-01", traits: ["evidence", "predictability"], domain: "decision-making", context: "general-cross-context", tones: ["competing-alternatives", "uncertainty"], orientation: "SELF_PREFERENCE", family: "consequences-before-commitment", pairs: ["RED_GREEN", "BLUE_GREEN"], measures: "Whether comparing likely consequences feels more trustworthy than choosing on instinct.", tradeoff: "consequence comparison vs. instinctive commitment", why: "The approved candidate gives the same Green construct a clearer opposing preference and better desirability balance." },
  { id: "29efc415-38e9-408a-aa7b-4d46f6996c20", disposition: "REPLACE", replacement: "C01-L-R-01", traits: ["decisive-ownership", "momentum"], domain: "leadership-ownership", context: "team", tones: ["uncertainty", "pressure"], orientation: "SELF_ACTION", family: "ownership-when-decision-stalls", pairs: ["RED_YELLOW", "RED_GREEN"], measures: "Whether taking responsibility for a direction feels preferable to continued group hesitation.", tradeoff: "decisive ownership vs. further consultation", why: "The legacy wording rewards responsibility as a virtue; the candidate exposes the Red motive and legitimate alternative." },
  { id: "2defbffe-826b-42a3-a027-dcfc98677739", disposition: "KEEP_EXACTLY", traits: ["consistency"], domain: "work-execution", context: "work-business", tones: ["routine-stability"], orientation: "SELF_PREFERENCE", family: "steady-pace-versus-energy-bursts", pairs: ["BLUE_GREEN"], measures: "Whether a steady working rhythm feels more natural than bursts of energy.", tradeoff: "steady consistency vs. variable energy bursts", why: "The item states a genuine pace preference without making either working style more competent or responsible." },
  { id: "2df82369-1df5-407a-be21-1dff3ccb59d5", disposition: "REWORD", proposed: "When plans change unexpectedly, I’m more comfortable rebuilding clarity before acting than exploring the change as I go.", traits: ["clarity", "predictability"], domain: "change-risk", context: "general-cross-context", tones: ["change", "uncertainty"], orientation: "SELF_PREFERENCE", family: "clarity-after-unexpected-change", pairs: ["RED_GREEN", "BLUE_GREEN"], measures: "Whether restoring clarity naturally precedes action after unexpected change.", tradeoff: "rebuilding clarity vs. exploring change in motion", why: "The current item measures unease or anxiety; the revision measures the established Green preference that could underlie the response." },
  { id: "30031eb0-f025-4b1a-b4e6-a9455967f735", disposition: "KEEP_EXACTLY", traits: ["loyalty", "support"], domain: "follow-through-recovery", context: "general-cross-context", tones: ["long-term-commitment"], orientation: "RESPONSE_TO_OTHERS", family: "follow-through-when-relied-upon", pairs: ["RED_YELLOW", "BLUE_YELLOW"], measures: "Whether being relied upon naturally strengthens follow-through motivation.", tradeoff: "relational commitment vs. self-directed motivation", why: "The wording directly measures Yellow loyalty as motivation without claiming that reliable behavior belongs only to Yellow." },
  { id: "32eff408-9a02-4372-8f53-0289f79f07ae", disposition: "RETIRE", traits: ["momentum"], domain: "problem-solving", context: "general-cross-context", tones: ["uncertainty"], orientation: "SELF_PREFERENCE", family: "generic-problem-confidence", pairs: ["RED_GREEN"], measures: "Confidence in handling problems as they arise.", tradeoff: "improvised handling vs. prior preparation", why: "The statement measures self-confidence and perceived competence rather than an established Red motivation." },
  { id: "34202350-60a2-45e1-b4b8-bf0fa471d020", disposition: "REPLACE", replacement: "C03-S-05", traits: ["visible-results", "expression", "relational-depth", "learning"], domain: "social-interaction", context: "unfamiliar-social-situation", tones: ["social-setting", "new-unfamiliar"], orientation: "SELF_PREFERENCE", family: "preferred-new-social-contact", pairs: allPairs, measures: "What kind of interaction naturally attracts someone in an unfamiliar social setting.", tradeoff: "useful focus vs. expressive breadth vs. trust vs. depth of understanding", why: "Meaningful conversation versus small talk can measure introversion; the candidate distinguishes four positive interaction preferences." },
  { id: "36041a0f-a82d-4c66-96f1-973ea25a3daf", disposition: "REWORD", proposed: "The beginning of a new idea energizes me more than carrying the same plan through its later stages.", traits: ["novelty", "energy"], domain: "follow-through-recovery", context: "personal-project", tones: ["opportunity", "long-term-commitment"], orientation: "SELF_PREFERENCE", family: "new-idea-energy-versus-later-stage", pairs: ["RED_BLUE", "BLUE_GREEN", "BLUE_YELLOW"], measures: "Whether novelty at the beginning is more energizing than sustained continuation.", tradeoff: "new-idea energy vs. later-stage continuation", why: "The current wording asks respondents to admit poor follow-through; the revision preserves the preference without turning it into a character flaw." },
  { id: "3b6479df-3e88-473b-85d7-731fe1083b4a", disposition: "REWORD", proposed: "When a task feels large, I prefer to define manageable steps before I begin rather than find the structure while working.", traits: ["structure", "clarity"], domain: "planning", context: "general-cross-context", tones: ["uncertainty", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "steps-before-starting", pairs: ["RED_GREEN", "BLUE_GREEN"], measures: "Whether defining steps before action feels more natural than discovering structure during action.", tradeoff: "upfront sequencing vs. emergent structure", why: "Breaking tasks into steps is a learned competency; the revision compares two workable planning preferences." },
  { id: "3b9a1aa5-09ba-4bb9-b3c9-c8033791974c", disposition: "RETIRE", traits: ["evidence"], domain: "change-risk", context: "general-cross-context", tones: ["change", "uncertainty"], orientation: "SELF_PREFERENCE", family: "consequences-before-commitment", pairs: ["RED_GREEN", "BLUE_GREEN"], measures: "Desire to understand every option before change.", tradeoff: "exhaustive understanding vs. timely change", why: "The absolute 'every option fully' framing rewards impossible thoroughness and duplicates the stronger C02-L-G-01 replacement already proposed." },
  { id: "3bb2ff0b-1bac-4bc0-a4d4-5e75387751f0", disposition: "REPLACE", replacement: "C03-S-02", traits: ["achievement", "novelty", "support", "coherence"], domain: "learning", context: "hobbies", tones: ["new-unfamiliar", "independent-activity"], orientation: "SELF_PREFERENCE", family: "entry-into-unfamiliar-hobby", pairs: allPairs, measures: "Which motivation naturally guides entry into an unfamiliar learning experience.", tradeoff: "concrete result vs. exploration vs. shared encouragement vs. fundamentals", why: "The candidate replaces compound, virtue-loaded learning claims with four plausible starting preferences in ordinary life." },
  { id: "3dc580d8-8ac6-4af0-b4c4-7dc2559f9fed", disposition: "RETIRE", traits: ["decisive-ownership"], domain: "conflict", context: "general-cross-context", tones: ["disagreement"], orientation: "SELF_ACTION", family: "honesty-versus-avoidance", pairs: ["RED_YELLOW", "RED_GREEN"], measures: "Willingness to have an honest difficult conversation.", tradeoff: "honest confrontation vs. avoidance", why: "Honesty is a universal virtue and avoidance is a pejorative alternative; directness alone is explicitly not Red evidence." },
  { id: "4043bf30-62cb-4968-ba6e-85c7a554d894", disposition: "REWORD", proposed: "In close relationships, I prefer sharing feelings as they arise rather than waiting until I have processed them privately.", traits: ["expression"], domain: "communication-expression", context: "close-relationship", tones: ["ordinary-calm", "competing-alternatives"], orientation: "INTERPERSONAL", family: "expressive-immediacy-versus-private-processing", pairs: ["BLUE_GREEN", "BLUE_YELLOW"], measures: "Whether immediate emotional expression feels more connecting than private processing first.", tradeoff: "expressive immediacy vs. private processing", why: "The current contrast makes boundaries sound formal and cold; the revision gives both emotional styles a legitimate rationale." },
  { id: "40ff71e9-a36f-4f66-8193-e8a7aef0b6c3", disposition: "RETIRE", traits: ["evidence", "predictability"], domain: "decision-making", context: "general-cross-context", tones: ["competing-alternatives"], orientation: "SELF_PREFERENCE", family: "consequences-before-commitment", pairs: ["RED_GREEN", "BLUE_GREEN"], measures: "Preference to consider outcomes before committing.", tradeoff: "consequence review vs. commitment", why: "This is an exact duplicate of Question 27, whose construct is already proposed for replacement by C02-L-G-01." },
  { id: "44a6b54a-9864-4137-bdec-50ba8cbb0bb5", disposition: "KEEP_EXACTLY", traits: ["belonging", "support"], domain: "relationships-support", context: "team", tones: ["ordinary-calm"], orientation: "SELF_PREFERENCE", family: "connection-as-task-motivation", pairs: ["RED_YELLOW", "BLUE_YELLOW"], measures: "Whether connection to the people involved is a stronger motivator than the task alone.", tradeoff: "relational connection vs. task-only motivation", why: "The wording identifies a Yellow source of motivation without claiming that connection or teamwork is morally superior." },
  { id: "4a55dabb-d73c-41a5-88c1-b997f91ff950", disposition: "RETIRE", traits: ["clarity"], domain: "social-interaction", context: "general-cross-context", tones: ["social-setting"], orientation: "SELF_PREFERENCE", family: "social-stimulation-tolerance", pairs: ["BLUE_GREEN", "BLUE_YELLOW"], measures: "How quickly large or noisy gatherings become draining.", tradeoff: "high social stimulation vs. smaller quiet settings", why: "The item primarily measures introversion, sensory tolerance, or fatigue rather than a Green evidence or structure preference." },
  { id: "4a7016b7-648a-45a7-8b3b-0047215b2270", disposition: "KEEP_EXACTLY", traits: ["trust", "harmony"], domain: "relationships-support", context: "general-cross-context", tones: ["pressure", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "trust-versus-speed", pairs: ["RED_YELLOW", "YELLOW_GREEN"], measures: "Whether preserving trust naturally outweighs speed.", tradeoff: "trust maintenance vs. speed", why: "The item states a real cost and directly measures an established Yellow relational preference rather than generic kindness." },
  { id: "4afceb5f-2cbf-4027-91b4-2fe0440b5225", disposition: "REWORD", proposed: "When others are relying on me, preserving a dependable commitment matters more than switching to a more appealing option.", traits: ["loyalty", "continuity"], domain: "follow-through-recovery", context: "general-cross-context", tones: ["long-term-commitment", "competing-alternatives"], orientation: "RESPONSE_TO_OTHERS", family: "commitment-versus-more-appealing-option", pairs: ["BLUE_YELLOW", "RED_YELLOW"], measures: "Whether loyalty to an existing commitment outweighs a more appealing alternative.", tradeoff: "dependable commitment vs. appealing new option", why: "The current statement can measure generic conscientiousness; the revision makes the Yellow continuity motive and competing preference explicit." },
  { id: "4d694041-2641-4635-aa79-e5dc6c188682", disposition: "KEEP_EXACTLY", traits: ["visible-results", "momentum"], domain: "organization-process", context: "general-cross-context", tones: ["competing-alternatives"], orientation: "SELF_ATTENTION", family: "results-versus-exact-process", pairs: ["RED_GREEN"], measures: "Whether results receive more attention than exact process adherence.", tradeoff: "results vs. exact process", why: "The statement cleanly contrasts Red outcome focus with Green process fidelity without making either preference incompetent." },
  { id: "4ec48535-9510-4e86-9ee7-a6ea509af280", disposition: "REPLACE", replacement: "C01-S-02", traits: ["decisive-ownership", "possibility", "continuity", "clarity"], domain: "problem-framing", context: "work-business", tones: ["new-unfamiliar", "uncertainty"], orientation: "SELF_ATTENTION", family: "entry-into-vague-goal", pairs: allPairs, measures: "What helps each color engage when a new goal remains vague.", tradeoff: "starting direction vs. possibilities vs. commitments vs. requirements", why: "The legacy Red and Blue options both imply jumping in, while Yellow sounds uniquely considerate; the candidate distinguishes four motivations." },
  { id: "505ae241-8349-438d-b8db-d37b51518f95", disposition: "REPLACE", replacement: "C02-S-07", traits: ["decisive-ownership", "possibility", "trust", "evidence"], domain: "communication-expression", context: "work-business", tones: ["pressure", "failure-mistake"], orientation: "RESPONSE_TO_OTHERS", family: "urgent-customer-response", pairs: allPairs, measures: "Which useful contribution comes first when responding to an urgent customer problem.", tradeoff: "resolution ownership vs. possibilities vs. relationship vs. verified correction", why: "The legacy item asks respondents to claim professional strengths; the candidate uses a concrete problem with equally competent responses." },
  { id: "517a3cb3-a701-4fcb-8bb3-848e2f237424", disposition: "RETIRE", traits: ["consistency"], domain: "follow-through-recovery", context: "general-cross-context", tones: ["long-term-commitment"], orientation: "SELF_ACTION", family: "discipline-as-virtue", pairs: ["RED_GREEN", "YELLOW_GREEN"], measures: "Self-described discipline in finishing commitments.", tradeoff: "completion discipline vs. non-completion", why: "Agreement claims conscientiousness and competence; finishing commitments is not independently Green evidence." },
  { id: "53a98bef-2fdf-4619-a09c-b4e02847b10c", disposition: "REWORD", proposed: "Which kind of progress feels most naturally rewarding?", proposed_options: [
    { label: "Reaching a demanding target and seeing the result", color: "red" },
    { label: "Having an energizing experience and discovering what it opens", color: "blue" },
    { label: "Strengthening a dependable connection or shared commitment", color: "yellow" },
    { label: "Understanding something deeply and making it work reliably", color: "green" }
  ], traits: ["achievement", "possibility", "belonging", "coherence"], domain: "general-preference", context: "general-cross-context", tones: ["success-enjoyment"], orientation: "SELF_PREFERENCE", family: "most-rewarding-progress", pairs: allPairs, measures: "Which form of progress feels intrinsically rewarding.", tradeoff: "achievement vs. experience vs. connection vs. mastery", why: "The legacy options compound recognition, virtue, and competence; the revision gives each color a positive, motivation-centered reward." },
  { id: "53ece3a0-2862-42b5-a4fc-1468fd3549e8", disposition: "REWORD", proposed: "When choosing between two worthwhile paths, I prefer the one with steadier, more predictable progress to the one with faster but less certain growth.", traits: ["predictability", "stability-security"], domain: "stability-security", context: "everyday-decision", tones: ["uncertainty", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "predictable-progress-versus-rapid-growth", pairs: ["RED_GREEN", "BLUE_GREEN"], measures: "Whether predictable progress feels preferable to faster uncertain growth.", tradeoff: "steady predictability vs. rapid uncertain growth", why: "Financial circumstances confound the legacy wording; the revision preserves the Green preference without making it about money." }
];

const audit = read("data/v2-audit/current-question-audit.json");
const batchSource = audit.questions.slice(25, 50);
const decisionById = new Map(decisions.map((item) => [item.id, item]));
const candidates = resolvedCandidates();
if (batchSource.length !== 25 || decisions.length !== 25) throw new Error("Batch 02 must contain exactly 25 questions.");

function currentMapping(question) {
  if (question.question_type === "likert") return { intended_color: question.assigned_color };
  return { options: question.options.map((option) => ({ option_id: option.canonical_id, wording: option.english, color: Object.entries(option.weights).find(([, value]) => value === 4)?.[0] || null })) };
}

function candidateContent(candidate) {
  return {
    question_id: candidate.proposal_id,
    origin: candidate.origin,
    format: candidate.question_type,
    prompt: candidate.question || candidate.wording,
    options: (candidate.options || []).map((option) => ({ wording: option.label, color: option.mapping })),
    scoring: candidate.question_type === "LIKERT" ? { intended_color: candidate.intended_mapping || candidate.intended_color } : { option_to_color: (candidate.options || []).map((option) => ({ wording: option.label, color: option.mapping })) }
  };
}

const records = batchSource.map((question, index) => {
  const decision = decisionById.get(question.canonical_id);
  if (!decision) throw new Error(`Missing decision for ${question.canonical_id}.`);
  const replacement = decision.replacement ? candidates.get(decision.replacement) : null;
  if (decision.replacement && !replacement) throw new Error(`Unknown replacement ${decision.replacement}.`);
  const proposedPrompt = decision.disposition === "KEEP_EXACTLY" ? question.english.trim() : decision.proposed || (replacement ? replacement.question || replacement.wording : null);
  const proposedOptions = decision.proposed_options || (replacement ? (replacement.options || []).map((option) => ({ label: option.label, color: option.mapping })) : question.question_type === "single" && decision.disposition !== "RETIRE" ? currentMapping(question).options.map((option) => ({ label: option.wording, color: option.color })) : []);
  return {
    batch_position: index + 1,
    corpus_position: index + 26,
    question_id: question.canonical_id,
    current_revision_id: `legacy:${question.canonical_id}:production-baseline`,
    proposed_revision_id: decision.disposition === "REWORD" ? `legacy:${question.canonical_id}:proposed-v2-batch-02` : null,
    origin: "LEGACY",
    format: question.question_type === "likert" ? "LIKERT" : "SINGLE_SELECT",
    proposed_disposition: decision.disposition,
    current: { prompt: question.english.trim(), scoring: currentMapping(question) },
    proposed: decision.disposition === "RETIRE" ? null : { prompt: proposedPrompt, options: proposedOptions },
    replacement: replacement ? candidateContent(replacement) : null,
    measurement: { core_traits: decision.traits, behavioral_domain: decision.domain, life_context: decision.context, situational_tones: decision.tones, motivational_tradeoff: decision.tradeoff, orientation: decision.orientation, semantic_family: decision.family, pairwise_discrimination: decision.pairs, what_it_measures: decision.measures },
    quality: {
      color_model_alignment: decision.disposition === "RETIRE" ? "PARTIALLY_ALIGNED" : "ALIGNED",
      color_assignment_confidence: question.color_assignment_confidence,
      original_audit_flags: question.quality_classifications,
      ambiguity_risk: decision.disposition === "KEEP_EXACTLY" ? "LOW" : question.quality_classifications.includes("AMBIGUOUS") ? "HIGH" : "MODERATE",
      response_desirability_risk: question.quality_classifications.includes("SOCIAL_DESIRABILITY_RISK") || decision.family.includes("virtue") ? "HIGH" : "LOW",
      context_dependence_risk: question.quality_classifications.includes("CONTEXT_DEPENDENT") ? "HIGH" : "LOW",
      semantic_redundancy: decision.id === "40ff71e9-a36f-4f66-8193-e8a7aef0b6c3" ? "DUPLICATE" : decision.replacement ? "SUBSTANTIAL" : question.quality_classifications.includes("SEMANTICALLY_OVERLAPPING") ? "RELATED" : "NONE",
      owner_review_state: "OWNER_APPROVED"
    },
    why: decision.why,
    runtime_authority: false
  };
});

const counts = Object.fromEntries(["KEEP_EXACTLY", "REWORD", "REPLACE", "RETIRE"].map((disposition) => [disposition, records.filter((item) => item.proposed_disposition === disposition).length]));
const batch01 = read("data/v2-reconstruction/review-batch-01.json");
const cumulativeCounts = Object.fromEntries(Object.keys(counts).map((key) => [key, counts[key] + batch01.counts[key]]));
const combined = [...batch01.questions, ...records];
const coverage = {
  by_disposition: counts,
  cumulative_by_disposition: cumulativeCounts,
  by_domain: Object.fromEntries([...combined.reduce((map, item) => map.set(item.measurement.behavioral_domain, (map.get(item.measurement.behavioral_domain) || 0) + 1), new Map())].sort()),
  by_context: Object.fromEntries([...combined.reduce((map, item) => map.set(item.measurement.life_context, (map.get(item.measurement.life_context) || 0) + 1), new Map())].sort()),
  by_orientation: Object.fromEntries([...combined.reduce((map, item) => map.set(item.measurement.orientation, (map.get(item.measurement.orientation) || 0) + 1), new Map())].sort()),
  pairwise_opportunities: Object.fromEntries(allPairs.map((pair) => [pair, combined.filter((item) => item.measurement.pairwise_discrimination.includes(pair) && item.proposed_disposition !== "RETIRE").length]))
};

const output = {
  manifest_id: "VIAGO_CANONICAL_BANK_RECONSTRUCTION_BATCH_02",
  schema_version: "1.0.0",
  status: "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION",
  governing_model: "VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0",
  metadata_schema: "VIAGO_CANONICAL_QUESTION_METADATA_V1",
  taxonomy: "VIAGO_CANONICAL_QUESTION_TAXONOMIES_V1",
  source: "Canonical legacy identities 26-50 in data/v2-audit/current-question-audit.json order.",
  owner_decisions_applied: "data/v2-reconstruction/batch-01-owner-approval.json",
  counts,
  cumulative_counts: cumulativeCounts,
  coverage,
  questions: records,
  production_impact: "NONE"
};

fs.mkdirSync(path.join(ROOT, "data/v2-reconstruction"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/v2-reconstruction/review-batch-02.json"), `${JSON.stringify(output, null, 2)}\n`);

const lines = ["# VIAGO Canonical Question Bank Reconstruction — Review Batch 02", "", "Status: `OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION`", "", `Counts: ${counts.KEEP_EXACTLY} KEEP_EXACTLY · ${counts.REWORD} REWORD · ${counts.REPLACE} REPLACE · ${counts.RETIRE} RETIRE`, ""];
for (const item of records) {
  lines.push(`## ${String(item.corpus_position).padStart(2, "0")}. ${item.question_id} / LEGACY`, "", "**CURRENT**", "", item.current.prompt, "");
  if (item.current.scoring.options) for (const option of item.current.scoring.options) lines.push(`- ${option.wording} → ${option.color}`);
  lines.push("", "**PROPOSED**", "");
  if (item.proposed_disposition === "KEEP_EXACTLY") lines.push("UNCHANGED");
  else if (item.proposed_disposition === "RETIRE") lines.push("RETIRE");
  else { lines.push(item.proposed.prompt); for (const option of item.proposed.options || []) lines.push(`- ${option.label} → ${option.color}`); }
  lines.push("", `**DECISION:** ${item.proposed_disposition}`);
  if (item.replacement) lines.push("", `**REPLACEMENT:** ${item.replacement.question_id} / ${item.replacement.origin}`);
  const color = item.replacement?.format === "SINGLE_SELECT" ? "one option per color" : item.replacement?.scoring?.intended_color || item.current.scoring.intended_color || "one option per color";
  lines.push("", `**COLOR / MAPPING:** ${color}`, "", `**WHAT IT MEASURES:** ${item.measurement.what_it_measures}`, "", `**CONTEXT:** ${item.measurement.life_context}`, "", `**TRADEOFF:** ${item.measurement.motivational_tradeoff}`, "", `**WHY:** ${item.why}`, "");
}
fs.mkdirSync(path.join(ROOT, "docs/v2"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs/v2/CANONICAL_BANK_REVIEW_BATCH_02.md"), `${lines.join("\n").trimEnd()}\n`);
console.log(JSON.stringify({ status: output.status, counts, cumulativeCounts, coverage, production_impact: output.production_impact }, null, 2));
