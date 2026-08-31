import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const batch = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-reconstruction/review-batch-01.json'), 'utf8'));
const schema = JSON.parse(fs.readFileSync(path.join(root, 'data/v2-governance/canonical-question-metadata-schema-v1.json'), 'utf8'));

test('Batch 01 gives exactly one non-production disposition to 25 legacy questions', () => {
  assert.equal(batch.questions.length, 25);
  assert.equal(new Set(batch.questions.map((item) => item.question_id)).size, 25);
  assert.deepEqual(batch.counts, { KEEP_EXACTLY: 3, REWORD: 8, REPLACE: 9, RETIRE: 5 });
  assert.equal(batch.production_impact, 'NONE');
  assert.ok(batch.questions.every((item) => item.quality.owner_review_state === 'PENDING_BATCH_REVIEW'));
});

test('revision identities and legacy traceability fail closed', () => {
  for (const item of batch.questions) {
    assert.match(item.current_revision_id, new RegExp(`^legacy:${item.question_id}:`));
    if (item.proposed_disposition === 'REWORD') assert.match(item.proposed_revision_id, new RegExp(`^legacy:${item.question_id}:proposed-v2-batch-01$`));
    else assert.equal(item.proposed_revision_id, null);
    if (item.proposed_disposition === 'REPLACE') assert.ok(item.replacement.question_id.startsWith('C0'));
  }
});

test('metadata architecture is proposed and never runtime authority', () => {
  assert.equal(schema.status, 'PROPOSED_FOR_OWNER_REVIEW');
  assert.equal(schema.runtime_authority, false);
  assert.equal(schema.governance.production_boundary.includes('non-production'), true);
  assert.equal(batch.questions.every((item) => item.runtime_authority === false), true);
});

test('reconstruction artifacts remain isolated from application runtime', () => {
  for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'lib'))]) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /review-batch-01|canonical-question-metadata-schema|canonical-question-taxonomies/);
  }
});

function* walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else yield fullPath;
  }
}
