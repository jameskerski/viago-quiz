import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const corrections = JSON.parse(fs.readFileSync('data/spanish-corpus-corrections.json', 'utf8'));
const review = JSON.parse(fs.readFileSync('data/spanish-corpus-review.json', 'utf8'));
const migration = fs.readFileSync('supabase/migrations/20260829204740_viago_quiz_spanish_corrections.sql', 'utf8');
const resultDescriptions = fs.readFileSync('lib/spanishResultDescriptions.ts', 'utf8');
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

test('Spanish correction artifact is review-only and baseline-pinned', () => {
  assert.equal(corrections.status, 'review_only_not_applied');
  assert.equal(corrections.baseline.questions, 151);
  assert.equal(corrections.baseline.options, 124);
  assert.match(corrections.baseline.question_sha256, /^[0-9a-f]{64}$/);
  assert.match(corrections.baseline.option_sha256, /^[0-9a-f]{64}$/);
});

test('corrections are ID-scoped, nonempty Unicode strings, and allowed classifications', () => {
  const allowed = new Set(['MINOR_LANGUAGE_FIX', 'SEMANTIC_FIX', 'GENDER_OR_CULTURAL_FIX', 'MAJOR_RETRANSLATION']);
  for (const group of ['questions', 'options']) {
    for (const [id, [tag, text]] of Object.entries(corrections[group])) {
      assert.match(id, uuid);
      assert.ok(allowed.has(tag));
      assert.equal(typeof text, 'string');
      assert.ok(text.trim().length > 0);
      assert.equal(text.includes('\uFFFD'), false);
    }
  }
});

test('prepared artifact cannot mutate IDs, English, scoring, or attempts', () => {
  const serialized = JSON.stringify(corrections);
  for (const forbidden of ['prompt_en', 'label_en', 'red_score', 'blue_score', 'quiz_attempts', 'quiz_attempt_answers']) {
    assert.equal(serialized.includes(forbidden), false);
  }
});

test('complete canonical review covers 151 questions and 124 options with valid Spanish', () => {
  assert.equal(review.questions.length, 151);
  assert.equal(review.options.length, 124);
  assert.equal(new Set(review.questions.map(row => row.id)).size, 151);
  assert.equal(new Set(review.options.map(row => row.id)).size, 124);
  for (const row of [...review.questions, ...review.options]) {
    assert.ok(row.english.trim());
    assert.ok(row.existing_spanish.trim());
    assert.ok(row.proposed_spanish.trim());
    assert.equal(row.proposed_spanish.includes('\uFFFD'), false);
  }
});

test('all accepted corrections exactly match the complete reviewed corpus', () => {
  for (const [group, rows] of [['questions', review.questions], ['options', review.options]]) {
    const byId = new Map(rows.map(row => [row.id, row]));
    for (const [id, [classification, proposed]] of Object.entries(corrections[group])) {
      assert.equal(byId.get(id)?.proposed_spanish, proposed);
      assert.deepEqual(byId.get(id)?.classifications, [classification]);
    }
  }
});

test('guarded migration changes only localized database columns', () => {
  assert.equal((migration.match(/^update viago_quiz\.questions /gm) ?? []).length, 56);
  assert.equal((migration.match(/^update viago_quiz\.question_options /gm) ?? []).length, 36);
  assert.equal((migration.match(/ set prompt_es = /g) ?? []).length, 56);
  assert.equal((migration.match(/ set label_es = /g) ?? []).length, 36);
  assert.equal((migration.match(/ and prompt = /g) ?? []).length, 112);
  assert.equal((migration.match(/ and label = /g) ?? []).length, 72);
  assert.match(migration, /Spanish question baseline drifted; migration aborted/);
  assert.match(migration, /Spanish option baseline drifted; migration aborted/);
  assert.doesNotMatch(migration, /quiz_attempt|likert_color|red\s*=|blue\s*=|yellow\s*=|green\s*=/);
});

test('known Spanish defects are corrected in approved output', () => {
  const proposed = [...review.questions, ...review.options].map(row => row.proposed_spanish).join('\n');
  assert.doesNotMatch(proposed, /Difundirlo|beneficiandome|será tratado injustamente|disfruto del seguimiento|potencial de crecimiento|más efectivo de lo que me gustaba|Me gustó más que consistente|correcto que rápido/);
  assert.match(proposed, /calmar la situación/);
  assert.match(proposed, /llevarlas hasta el final/);
  assert.match(proposed, /posibilidad de obtener un gran beneficio/);
  assert.doesNotMatch(resultDescriptions, /sinoporque|El Impulsor|El Estabilizador|El Energizador|El Analista/);
});

test('question type and result-color mappings remain unchanged', () => {
  const byType = review.questions.reduce((counts, row) => (counts[row.question_type] = (counts[row.question_type] ?? 0) + 1, counts), {});
  assert.deepEqual(byType, { likert: 120, single: 31 });
  assert.equal(review.questions.filter(row => row.question_type === 'likert' && !row.scoring.likert_color).length, 0);
  for (const row of review.options) {
    assert.deepEqual(Object.keys(row.scoring).sort(), ['blue', 'green', 'red', 'sort_order', 'yellow']);
  }
});
