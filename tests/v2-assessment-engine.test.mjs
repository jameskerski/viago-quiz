import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assembleAttempt, scoreAttempt } from '../scripts/v2/lib/assessment-model.mjs';

const audit = JSON.parse(fs.readFileSync(new URL('../data/v2-audit/current-question-audit.json', import.meta.url)));
const questions = audit.questions.map((row) => ({ id: row.canonical_id, active: true, qtype: row.question_type, likert_color: row.assigned_color }));

test('every deterministic seed produces the exact canonical 50-question balance', () => {
  for (let seed = 1; seed <= 1000; seed += 1) {
    const attempt = assembleAttempt(questions, seed);
    assert.equal(attempt.length, 50);
    assert.equal(attempt.filter((row) => row.qtype === 'single').length, 25);
    assert.deepEqual(Object.fromEntries(['red','blue','yellow','green'].map((color) => [color, attempt.filter((row) => row.qtype === 'likert' && row.likert_color === color).length])), { red: 6, blue: 6, yellow: 6, green: 7 });
    assert.equal(new Set(attempt.map((row) => row.id)).size, 50);
  }
});

test('selector fails closed when a required color pool is insufficient', () => {
  assert.throws(() => assembleAttempt(questions.filter((row) => row.likert_color !== 'red'), 1), /Insufficient active likert pool for red/);
});

test('canonical tie order is raw score, max hit, positive hits, then red-blue-green-yellow', () => {
  const equal = scoreAttempt(
    ['red','blue','green','yellow'].map((color) => ({ question_id: color, qtype: 'likert', likert_value: 0 })),
    ['red','blue','green','yellow'].map((color) => ({ id: color, likert_color: color })), [],
  );
  assert.equal(equal.winner_color, 'red');
  assert.deepEqual(equal.ranked.map((row) => row.color), ['red','blue','green','yellow']);
});

test('current single-select options are four-way one-hot weights of four', () => {
  for (const question of audit.questions.filter((row) => row.question_type === 'single')) {
    assert.equal(question.options.length, 4);
    const colors = question.options.map((option) => Object.entries(option.weights).filter(([, points]) => points > 0));
    assert.ok(colors.every((entries) => entries.length === 1 && entries[0][1] === 4));
    assert.equal(new Set(colors.map((entries) => entries[0][0])).size, 4);
  }
});
