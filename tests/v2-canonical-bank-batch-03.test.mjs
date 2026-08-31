import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const batch = read('data/v2-reconstruction/review-batch-03.json');
const audit = read('data/v2-audit/current-question-audit.json');
const backlog = read('data/v2-reconstruction/question-expansion-backlog.json');

test('Batch 03 covers exactly legacy questions 51 through 75', () => {
  assert.equal(batch.questions.length, 25);
  assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(50, 75).map((item) => item.canonical_id));
  assert.deepEqual(batch.counts, { KEEP_EXACTLY: 4, REWORD: 8, REPLACE: 6, RETIRE: 7 });
  assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 12, REWORD: 23, REPLACE: 22, RETIRE: 18 });
});

test('Batch 03 remains pending and isolated from runtime authority', () => {
  assert.equal(batch.status, 'PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION');
  assert.equal(batch.production_impact, 'NONE');
  assert.ok(batch.questions.every((item) => item.runtime_authority === false));
  assert.ok(batch.questions.every((item) => item.quality.owner_review_state === 'PENDING_BATCH_REVIEW'));
});

test('proposed single-select responses retain one mapping per color', () => {
  for (const item of batch.questions.filter((item) => item.format === 'SINGLE_SELECT' && item.proposed)) {
    assert.deepEqual(item.proposed.options.map((option) => option.color).sort(), ['blue', 'green', 'red', 'yellow']);
  }
});

test('expansion backlog is formal, prioritized, and non-production', () => {
  assert.equal(backlog.backlog_id, 'VIAGO_QUESTION_EXPANSION_BACKLOG');
  assert.equal(backlog.production_impact, 'NONE');
  assert.equal(backlog.entries.length, 6);
  assert.ok(backlog.entries.every((item) => ['HIGH', 'MEDIUM'].includes(item.priority)));
});

test('Batch 03 and backlog artifacts remain absent from application runtime', () => {
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /review-batch-03|question-expansion-backlog/);
  }
});

test('OWNER handoff contains every required summary section', () => {
  const handoff = fs.readFileSync(path.join(root, 'docs/v2/CANONICAL_BANK_REVIEW_BATCH_03.md'), 'utf8');
  for (const section of ['## Batch counts', '## Cumulative counts', '## Coverage observations', '## Expansion backlog changes', '## OWNER decisions required', '## Production boundary']) {
    assert.ok(handoff.includes(section));
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}
