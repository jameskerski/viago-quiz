import fs from 'node:fs';
import { hashRows } from '../migration/lib.mjs';

const [questionsPath, optionsPath, correctionsPath, outputPath] = process.argv.slice(2);
if (![questionsPath, optionsPath, correctionsPath, outputPath].every(Boolean)) {
  throw new Error('usage: node scripts/content/build-spanish-review.mjs questions.ndjson options.ndjson corrections.json output.json');
}
const parse = p => fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
const questions = parse(questionsPath);
const options = parse(optionsPath);
const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf8'));
if (questions.length !== 151 || options.length !== 124) throw new Error('unexpected corpus size');
if (hashRows(questions) !== corrections.baseline.question_sha256) throw new Error('question baseline hash mismatch');
if (hashRows(options) !== corrections.baseline.option_sha256) throw new Error('option baseline hash mismatch');

function review(kind, row, currentField, englishField) {
  const correction = corrections[kind][row.id];
  const tags = correction ? [correction[0]] : ['PASS'];
  const objective = tags.some(t => t === 'MINOR_LANGUAGE_FIX' || t === 'MAJOR_RETRANSLATION');
  return {
    id: row.id,
    question_id: kind === 'options' ? row.question_id : undefined,
    question_type: kind === 'questions' ? row.qtype : undefined,
    english: row[englishField],
    existing_spanish: row[currentField],
    classifications: tags,
    correction_kind: correction ? (objective ? 'objective' : 'interpretive') : null,
    exact_problem: correction ? (objective ? 'Grammar, register, naturalness, or clear mistranslation differs from the English source.' : 'The current wording introduces avoidable gender or shifts nuance/intensity from the English source.') : null,
    proposed_spanish: correction ? correction[1] : row[currentField],
    rationale: correction ? 'The proposal preserves the English construct and scoring direction in neutral, conversational Latin American Spanish.' : 'Semantics, construct, intensity, direction, and naturalness are acceptable.',
    scoring: kind === 'questions' ? { likert_color: row.likert_color ?? null } : { red: row.red, blue: row.blue, yellow: row.yellow, green: row.green, sort_order: row.sort_order }
  };
}
const artifact = {
  generated_from_baseline: corrections.baseline.question_sha256,
  baseline: corrections.baseline,
  questions: questions.map(r => review('questions', r, 'prompt_es', 'prompt')),
  options: options.map(r => review('options', r, 'label_es', 'label')),
  ui: corrections.ui
};
artifact.counts = [...artifact.questions, ...artifact.options].reduce((a, r) => {
  for (const tag of r.classifications) a[tag] = (a[tag] ?? 0) + 1;
  return a;
}, {});
fs.writeFileSync(outputPath, JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify({ questions: artifact.questions.length, options: artifact.options.length, counts: artifact.counts }));
