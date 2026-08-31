import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const batch = read('data/v2-reconstruction/review-batch-05.json');
const audit = read('data/v2-audit/current-question-audit.json');
const backlog = read('data/v2-reconstruction/question-expansion-backlog.json');

test('Batch 05 covers exactly legacy questions 101 through 125', () => {
  assert.equal(batch.questions.length, 25);
  assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(100, 125).map((item) => item.canonical_id));
  assert.deepEqual(batch.counts, { KEEP_EXACTLY: 1, REWORD: 7, REPLACE: 2, RETIRE: 15 });
  assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 14, REWORD: 41, REPLACE: 26, RETIRE: 44 });
});

test('Batch 05 remains pending and non-production', () => {
  assert.equal(batch.status, 'PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION');
  assert.equal(batch.production_impact, 'NONE');
  assert.ok(batch.questions.every((item) => item.runtime_authority === false));
  assert.ok(batch.questions.every((item) => item.quality.owner_review_state === 'PENDING_BATCH_REVIEW'));
});

test('Batch 05 keeps proposed single-select mappings balanced', () => {
  for (const item of batch.questions.filter((item) => item.format === 'SINGLE_SELECT' && item.proposed)) {
    assert.deepEqual(item.proposed.options.map((option) => option.color).sort(), ['blue', 'green', 'red', 'yellow']);
  }
});

test('Batch 05 preserves approved backlog and adds only EXP-009 for review', () => {
  assert.equal(backlog.entries.length, 9);
  assert.ok(backlog.entries.slice(0, 8).every((item) => item.owner_review_state === 'OWNER_APPROVED'));
  const added = backlog.entries.filter((item) => item.discovered_in === 'BATCH_05');
  assert.deepEqual(added.map((item) => item.backlog_id), ['EXP-009']);
  assert.equal(added[0].owner_review_state, 'PENDING_BATCH_REVIEW');
});

test('Batch 05 artifacts remain isolated from runtime', () => {
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /review-batch-05|batch-04-owner-approval/);
});

test('Batch 05 OWNER handoff contains every question and required summaries', () => {
  const handoff = fs.readFileSync(path.join(root, 'docs/v2/CANONICAL_BANK_REVIEW_BATCH_05.md'), 'utf8');
  assert.equal((handoff.match(/^## \d+\./gm) ?? []).length, 25);
  for (const section of ['## Batch counts', '## Cumulative counts', '## Coverage observations', '## Expansion backlog changes', '## OWNER decisions required', '## Production boundary']) assert.ok(handoff.includes(section));
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}
