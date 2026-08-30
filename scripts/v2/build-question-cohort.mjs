import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const proposalPath = path.join(root, 'data/v2-proposals/cohort-01.json');
const outputPath = path.join(root, 'docs/v2-question-expansion-cohort-01.md');
const cohort = JSON.parse(fs.readFileSync(proposalPath, 'utf8'));
const proposals = cohort.proposals;
const colors = ['red', 'blue', 'yellow', 'green'];

const countBy = (field) => Object.fromEntries([...new Set(proposals.map((proposal) => proposal[field]))].sort().map((value) => [value, proposals.filter((proposal) => proposal[field] === value).length]));
const likertColors = Object.fromEntries(colors.map((color) => [color, proposals.filter((proposal) => proposal.question_type === 'LIKERT' && proposal.intended_color === color).length]));
const optionColors = Object.fromEntries(colors.map((color) => [color, proposals.flatMap((proposal) => proposal.options ?? []).filter((option) => option.color === color).length]));
const recommendationCounts = countBy('recommendation');

const lines = [];
const add = (...values) => lines.push(...values);
add(
  '# VIAGO V2 question expansion — cohort 01',
  '',
  '> **OWNER REVIEW ONLY.** None of these proposals is an active question, production UUID, scoring change, selector change, or migration. The runtime does not read this proposal bank.',
  '',
  '## What this cohort is testing',
  '',
  'This small cohort tests whether the proposed writing philosophy sounds like VIAGO before expansion scales: concrete behavior, ordinary situations, one main idea, defensible color meaning, and less obvious personality-test signaling. It deliberately targets the coverage and repetition weaknesses found in the forensic audit.',
  '',
  '## Review summary',
  '',
  `- **${proposals.length} proposals:** ${proposals.filter((proposal) => proposal.question_type === 'LIKERT').length} Likert and ${proposals.filter((proposal) => proposal.question_type === 'SINGLE_SELECT').length} situational single-select.`,
  `- **Likert colors:** Red ${likertColors.red}, Blue ${likertColors.blue}, Yellow ${likertColors.yellow}, Green ${likertColors.green}.`,
  `- **Single-select option mappings:** Red ${optionColors.red}, Blue ${optionColors.blue}, Yellow ${optionColors.yellow}, Green ${optionColors.green}; every prompt contains one option per color.`,
  `- **Recommendations:** ${Object.entries(recommendationCounts).map(([key, value]) => `${key} ${value}`).join(', ')}.`,
  '',
  '### Behavioral-domain matrix',
  '',
  '| Domain | Proposals |', '| --- | ---: |',
  ...Object.entries(countBy('behavioral_domain')).map(([key, value]) => `| ${key} | ${value} |`),
  '',
  '### Context matrix',
  '',
  '| Context | Proposals |', '| --- | ---: |',
  ...Object.entries(countBy('context')).map(([key, value]) => `| ${key} | ${value} |`),
  '',
  '### Semantic families',
  '',
  '| Family | Proposals | What parallel evidence it demonstrates |', '| --- | ---: | --- |',
  ...Object.entries(countBy('semantic_family')).map(([key, value]) => `| ${key} | ${value} | ${familyPurpose(key)} |`),
  '',
  '## How to review',
  '',
  'For each item, first read only the question, color, measurement goal, and reason. Ask: “Would an ordinary person recognize this situation, and could they answer without decoding the color?” Then inspect the technical notes. `EXPERIMENTAL` and `REVISE_BEFORE_CONSIDERATION` items are included to calibrate boundaries, not to seek automatic approval.',
  '',
);

for (const type of ['LIKERT', 'SINGLE_SELECT']) {
  add(`## ${type === 'LIKERT' ? 'Likert proposals' : 'Situational single-select experiment'}`, '');
  for (const proposal of proposals.filter((item) => item.question_type === type)) {
    add(
      `### ${proposal.proposal_id} — ${titleCase(proposal.intended_color)}`,
      '',
      `> **${proposal.wording}**`,
      '',
      `**What we’re trying to measure:** ${proposal.measurement_direction}`,
      '',
      `**Why this question exists:** ${proposal.need}`,
      '',
    );
    if (proposal.options) {
      add('**Proposed options and color mapping:**', '');
      for (const option of proposal.options) add(`- **${titleCase(option.color)}:** ${option.label}`);
      add('');
    }
    add(
      '<details>',
      '<summary>Technical review metadata</summary>',
      '',
      `- Type: ${proposal.question_type}`,
      `- Intended color: ${proposal.intended_color}`,
      `- Domain: ${proposal.behavioral_domain}`,
      `- Context: ${proposal.context}`,
      `- Intensity: ${proposal.intensity}`,
      `- Semantic family: ${proposal.semantic_family}`,
      `- Closest active question IDs: ${proposal.closest_existing.length ? proposal.closest_existing.join(', ') : 'No close active item identified'}`,
      `- Difference: ${proposal.difference}`,
      `- Color-assignment confidence: ${proposal.color_assignment_confidence}`,
      `- Ambiguity risk: ${proposal.ambiguity_risk}`,
      `- Social-desirability risk: ${proposal.social_desirability_risk}`,
      `- Recommendation: **${proposal.recommendation}**`,
      '',
      '</details>',
      '',
    );
  }
}

add(
  '## Existing active questions needing OWNER attention',
  '',
  'These remain unchanged in production. They are shown to distinguish future cleanup from bank expansion.',
  '',
);
for (const item of cohort.existing_questions_for_owner_attention) {
  add(
    `### Existing ${item.canonical_id}`,
    '',
    `> **${item.current}**`,
    '',
    `**Why it needs attention:** ${item.attention}`,
    '',
    `**Possible future treatment:** ${item.possible_future_disposition}`,
    '',
  );
}

add(
  '## Specific OWNER decisions requested',
  '',
  '1. Do the Red decisive-action variants feel behaviorally distinct rather than like leadership slogans?',
  '2. Does Blue “expressive precision” (`C01-L-B-04`) feel legitimate, or does it actually measure Green detail orientation?',
  '3. Can Yellow include direct boundaries and constructive conflict without losing its relationship-centered meaning?',
  '4. Do the Green items measure evidence/accuracy behavior rather than anxiety about uncertainty?',
  '5. Are the four single-select options equally plausible, or does any option read as the obviously responsible answer?',
  '6. Which items feel too workplace-specific or too morally desirable?',
  '7. Which semantic families should be used as same-attempt exclusion groups?',
  '',
  '## Stop gate',
  '',
  'No cohort 02, bulk generation, UUID assignment, migration, publishing, scoring change, or selector change follows from this document. OWNER feedback is required first.',
  '',
);

fs.writeFileSync(outputPath, lines.join('\n').replace(/\n*$/, '\n'));
console.log(JSON.stringify({ proposals: proposals.length, likert: proposals.filter((proposal) => proposal.question_type === 'LIKERT').length, single_select: proposals.filter((proposal) => proposal.question_type === 'SINGLE_SELECT').length, likert_colors: likertColors, domains: countBy('behavioral_domain'), contexts: countBy('context'), semantic_families: countBy('semantic_family') }, null, 2));

function titleCase(value) { return value.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }
function familyPurpose(value) {
  const purposes = {
    'decisive-action': 'Action under incomplete information, team indecision, pressure, and changing plans.',
    'expressive-connection': 'Communication through explanation, unfamiliar social entry, and group energy.',
    'adaptive-curiosity': 'Opportunity-focused response to unexpected change.',
    'expressive-precision': 'Whether detail can serve vivid communication without becoming procedural accuracy.',
    'principled-boundaries': 'Relationship-preserving directness and limits.',
    'principled-inclusion': 'Advocacy for people affected by a decision.',
    'evidence-before-action': 'Accuracy and evidence checking in work, pressure, and conflict.',
    'recovery-after-setback': 'Action and orientation after a visible mistake.',
  };
  return purposes[value] ?? 'One situational family retained for future parallel variants and same-attempt exclusion.';
}
