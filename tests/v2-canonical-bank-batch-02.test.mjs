import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const batch = read('data/v2-reconstruction/review-batch-02.json');
const audit = read('data/v2-audit/current-question-audit.json');

test('Batch 02 covers exactly legacy questions 26 through 50', () => {
  assert.equal(batch.questions.length, 25);
  assert.equal(new Set(batch.questions.map((item) => item.question_id)).size, 25);
  assert.deepEqual(batch.questions.map((item) => item.question_id), audit.questions.slice(25, 50).map((item) => item.canonical_id));
  assert.deepEqual(batch.counts, { KEEP_EXACTLY: 5, REWORD: 7, REPLACE: 7, RETIRE: 6 });
  assert.deepEqual(batch.cumulative_counts, { KEEP_EXACTLY: 8, REWORD: 15, REPLACE: 16, RETIRE: 11 });
});

test('Batch 02 remains pending, review-only, and fail-closed', () => {
  assert.equal(batch.status, 'OWNER_APPROVED_PROPOSED_CANONICAL_NON_PRODUCTION');
  assert.equal(batch.production_impact, 'NONE');
  assert.ok(batch.questions.every((item) => item.runtime_authority === false));
  assert.ok(batch.questions.every((item) => item.quality.owner_review_state === 'OWNER_APPROVED'));
});

test('each disposition preserves deterministic traceability', () => {
  for (const item of batch.questions) {
    assert.match(item.current_revision_id, new RegExp(`^legacy:${item.question_id}:`));
    if (item.proposed_disposition === 'REWORD') assert.match(item.proposed_revision_id, new RegExp(`^legacy:${item.question_id}:proposed-v2-batch-02$`));
    if (item.proposed_disposition === 'REPLACE') assert.match(item.replacement.question_id, /^C0[1-3]-/);
    if (item.proposed_disposition === 'RETIRE') assert.equal(item.proposed, null);
  }
});

test('reconstruction artifacts remain isolated from application runtime', () => {
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /review-batch-02|batch-01-owner-approval/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}
