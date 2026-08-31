import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const batch = read('data/v2-reconstruction/review-batch-04.json');
const audit = read('data/v2-audit/current-question-audit.json');
const backlog = read('data/v2-reconstruction/question-expansion-backlog.json');

test('Batch 04 covers exactly legacy questions 76 through 100', () => {
  assert.equal(batch.questions.length, 25);
  assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(75, 100).map((item) => item.canonical_id));
  assert.deepEqual(batch.counts, { KEEP_EXACTLY: 1, REWORD: 11, REPLACE: 2, RETIRE: 11 });
  assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 13, REWORD: 34, REPLACE: 24, RETIRE: 29 });
});

test('Batch 04 remains pending and non-production', () => {
  assert.equal(batch.status, 'OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION');
  assert.equal(batch.production_impact, 'NONE');
  assert.ok(batch.questions.every((item) => item.runtime_authority === false));
  assert.ok(batch.questions.every((item) => item.quality.owner_review_state === 'OWNER_APPROVED'));
});

test('Batch 04 keeps single-select mappings balanced', () => {
  for (const item of batch.questions.filter((item) => item.format === 'SINGLE_SELECT' && item.proposed)) {
    assert.deepEqual(item.proposed.options.map((option) => option.color).sort(), ['blue', 'green', 'red', 'yellow']);
  }
});

test('Batch 04 backlog approvals are preserved', () => {
  const approved = backlog.entries.filter((item) => item.discovered_in === 'BATCH_04');
  assert.equal(approved.length, 2);
  assert.ok(approved.every((item) => item.owner_review_state === 'OWNER_APPROVED'));
});

test('Batch 04 artifacts remain isolated from runtime', () => {
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /review-batch-04|question-expansion-backlog/);
});

test('OWNER handoff contains the required sections', () => {
  const handoff = fs.readFileSync(path.join(root, 'docs/v2/CANONICAL_BANK_REVIEW_BATCH_04.md'), 'utf8');
  for (const section of ['## Batch counts', '## Cumulative counts', '## Coverage observations', '## Expansion backlog changes', '## OWNER decisions required', '## Production boundary']) assert.ok(handoff.includes(section));
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}
