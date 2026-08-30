import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const sourcePath = path.join(root, 'data/spanish-corpus-review.json');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const COLORS = ['red', 'blue', 'yellow', 'green'];

const normalize = (value) => value.toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
const words = (value) => new Set(normalize(value).split(' ').filter((word) => word.length > 2 && !STOP.has(word)));
const STOP = new Set('the and that with from when where what into about before after while instead most more very feel feels likely tend usually prefer would could should have has had being been this those them they their there its im ive dont doesnt cant a an to of for in on at is are was were be as or if it me my we our you your'.split(' '));

const domainRules = [
  ['conflict', /conflict|disagree|tension|upset|critici|confront|argument|pushback|heat|friction/],
  ['decision-making', /decision|decide|choice|commit|direction|moving forward/],
  ['planning-organization', /plan|prepar|organize|schedule|structure|step-by-step|map it out|clear process/],
  ['pace-action', /pace|quick|quickly|fast|immediate|jump in|momentum|action|moving|hesitat/],
  ['risk-change', /risk|uncertain|unknown|change|adapt|improvis|experiment|unfamiliar|spontan/],
  ['communication', /communicat|explain|talk|listen|speak|meeting|question|clarif|story|stories|idea/],
  ['social-interaction', /social|people|group|party|energy|fun|attention|recognition|visible|included/],
  ['leadership-influence', /lead|leadership|influence|rally|persuad|take charge|set the pace|direct others/],
  ['cooperation-support', /support|help|cooperat|fair|trust|relationship|belong|everyone|teamwork|compromise/],
  ['detail-accuracy', /detail|accur|correct|quality|specific|precise|careful|mistake|mastery|right/],
  ['rules-process', /rule|process|procedure|standard|method|guideline|system/],
  ['stability-security', /stable|stability|secure|security|predict|consistent|routine|reliable|steady/],
  ['competition-achievement', /win|winning|goal|result|achievement|compete|success|measurable|outcome/],
  ['emotional-expression', /emotion|feel|feeling|mood|vibe|enthusias|excited|calm|comfortable/],
  ['problem-solving-learning', /problem|solve|solution|learn|information|research|understand|analy|think through/],
  ['independence-follow-through', /independent|my own|alone|responsib|follow through|finish|complete|accountab/],
];

const contextRules = [
  ['conflict', /conflict|disagree|tension|upset|critici|argument|pushback/],
  ['pressure', /pressure|stress|urgent|deadline|heat|crisis/],
  ['leadership', /lead|take charge|direct others|set the pace/],
  ['team', /team|group|meeting|cowork|project|everyone|collaborat/],
  ['social', /social|party|friends|people i dont know|group of people/],
  ['planning', /plan|prepar|organize|schedule|before starting|step-by-step/],
  ['unfamiliar-situation', /unfamiliar|new situation|uncertain|unknown|change/],
  ['work-business', /work|job|business|meeting|project|deadline|goal/],
  ['communication', /communicat|talk|listen|speak|explain|question|conversation/],
];

function classify(text, rules, fallback) {
  const value = normalize(text);
  return rules.find(([, pattern]) => pattern.test(value))?.[0] ?? fallback;
}

function measurementDirection(text) {
  const value = normalize(text);
  if (/avoid|hold back|slow down|hesitat|reluctant|uncomfortable|prefer not|resist/.test(value)) return 'endorsement indicates inhibition/resistance toward the described behavior';
  return 'endorsement indicates stronger preference for the described behavior';
}

function intensity(text) {
  const value = normalize(text);
  if (/always|never|every time|regardless|strongly|must|responsible for|most likely/.test(value)) return 'strong';
  if (/sometimes|occasionally|may|might|open to|comfortable/.test(value)) return 'mild';
  return 'moderate';
}

function initialFlags(question) {
  const raw = question.english;
  const value = normalize(raw);
  const flags = [];
  if (raw !== raw.trim() || /\n/.test(raw)) flags.push('MINOR_WORDING_ISSUE');
  if (/always|never|everyone|no matter|regardless/.test(value)) flags.push('SOCIAL_DESIRABILITY_RISK');
  if (/things|something|situations|the situation|what feels right/.test(value)) flags.push('AMBIGUOUS');
  if (/ at work|in meetings|in a group|social settings|with others|people around me|team/.test(value)) flags.push('CONTEXT_DEPENDENT');
  const conjunctions = (value.match(/\b(and|while|but|as well as)\b/g) || []).length;
  if (conjunctions >= 2 || /both .+ and /.test(value)) flags.push('DOUBLE_BARRELED');
  if (/not |dont |doesnt |avoid|less likely|hold back|slow down|resist/.test(value)) flags.push('POSSIBLE_REVERSE_INTERPRETATION');
  if (value.length > 145 || /it is important to me that/.test(value)) flags.push('MINOR_WORDING_ISSUE');
  return [...new Set(flags.length ? flags : ['CLEAR'])];
}

function jaccard(a, b) {
  const intersection = [...a].filter((item) => b.has(item)).length;
  return intersection / Math.max(1, new Set([...a, ...b]).size);
}

const optionsByQuestion = new Map();
for (const option of source.options) {
  if (!optionsByQuestion.has(option.question_id)) optionsByQuestion.set(option.question_id, []);
  optionsByQuestion.get(option.question_id).push(option);
}
for (const options of optionsByQuestion.values()) options.sort((a, b) => a.scoring.sort_order - b.scoring.sort_order);

const overlaps = [];
for (let index = 0; index < source.questions.length; index += 1) {
  for (let other = index + 1; other < source.questions.length; other += 1) {
    const left = source.questions[index]; const right = source.questions[other];
    const similarity = jaccard(words(left.english), words(right.english));
    if (similarity >= 0.32) overlaps.push({ left_id: left.id, right_id: right.id, similarity: Number(similarity.toFixed(3)) });
  }
}
overlaps.sort((a, b) => b.similarity - a.similarity || a.left_id.localeCompare(b.left_id));
const overlapIds = new Set(overlaps.filter((pair) => pair.similarity >= 0.45).flatMap((pair) => [pair.left_id, pair.right_id]));

const audit = source.questions.map((question) => {
  const options = optionsByQuestion.get(question.id) ?? [];
  const domain = classify(question.english, domainRules, 'general-behavioral-preference');
  const context = classify(question.english, contextRules, 'personal-preference');
  const flags = initialFlags(question);
  if (overlapIds.has(question.id)) {
    if (flags[0] === 'CLEAR') flags.splice(0, 1);
    flags.push('SEMANTICALLY_OVERLAPPING');
  }
  const oneHotColors = options.map((option) => COLORS.filter((color) => option.scoring[color] > 0));
  const validOneHot = question.question_type !== 'single' || (options.length === 4 && oneHotColors.every((colors) => colors.length === 1) && new Set(oneHotColors.flat()).size === 4);
  let confidence = question.question_type === 'single' ? (validOneHot ? 'HIGH' : 'DISPUTED') : 'HIGH';
  if (question.question_type === 'likert' && (flags.includes('AMBIGUOUS') || flags.includes('DOUBLE_BARRELED'))) confidence = 'LOW';
  else if (question.question_type === 'likert' && (flags.includes('POSSIBLE_REVERSE_INTERPRETATION') || flags.includes('CONTEXT_DEPENDENT'))) confidence = 'MODERATE';
  if (confidence !== 'HIGH') flags.push('COLOR_ASSIGNMENT_QUESTIONABLE');
  if (flags.includes('AMBIGUOUS') && flags.includes('DOUBLE_BARRELED')) flags.push('MAJOR_REWRITE_CANDIDATE');
  return {
    canonical_id: question.id,
    active_baseline: true,
    question_type: question.question_type,
    english: question.english,
    assigned_color: question.scoring?.likert_color ?? null,
    options: options.map((option) => ({
      canonical_id: option.id,
      english: option.english,
      sort_order: option.scoring.sort_order,
      weights: Object.fromEntries(COLORS.map((color) => [color, option.scoring[color]])),
    })),
    proposed_taxonomy: {
      behavioral_domain: domain,
      context,
      measurement_direction: measurementDirection(question.english),
      intensity: intensity(question.english),
    },
    quality_classifications: [...new Set(flags)],
    color_assignment_confidence: confidence,
    competing_interpretation: confidence === 'HIGH' ? null : `Wording/context may engage ${domain} and adjacent color traits; this is a review flag, not a reclassification.`,
    evidence_kind: 'INFERENCE_REQUIRES_OWNER_REVIEW',
  };
});

const coverage = {};
for (const row of audit) {
  const color = row.assigned_color ?? 'multi-color-single-select';
  const { behavioral_domain: domain, context } = row.proposed_taxonomy;
  coverage[color] ??= {};
  coverage[color][domain] ??= {};
  coverage[color][domain][context] = (coverage[color][domain][context] ?? 0) + 1;
}

const counts = {
  total: audit.length,
  by_type: Object.fromEntries(['likert', 'single'].map((type) => [type, audit.filter((row) => row.question_type === type).length])),
  likert_by_color: Object.fromEntries(COLORS.map((color) => [color, audit.filter((row) => row.assigned_color === color).length])),
  quality_flags: {},
  assignment_confidence: Object.fromEntries(['HIGH', 'MODERATE', 'LOW', 'DISPUTED'].map((level) => [level, audit.filter((row) => row.color_assignment_confidence === level).length])),
};
for (const row of audit) for (const flag of row.quality_classifications) counts.quality_flags[flag] = (counts.quality_flags[flag] ?? 0) + 1;

const artifact = {
  schema_version: 1,
  generated_at: null,
  generated_from_snapshot: source.baseline.question_sha256,
  source: {
    repository_path: 'data/spanish-corpus-review.json',
    production_snapshot_question_sha256: source.baseline.question_sha256,
    production_snapshot_option_sha256: source.baseline.option_sha256,
    limitations: 'Taxonomy, quality, and confidence fields are audit proposals. They do not alter canonical content or scoring.',
  },
  counts,
  questions: audit,
  semantic_overlap_pairs: overlaps,
};

const coverageArtifact = {
  schema_version: 1,
  generated_at: artifact.generated_at,
  dimensions: ['color', 'behavioral_domain', 'context'],
  caveat: 'Single-select prompts are multi-color; their four one-hot options carry the color measurement.',
  matrix: coverage,
};

const stableJson = (value) => `${JSON.stringify(value, null, 2)}\n`;
fs.mkdirSync(path.join(root, 'data/v2-audit'), { recursive: true });
fs.writeFileSync(path.join(root, 'data/v2-audit/current-question-audit.json'), stableJson(artifact));
fs.writeFileSync(path.join(root, 'data/v2-audit/coverage-matrix.json'), stableJson(coverageArtifact));

const csvEscape = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csvRows = [['canonical_id','question_type','assigned_color','behavioral_domain','context','intensity','assignment_confidence','quality_classifications','english'], ...audit.map((row) => [row.canonical_id,row.question_type,row.assigned_color,row.proposed_taxonomy.behavioral_domain,row.proposed_taxonomy.context,row.proposed_taxonomy.intensity,row.color_assignment_confidence,row.quality_classifications.join('|'),row.english])];
fs.writeFileSync(path.join(root, 'data/v2-audit/current-question-audit.csv'), `${csvRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);

const hash = crypto.createHash('sha256').update(stableJson(artifact)).digest('hex');
console.log(JSON.stringify({ counts, semantic_overlap_pairs: overlaps.length, artifact_sha256: hash }, null, 2));
