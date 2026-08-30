import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleAttempt, ATTEMPT_TARGETS, DB_TIE_ORDER, scoreAttempt } from './lib/assessment-model.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const corpus = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-audit/current-question-audit.json'), 'utf8'));
const questions = corpus.questions.map((row) => ({ id: row.canonical_id, active: row.active_baseline, qtype: row.question_type, likert_color: row.assigned_color }));
const iterations = 10000;
const frequencies = Object.fromEntries(questions.map((row) => [row.id, 0]));
const observedCompositions = new Set();
for (let seed = 1; seed <= iterations; seed += 1) {
  const attempt = assembleAttempt(questions, seed);
  for (const question of attempt) frequencies[question.id] += 1;
  const composition = { single: attempt.filter((row) => row.qtype === 'single').length };
  for (const color of DB_TIE_ORDER) composition[color] = attempt.filter((row) => row.qtype === 'likert' && row.likert_color === color).length;
  observedCompositions.add(JSON.stringify(composition));
}

const byPool = {};
for (const question of questions) {
  const pool = question.qtype === 'single' ? 'single' : `likert:${question.likert_color}`;
  byPool[pool] ??= [];
  byPool[pool].push(frequencies[question.id]);
}
const frequencySummary = Object.fromEntries(Object.entries(byPool).map(([pool, values]) => [pool, {
  minimum: Math.min(...values), maximum: Math.max(...values), average: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
}]));

const vectors = [
  {
    id: 'all-zero-likert',
    description: 'Zero-valued Likert answers retain all colors; deterministic tie order selects red.',
    questions: DB_TIE_ORDER.map((color) => ({ id: `q-${color}`, likert_color: color })), options: [],
    answers: DB_TIE_ORDER.map((color) => ({ question_id: `q-${color}`, qtype: 'likert', likert_value: 0 })),
    expected: { winner_color: 'red', totals: { red: 0, blue: 0, green: 0, yellow: 0 } },
  },
  {
    id: 'max-hit-breaks-total-tie',
    description: 'A higher single-item maximum breaks an equal raw total before positive-hit count.',
    questions: [{ id: 'q-red', likert_color: 'red' }, { id: 'q-blue-1', likert_color: 'blue' }, { id: 'q-blue-2', likert_color: 'blue' }], options: [],
    answers: [{ question_id: 'q-red', qtype: 'likert', likert_value: 4 }, { question_id: 'q-blue-1', qtype: 'likert', likert_value: 2 }, { question_id: 'q-blue-2', qtype: 'likert', likert_value: 2 }],
    expected: { winner_color: 'red', totals: { red: 4, blue: 4 } },
  },
  {
    id: 'positive-hit-breaks-total-and-max-tie',
    description: 'More positive contributions breaks a tie after raw total and maximum contribution.',
    questions: [{ id: 'q-red-1', likert_color: 'red' }, { id: 'q-red-2', likert_color: 'red' }, { id: 'q-blue-1', likert_color: 'blue' }, { id: 'q-blue-2', likert_color: 'blue' }, { id: 'q-blue-3', likert_color: 'blue' }], options: [],
    answers: [{ question_id: 'q-red-1', qtype: 'likert', likert_value: 2 }, { question_id: 'q-red-2', qtype: 'likert', likert_value: 2 }, { question_id: 'q-blue-1', qtype: 'likert', likert_value: 2 }, { question_id: 'q-blue-2', qtype: 'likert', likert_value: 1 }, { question_id: 'q-blue-3', qtype: 'likert', likert_value: 1 }],
    expected: { winner_color: 'blue', totals: { red: 4, blue: 4 } },
  },
  {
    id: 'multi-color-option',
    description: 'The grader technically permits one selected option to contribute to multiple colors.',
    questions: [], options: [{ id: 'o', red: 4, blue: 2, green: 0, yellow: 0 }],
    answers: [{ question_id: 'q', qtype: 'single', option_id: 'o' }],
    expected: { winner_color: 'red', totals: { red: 4, blue: 2 } },
  },
];
for (const vector of vectors) {
  const actual = scoreAttempt(vector.answers, vector.questions, vector.options);
  vector.actual = { winner_color: actual.winner_color, totals: Object.fromEntries(actual.ranked.map((row) => [row.color, row.total_score])) };
  vector.passed = vector.actual.winner_color === vector.expected.winner_color
    && Object.entries(vector.expected.totals).every(([color, total]) => vector.actual.totals[color] === total)
    && Object.keys(vector.actual.totals).every((color) => Object.hasOwn(vector.expected.totals, color));
}

const result = {
  schema_version: 1,
  generated_at: null,
  generated_from_snapshot: corpus.source.production_snapshot_question_sha256,
  implementation_basis: 'Independent executable model of canonical SQL migrations/20260821000200_viago_quiz_target.sql.',
  iterations,
  targets: ATTEMPT_TARGETS,
  distinct_observed_compositions: [...observedCompositions].map(JSON.parse),
  frequency_summary: frequencySummary,
  all_attempts_exactly_50: [...observedCompositions].every((value) => Object.values(JSON.parse(value)).reduce((a, b) => a + b, 0) === 50),
  scoring_vectors: vectors,
};
fs.writeFileSync(path.join(root, 'data/v2-audit/selection-scoring-validation.json'), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ iterations, observed_compositions: result.distinct_observed_compositions, frequency_summary: frequencySummary, scoring_vectors_passed: vectors.every((vector) => vector.passed) }, null, 2));
