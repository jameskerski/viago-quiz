import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const review = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-proposals/cohort-01-color-model-review.json'), 'utf8'));
const cohort = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-proposals/cohort-01.json'), 'utf8'));
const output = path.join(root, 'docs/v2-color-model-foundation-and-cohort-01-review.md');
const proposalMap = new Map(cohort.proposals.map((proposal) => [proposal.proposal_id, proposal]));
const COLORS = ['red', 'blue', 'yellow', 'green'];
const dimensions = [
  ['core_motivations','Core motivations'], ['decision_style','Decision style'], ['communication_style','Communication style'],
  ['relationship_orientation','Relationship orientation'], ['conflict_response','Conflict response'], ['pressure_response','Response to pressure'],
  ['leadership_followership','Leadership / followership'], ['change_approach','Approach to change'], ['risk_approach','Approach to risk'],
  ['planning_execution','Planning / execution'], ['strengths','Common strengths'], ['overextensions','Common overextensions'],
  ['confusion_zones','Frequently confused behaviors'], ['nonqualifiers','What does not independently qualify'],
];
const lines = [];
const add = (...values) => lines.push(...values);
const format = (value) => Array.isArray(value) ? value.join('; ') : value;
const title = (value) => value.split('_').map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(' ');

add(
  '# VIAGO V2 color-model foundation and Cohort 01 recalibration', '',
  '> **OWNER REVIEW ONLY.** This document defines a proposed behavioral foundation and re-evaluates proposal content. It does not approve, publish, score, migrate, or activate a question.', '',
  '## Decision standard', '',
  review.model_principle, '',
  'A color is not a list of admirable skills. The same visible behavior can arise from different motives. A useful item must expose a preference, attention pattern, or tradeoff that makes one color more likely than the other three. When a question merely asks whether someone is competent, considerate, responsible, courageous, accurate, or reasonable, it is rejected or revised.', '',
  '## Historical VIAGO evidence compared', '',
  '| Source | Stable meaning | Limitation found |', '| --- | --- | --- |',
  '| V1 long result narratives (`app/quiz/page.tsx`) | Red Driver/Achiever; Blue Energizer/Explorer; Yellow Stabilizer/Loyalist; Green Analyst/Planner. | Some examples mix core preference with maturity, skill, status, or workplace behavior. |',
  '| V2 result narratives (`lib/v2/publicContent.ts`) | Preserves outcomes, stimulation, relationships/values, and clarity/evidence as the four core drives. | Short profile copy is not a complete item-classification rule. |',
  '| Spanish semantic review | Independently confirms the English construct direction and overextension profile for all four colors. | Translation equivalence does not validate every question assignment. |',
  '| `docs/v2/CONTENT_MODEL.md` | Defines initial subdimensions: Red drive/assertiveness; Blue novelty/expression; Yellow empathy/loyalty; Green analysis/precision. | Explicitly states these dimensions were not frozen business rules. |',
  '| Active 151-question corpus and forensic audit | Supplies real behavioral examples and reveals coverage, duplicates, ambiguity, and assignment uncertainty. | Cannot define the model by majority vote because the same assignments are under review. |', '',
  '### Stable conclusion', '',
  '- **Red:** outcome and agency priority.',
  '- **Blue:** stimulation, expression, freedom, and possibility priority.',
  '- **Yellow:** people, values, loyalty, fairness, and relational-safety priority.',
  '- **Green:** clarity, evidence, predictability, accuracy, and risk-control priority.', '',
);

for (const color of COLORS) {
  const model = review.color_definitions[color];
  add(`## ${title(color)} behavioral definition`, '');
  for (const [key, label] of dimensions) add(`### ${label}`, '', format(model[key]), '');
}

add('## Four-color comparison matrix', '', '| Behavioral dimension | Red | Blue | Yellow | Green |', '| --- | --- | --- | --- | --- |');
for (const [key, label] of dimensions.slice(0, 12)) add(`| ${label} | ${escapeCell(format(review.color_definitions.red[key]))} | ${escapeCell(format(review.color_definitions.blue[key]))} | ${escapeCell(format(review.color_definitions.yellow[key]))} | ${escapeCell(format(review.color_definitions.green[key]))} |`);
add('', '## Important overlap and confusion zones', '',
  '### Action and adaptability: Red vs Blue', '',
  'Both may act quickly and welcome change. Red is pulled by progress, control, challenge, or outcome. Blue is pulled by novelty, freedom, possibility, or social energy. “Adapts well” alone proves neither.', '',
  '### People orientation: Blue vs Yellow', '',
  'Blue seeks broad connection, expression, and shared experience. Yellow protects loyalty, fairness, belonging, and durable trust. Friendliness, empathy, or sociability alone is insufficient.', '',
  '### Stability: Yellow vs Green', '',
  'Yellow protects people and commitments; Green protects clarity, reliable systems, and bounded uncertainty. Both may resist change, but for different reasons.', '',
  '### Responsibility and competence: Red vs Green', '',
  'Red owns direction and pace; Green owns correctness, evidence, and process integrity. Fixing a problem, noticing missing information, or being responsible is not color-specific without a tradeoff.', '',
  '### Direct conflict: Red vs mature Yellow', '',
  'Red directness seeks resolution, decision, or accountability. Yellow directness can protect trust or fairness, but it is often a developed corrective to Yellow conflict avoidance. Directness itself should not be scored Yellow.', '',
  '### Universal virtues', '',
  'Courage, kindness, fairness, accuracy, accountability, calmness, and good judgment are not colors. Items using them need competing, equally defensible priorities.', '',
  '## Cohort 01 re-evaluation summary', '');
const counts = Object.fromEntries([...new Set(review.proposal_reviews.map((item) => item.disposition))].sort().map((value) => [value, review.proposal_reviews.filter((item) => item.disposition === value).length]));
for (const [key, value] of Object.entries(counts)) add(`- **${key}:** ${value}`);
add('', 'No proposal becomes approved through this review. `KEEP_AS_CANDIDATE` means only that the original wording survives this calibration step and remains pending OWNER content acceptance.', '');

for (const item of review.proposal_reviews) {
  const proposal = proposalMap.get(item.proposal_id);
  add(
    `### ${item.proposal_id} — ${item.disposition}`, '',
    `**Original:** “${proposal.wording}”`, '',
    `**Why this color rather than the other three:** ${item.why_this_color}`, '',
    `**Social-desirability finding:** ${item.social_desirability_finding}`, '',
  );
  if (item.revised_wording) add(`**Revised wording:** “${item.revised_wording}”`, '');
  if (item.revised_options) {
    add('**Revised options:**', '');
    for (const color of COLORS) add(`- **${title(color)}:** ${item.revised_options[color]}`);
    add('');
  }
  add(`**Remaining ambiguity:** ${item.remaining_ambiguity ?? 'No material ambiguity identified at this calibration stage.'}`, '');
}

add(
  '## Questions remaining genuinely ambiguous', '',
  '- `C01-L-Y-01`: constructive relational conflict may measure Yellow relationship protection, Red candor, secure attachment, or learned conflict skill.',
  '- `C01-S-05`: concern about hidden disagreement may measure facilitation training rather than personality.',
  '- `C01-L-R-03`, `C01-L-G-03`, `C01-S-02`, and `C01-S-06` remain meaningfully influenced by occupation, training, or task stakes even after revision.', '',
  '## Places where established VIAGO meaning remains unclear', '',
  '1. **Yellow directness:** historical VIAGO defines conflict avoidance as an overextension, but does not specify when developed directness becomes evidence of Yellow rather than simply healthy behavior.',
  '2. **Blue adaptability:** historical copy calls Blue adaptable while also describing impulsivity and weak follow-through. The model needs to distinguish attraction to novelty from effective adaptation.',
  '3. **Red accountability versus Green rigor:** corpus items sometimes treat responsibility as Red even when the behavior could reflect Green reliability or universal conscientiousness.',
  '4. **Color versus maturity:** result narratives contain growth behaviors. These should guide coaching, not automatically become scoring indicators.',
  '5. **Green relationship stability:** several Green items describe selective, steady relationships. It is unclear whether this is a core Green construct or predictability expressed in a relationship context.',
  '6. **Yellow fairness:** fairness is central, but obvious ethical conduct creates social-desirability bias unless it competes with speed, advantage, comfort, or loyalty.', '',
  '## OWNER decisions requested before any new generation', '',
  '1. Confirm or revise the four motive-level definitions.',
  '2. Decide whether developed/growth behaviors may ever score toward a color.',
  '3. Decide whether Yellow direct conflict is core evidence, contextual evidence, or never sufficient by itself.',
  '4. Decide whether Green relationship selectivity/stability belongs in the model.',
  '5. Review the five surviving original candidates, fourteen revisions, two ambiguous items, and three rejections.', '',
  '## Stop gate', '',
  'No Cohort 02, bulk generation, production UUID assignment, database migration, content activation, selector change, or scoring change is authorized or performed.',
);

fs.writeFileSync(output, lines.join('\n').replace(/\n*$/, '\n'));
console.log(JSON.stringify({ colors: COLORS.length, proposal_reviews: review.proposal_reviews.length, dispositions: counts, output: path.relative(root, output) }, null, 2));

function escapeCell(value) { return String(value).replaceAll('|', '\\|').replaceAll('\n', ' '); }
