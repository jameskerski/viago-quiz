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

const decisions = [
  {
    id: "0309c2cb-91b4-4ac4-936f-051fd9a9c18c", disposition: "REWORD",
    proposed: "When change could improve the situation but disrupt important relationships, I prefer to protect continuity with people before accelerating it.",
    traits: ["continuity", "relational-depth"], domain: "change-risk", context: "general-cross-context", tones: ["change", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "relational-continuity-during-change", pairs: ["RED_YELLOW", "BLUE_YELLOW", "YELLOW_GREEN"],
    measures: "Whether preserving relationships and continuity naturally outweighs faster change.", tradeoff: "relational continuity vs. faster improvement", why: "The Yellow motive is valuable, but the current wording rewards generic consideration without making the competing priority visible."
  },
  {
    id: "039de60f-9c76-45f4-9061-147a51745e0f", disposition: "REPLACE", replacement: "C01-L-R-05",
    traits: ["accountability", "momentum"], domain: "follow-through-recovery", context: "work-business", tones: ["failure-mistake", "recovery"], orientation: "SELF_ATTENTION", family: "ownership-after-mistake", pairs: ["RED_GREEN", "RED_YELLOW"],
    measures: "Whether attention moves naturally from owning a mistake to restoring progress.", tradeoff: "restoring progress vs. remaining with the failure", why: "Taking the heat can measure courage or duty; the approved candidate exposes the Red recovery motive directly."
  },
  {
    id: "04cb4f9d-f1e1-476a-862c-b1c7c18faaaf", disposition: "REPLACE", replacement: "C01-L-Y-02",
    traits: ["support", "belonging"], domain: "relationships-support", context: "team", tones: ["competing-alternatives"], orientation: "INTERPERSONAL", family: "inclusion-before-closure", pairs: ["RED_YELLOW", "YELLOW_GREEN"],
    measures: "Whether affected people having a voice naturally outweighs immediate group closure.", tradeoff: "relational inclusion vs. timely closure", why: "The current absolute wording makes inclusion an obvious virtue; the candidate presents two defensible priorities."
  },
  {
    id: "092ef69e-a476-4451-a770-a879e8723fae", disposition: "REPLACE", replacement: "C02-S-15",
    traits: ["decisive-ownership", "possibility", "harmony", "evidence"], domain: "decision-making", context: "team", tones: ["competing-alternatives"], orientation: "INTERPERSONAL", family: "stalled-group-decision", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "Which motivation a person contributes when several workable directions compete.", tradeoff: "delivery vs. possibility vs. shared support vs. criteria", why: "The legacy Yellow option sounds morally superior and the Blue option is compound; the candidate balances four useful decision contributions."
  },
  {
    id: "0a24caa5-8413-49e7-a56f-9999f4e50879", disposition: "REWORD",
    proposed: "Someone tells you they are upset about something you did. What do you most naturally want to establish first?",
    proposed_options: [
      { label: "The clearest path to resolving the issue", color: "red" },
      { label: "A more open tone where new understanding can emerge", color: "blue" },
      { label: "What affected the relationship and would restore trust", color: "yellow" },
      { label: "The specific facts and where our interpretations differ", color: "green" }
    ],
    traits: ["decisive-ownership", "expression", "trust", "clarity"], domain: "conflict", context: "close-relationship", tones: ["disagreement"], orientation: "INTERPERSONAL", family: "response-to-personal-upset", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "What a person seeks first when repairing an interpersonal disagreement.", tradeoff: "resolution vs. openness vs. trust repair vs. factual clarity", why: "The current apology option is uniquely virtuous and the Blue option can sound avoidant; the revision makes each first priority useful."
  },
  {
    id: "0e761ffa-caa5-4505-a28c-3387445e805e", disposition: "RETIRE",
    traits: ["support"], domain: "relationships-support", context: "general-cross-context", tones: ["competing-alternatives"], orientation: "SELF_PREFERENCE", family: "fairness-as-virtue", pairs: ["RED_YELLOW"],
    measures: "Discomfort with benefiting from unfair treatment.", tradeoff: "personal benefit vs. fairness", why: "Agreement primarily endorses fairness as a universal virtue rather than a distinct Yellow relational preference."
  },
  {
    id: "0eaa09f4-95af-45a6-9846-13202a795033", disposition: "REWORD",
    proposed: "When two options are similarly worthwhile, I prefer the one with more predictable consequences to the one with more upside and uncertainty.",
    traits: ["predictability"], domain: "stability-security", context: "everyday-decision", tones: ["uncertainty", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "predictability-versus-upside", pairs: ["RED_GREEN", "BLUE_GREEN"],
    measures: "Whether predictable consequences naturally outweigh uncertain upside.", tradeoff: "predictability vs. uncertain upside", why: "The construct fits Green, but income and financial circumstances confound the current version."
  },
  {
    id: "0f42f5e4-1703-416f-863a-e46b511b19d8", disposition: "REWORD",
    proposed: "When a change could improve the situation quickly but disrupt people’s existing commitments, I tend to favor a slower transition.",
    traits: ["continuity", "loyalty"], domain: "change-risk", context: "general-cross-context", tones: ["change", "competing-alternatives"], orientation: "RESPONSE_TO_OTHERS", family: "commitment-preserving-transition", pairs: ["RED_YELLOW", "BLUE_YELLOW", "YELLOW_GREEN"],
    measures: "Whether protecting commitments naturally outweighs faster change.", tradeoff: "commitment continuity vs. speed of improvement", why: "The current wording sounds like universally responsible change management; the revision exposes the priority and cost."
  },
  {
    id: "0ff7b326-c6ce-4cd5-994e-5ce1b6b78552", disposition: "KEEP_EXACTLY",
    traits: ["visible-results", "energy", "support", "structure"], domain: "work-execution", context: "work-business", tones: ["ordinary-calm"], orientation: "SELF_PREFERENCE", family: "ideal-workday-environment", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "Which kind of workday environment feels naturally rewarding.", tradeoff: "wins vs. variety vs. support vs. structure", why: "All four options are attractive and expose recognizable work-environment preferences without a correct answer."
  },
  {
    id: "10c0c4fb-2eca-474f-bc81-50229d945b34", disposition: "REWORD",
    proposed: "I enjoy a social event more when I know the setting and plan beforehand than when the evening is left open.",
    traits: ["predictability", "structure"], domain: "social-interaction", context: "unfamiliar-social-situation", tones: ["social-setting", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "social-predictability-versus-openness", pairs: ["BLUE_GREEN", "YELLOW_GREEN"],
    measures: "Whether predictability enhances social enjoyment more than an open-ended experience.", tradeoff: "predictability vs. open-ended social experience", why: "The revision makes the comparison explicit and reduces the risk of measuring social anxiety alone."
  },
  {
    id: "12783d10-ecb1-400c-97bb-edb5a458caef", disposition: "REPLACE", replacement: "C02-S-13",
    traits: ["achievement", "novelty", "relational-depth", "learning"], domain: "general-preference", context: "free-time-leisure", tones: ["opportunity", "independent-activity"], orientation: "SELF_PREFERENCE", family: "unexpected-free-time-preference", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "What naturally attracts someone when free time has no obligations.", tradeoff: "progress vs. novelty vs. closeness vs. understanding", why: "The legacy statement conflates confinement, boredom, fun, and planning; the candidate offers a balanced ordinary-life choice."
  },
  {
    id: "14135310-4169-47af-bbc7-8d1345b2b51c", disposition: "REPLACE", replacement: "C02-S-04",
    traits: ["decisive-ownership", "possibility", "harmony", "structure"], domain: "organization-process", context: "household", tones: ["routine-stability"], orientation: "INTERPERSONAL", family: "shared-routine-repair", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "Which priority guides repair of a shared routine.", tradeoff: "immediate arrangement vs. flexibility vs. sustainability together vs. repeatable system", why: "The legacy item can score generic cooperation or Green process preference; the candidate distinguishes four motives in ordinary life."
  },
  {
    id: "16d86da0-614b-4c2f-a935-51e08ab09baa", disposition: "REPLACE", replacement: "C01-S-03",
    traits: ["momentum", "possibility", "continuity", "clarity"], domain: "change-risk", context: "general-cross-context", tones: ["change", "uncertainty"], orientation: "SELF_ATTENTION", family: "unexpected-plan-change", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "Which established motivation receives attention first when a relied-upon plan changes.", tradeoff: "progress vs. possibility vs. commitments vs. clarity", why: "The candidate replaces worry and generic adaptability with four explicit, equally reasonable motivations."
  },
  {
    id: "17d21643-7826-47e6-b115-79d0a74fa33c", disposition: "KEEP_EXACTLY",
    traits: ["structure", "predictability"], domain: "planning", context: "general-cross-context", tones: ["competing-alternatives"], orientation: "SELF_PREFERENCE", family: "clear-plan-versus-improvisation", pairs: ["BLUE_GREEN", "RED_GREEN"],
    measures: "Whether a clear plan creates more confidence than improvisation.", tradeoff: "planned clarity vs. improvisation", why: "The wording is concise, non-virtuous, and directly measures an established Green preference."
  },
  {
    id: "186c99bb-b666-4a64-a85e-955e84388dcb", disposition: "REPLACE", replacement: "C03-S-10",
    traits: ["decisive-ownership", "expression", "relational-depth", "clarity"], domain: "conflict", context: "family", tones: ["disagreement"], orientation: "INTERPERSONAL", family: "nonessential-disagreement-goal", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"],
    measures: "What resolution a person naturally wants when disagreement does not require action.", tradeoff: "closure vs. expressive exchange vs. mutual meaning vs. verifiable clarity", why: "The legacy mapping incorrectly makes avoidance Blue and reduces Yellow to diffusion; the candidate offers four grounded conflict preferences."
  },
  {
    id: "199f9df0-be56-402e-a98c-8b1b8e4518af", disposition: "RETIRE",
    traits: ["accountability"], domain: "follow-through-recovery", context: "work-business", tones: ["failure-mistake"], orientation: "SELF_ACTION", family: "ownership-after-mistake", pairs: ["RED_YELLOW", "RED_GREEN"],
    measures: "Comfort accepting consequences for a failed decision.", tradeoff: "personal accountability vs. avoidance of blame", why: "It is an exact duplicate of another legacy item and the shared wording measures courage/duty more than Red motivation."
  },
  {
    id: "1afbc3be-b62d-44cd-a335-a75d7cc9655c", disposition: "KEEP_EXACTLY",
    traits: ["spontaneity"], domain: "organization-process", context: "general-cross-context", tones: ["routine-stability"], orientation: "SELF_PREFERENCE", family: "structure-restlessness", pairs: ["BLUE_GREEN"],
    measures: "Whether heavy structure naturally feels constraining.", tradeoff: "freedom and flexibility vs. structure", why: "The item captures a clear Blue/Green preference tension without making either side more competent or mature."
  },
  {
    id: "1babc919-9400-4599-8b87-fdca1602b19e", disposition: "REPLACE", replacement: "C02-L-Y-02",
    traits: ["relational-depth", "loyalty"], domain: "relationships-support", context: "close-relationship", tones: ["ordinary-calm", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "relationship-depth-versus-breadth", pairs: ["BLUE_YELLOW"],
    measures: "Whether dependable relational depth feels more settling than expanding one's social circle.", tradeoff: "relationship depth vs. connection breadth", why: "The legacy statement rewards inclusive sociability and can attract Blue; the candidate isolates Yellow depth against a valid Blue preference."
  },
  {
    id: "1bac0735-73c1-43b1-86a8-41ec34adfd86", disposition: "REWORD",
    proposed: "When a workable plan is still loosely defined, I prefer to add structure before proceeding rather than organize it as I go.",
    traits: ["structure", "clarity"], domain: "organization-process", context: "general-cross-context", tones: ["uncertainty", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "structure-before-proceeding", pairs: ["BLUE_GREEN", "RED_GREEN"],
    measures: "Whether adding structure before action feels more natural than organizing during action.", tradeoff: "upfront structure vs. emergent organization", why: "The current discomfort wording is vague and virtue-adjacent; the revision presents two workable styles."
  },
  {
    id: "1bde0c6b-3fa1-4740-8799-338b6dc42f98", disposition: "RETIRE",
    traits: ["support"], domain: "relationships-support", context: "general-cross-context", tones: ["disagreement"], orientation: "SELF_PREFERENCE", family: "fairness-as-virtue", pairs: ["RED_YELLOW"],
    measures: "Willingness to uphold fairness despite discomfort.", tradeoff: "fairness vs. personal comfort", why: "Agreement mainly claims moral courage and fairness, both universal virtues rather than diagnostic Yellow motivation."
  },
  {
    id: "2171df8f-e7e0-4de3-90f8-eaa1d186e9f1", disposition: "REWORD",
    proposed: "I feel most motivated when progress can be measured against a clear target or standard.",
    traits: ["achievement", "visible-results"], domain: "achievement-competition", context: "general-cross-context", tones: ["opportunity"], orientation: "SELF_PREFERENCE", family: "motivation-by-visible-progress", pairs: ["RED_BLUE", "RED_YELLOW", "RED_GREEN"],
    measures: "Whether visible progress against a standard naturally strengthens motivation.", tradeoff: "measurable achievement vs. less externally visible progress", why: "The Red construct is established, but income and rank unnecessarily narrow it toward status and occupation."
  },
  {
    id: "222b3445-8da7-4fba-9f97-e64240c4e75b", disposition: "RETIRE",
    traits: ["energy"], domain: "work-execution", context: "work-business", tones: ["ordinary-calm"], orientation: "SELF_PREFERENCE", family: "enjoyable-process-as-productivity", pairs: ["RED_BLUE"],
    measures: "Belief that enjoying a process improves productivity.", tradeoff: "process enjoyment vs. outcome focus", why: "The statement is broadly true across colors and measures a productivity belief rather than Blue personality preference."
  },
  {
    id: "22bfd6a8-b54b-442c-8ec6-888f9cefe1d0", disposition: "REPLACE", replacement: "C02-L-G-02",
    traits: ["consistency", "structure"], domain: "organization-process", context: "work-business", tones: ["routine-stability", "competing-alternatives"], orientation: "SELF_PREFERENCE", family: "repeatable-process-versus-improvisation", pairs: ["BLUE_GREEN", "RED_GREEN"],
    measures: "Whether consistent repeatability feels preferable to improvising each time.", tradeoff: "repeatability vs. improvisation", why: "The candidate states a balanced process preference; the legacy wording frames systems as relief from not knowing what to do."
  },
  {
    id: "24b34387-e0fb-42c6-8ee9-5609dff49dc1", disposition: "RETIRE",
    traits: ["clarity"], domain: "social-interaction", context: "general-cross-context", tones: ["social-setting"], orientation: "SELF_PREFERENCE", family: "social-selectivity", pairs: ["BLUE_GREEN", "BLUE_YELLOW"],
    measures: "Preference to attend fewer social events.", tradeoff: "social selectivity vs. participation", why: "Introversion or social selectivity alone is explicitly non-diagnostic and does not establish a Green evidence/structure motive."
  },
  {
    id: "24c90a2c-32e9-4a0d-8518-7c0e659e3f65", disposition: "REWORD",
    proposed: "When progress is strong, I can tolerate a loosely organized process rather than stop to impose more structure.",
    traits: ["momentum", "visible-results"], domain: "work-execution", context: "general-cross-context", tones: ["competing-alternatives"], orientation: "SELF_PREFERENCE", family: "progress-versus-process-order", pairs: ["RED_GREEN", "RED_BLUE"],
    measures: "Whether preserving momentum naturally outweighs tightening process structure.", tradeoff: "progress momentum vs. process order", why: "The current 'chaos' wording can attract Blue spontaneity; the revision anchors tolerance to the Red outcome motive."
  }
];

const audit = read("data/v2-audit/current-question-audit.json");
const batchSource = audit.questions.slice(0, 25);
if (batchSource.length !== 25 || decisions.length !== 25) throw new Error("Batch 01 must contain exactly 25 questions.");
const decisionById = new Map(decisions.map((item) => [item.id, item]));
const candidates = resolvedCandidates();

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
    scoring: candidate.question_type === "LIKERT" ? { intended_color: candidate.intended_mapping || candidate.intended_color } : { option_to_color: (candidate.options || []).map((option) => ({ wording: option.label, color: option.mapping })) },
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
    question_id: question.canonical_id,
    current_revision_id: `legacy:${question.canonical_id}:production-baseline`,
    proposed_revision_id: decision.disposition === "REWORD" ? `legacy:${question.canonical_id}:proposed-v2-batch-01` : null,
    origin: "LEGACY",
    format: question.question_type === "likert" ? "LIKERT" : "SINGLE_SELECT",
    proposed_disposition: decision.disposition,
    current: { prompt: question.english.trim(), scoring: currentMapping(question) },
    proposed: decision.disposition === "RETIRE" ? null : { prompt: proposedPrompt, options: proposedOptions },
    replacement: replacement ? candidateContent(replacement) : null,
    measurement: {
      core_traits: decision.traits,
      behavioral_domain: decision.domain,
      life_context: decision.context,
      situational_tones: decision.tones,
      motivational_tradeoff: decision.tradeoff,
      orientation: decision.orientation,
      semantic_family: decision.family,
      pairwise_discrimination: decision.pairs,
      what_it_measures: decision.measures
    },
    quality: {
      color_model_alignment: decision.disposition === "RETIRE" ? "PARTIALLY_ALIGNED" : "ALIGNED",
      color_assignment_confidence: question.color_assignment_confidence,
      original_audit_flags: question.quality_classifications,
      ambiguity_risk: decision.disposition === "KEEP_EXACTLY" ? "LOW" : question.quality_classifications.includes("AMBIGUOUS") ? "HIGH" : "MODERATE",
      response_desirability_risk: question.quality_classifications.includes("SOCIAL_DESIRABILITY_RISK") || decision.family === "fairness-as-virtue" ? "HIGH" : "LOW",
      context_dependence_risk: question.quality_classifications.includes("CONTEXT_DEPENDENT") ? "HIGH" : "LOW",
      semantic_redundancy: decision.id === "199f9df0-be56-402e-a98c-8b1b8e4518af" ? "DUPLICATE" : decision.replacement ? "SUBSTANTIAL" : question.quality_classifications.includes("SEMANTICALLY_OVERLAPPING") ? "RELATED" : "NONE",
      owner_review_state: "OWNER_APPROVED"
    },
    why: decision.why,
    runtime_authority: false
  };
});

const counts = Object.fromEntries(["KEEP_EXACTLY", "REWORD", "REPLACE", "RETIRE"].map((disposition) => [disposition, records.filter((item) => item.proposed_disposition === disposition).length]));
const coverage = {
  by_disposition: counts,
  by_domain: Object.fromEntries([...records.reduce((map, item) => map.set(item.measurement.behavioral_domain, (map.get(item.measurement.behavioral_domain) || 0) + 1), new Map())].sort()),
  by_context: Object.fromEntries([...records.reduce((map, item) => map.set(item.measurement.life_context, (map.get(item.measurement.life_context) || 0) + 1), new Map())].sort()),
  by_orientation: Object.fromEntries([...records.reduce((map, item) => map.set(item.measurement.orientation, (map.get(item.measurement.orientation) || 0) + 1), new Map())].sort()),
  pairwise_opportunities: Object.fromEntries(["RED_BLUE", "RED_YELLOW", "RED_GREEN", "BLUE_YELLOW", "BLUE_GREEN", "YELLOW_GREEN"].map((pair) => [pair, records.filter((item) => item.measurement.pairwise_discrimination.includes(pair) && item.proposed_disposition !== "RETIRE").length]))
};

const output = {
  manifest_id: "VIAGO_CANONICAL_BANK_RECONSTRUCTION_BATCH_01",
  schema_version: "1.0.0",
  status: "OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION",
  governing_model: "VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0",
  metadata_schema: "VIAGO_CANONICAL_QUESTION_METADATA_V1",
  taxonomy: "VIAGO_CANONICAL_QUESTION_TAXONOMIES_V1",
  source: "First 25 canonical legacy identities in data/v2-audit/current-question-audit.json order.",
  counts,
  coverage,
  questions: records,
  production_impact: "NONE"
};

fs.mkdirSync(path.join(ROOT, "data/v2-reconstruction"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "data/v2-reconstruction/review-batch-01.json"), `${JSON.stringify(output, null, 2)}\n`);

const lines = [
  "# VIAGO Canonical Question Bank Reconstruction — Review Batch 01",
  "",
  "Status: `OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION`",
  "",
  `Counts: ${counts.KEEP_EXACTLY} KEEP_EXACTLY · ${counts.REWORD} REWORD · ${counts.REPLACE} REPLACE · ${counts.RETIRE} RETIRE`,
  "",
];
for (const item of records) {
  lines.push(`## ${String(item.batch_position).padStart(2, "0")}. ${item.question_id} / LEGACY`, "", "**CURRENT**", "", item.current.prompt, "");
  if (item.current.scoring.options) for (const option of item.current.scoring.options) lines.push(`- ${option.wording} → ${option.color}`);
  lines.push("", "**PROPOSED**", "");
  if (item.proposed_disposition === "KEEP_EXACTLY") lines.push("UNCHANGED");
  else if (item.proposed_disposition === "RETIRE") lines.push("RETIRE");
  else {
    lines.push(item.proposed.prompt);
    for (const option of item.proposed.options || []) lines.push(`- ${option.label} → ${option.color}`);
  }
  lines.push("", `**DECISION:** ${item.proposed_disposition}`);
  if (item.replacement) lines.push("", `**REPLACEMENT:** ${item.replacement.question_id} / ${item.replacement.origin}`);
  const color = item.replacement?.format === "SINGLE_SELECT" ? "one option per color" : item.replacement?.scoring?.intended_color || item.current.scoring.intended_color || "one option per color";
  lines.push(
    "",
    `**COLOR / MAPPING:** ${color}`,
    "",
    `**WHAT IT MEASURES:** ${item.measurement.what_it_measures}`,
    "",
    `**CONTEXT:** ${item.measurement.life_context}`,
    "",
    `**TRADEOFF:** ${item.measurement.motivational_tradeoff}`,
    "",
    `**WHY:** ${item.why}`,
    ""
  );
}
fs.mkdirSync(path.join(ROOT, "docs/v2"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "docs/v2/CANONICAL_BANK_REVIEW_BATCH_01.md"), `${lines.join("\n")}\n`);
console.log(JSON.stringify({ status: output.status, counts, coverage, production_impact: output.production_impact }, null, 2));
