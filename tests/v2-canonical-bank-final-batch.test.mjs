import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));
const batch = read('data/v2-reconstruction/review-final-batch.json');
const audit = read('data/v2-audit/current-question-audit.json');

test('final batch covers exactly questions 126 through 151', () => {
  assert.equal(batch.questions.length, 26);
  assert.deepEqual(batch.questions.map((x) => x.question_id), audit.questions.slice(125).map((x) => x.canonical_id));
  assert.deepEqual(batch.counts, { KEEP_EXACTLY: 5, REWORD: 9, REPLACE: 2, RETIRE: 10 });
});
test('final legacy totals reconcile exactly to 151', () => {
  assert.deepEqual(batch.final_legacy_counts, { KEEP_EXACTLY: 19, REWORD: 50, REPLACE: 28, RETIRE: 54 });
  assert.equal(Object.values(batch.final_legacy_counts).reduce((a,b)=>a+b,0),151);
  assert.ok(Math.abs(Object.values(batch.final_legacy_percentages).reduce((a,b)=>a+b,0)-100)<0.02);
  assert.equal(batch.reconstructed_legacy_coverage.admitted_question_count,97);
});
test('all proposed single-selects retain one defensible response per color', () => {
  for (const x of batch.questions.filter((x)=>x.format==='SINGLE_SELECT'&&x.proposed)) assert.deepEqual(x.proposed.options.map((o)=>o.color).sort(),['blue','green','red','yellow']);
});
test('final review remains non-production and runtime-isolated', () => {
  assert.equal(batch.production_impact,'NONE');
  assert.ok(batch.questions.every((x)=>x.runtime_authority===false));
  for (const f of [...walk(path.join(root,'app')),...walk(path.join(root,'lib'))]) assert.doesNotMatch(fs.readFileSync(f,'utf8'),/review-final-batch|CANONICAL_BANK_FINAL_LEGACY_REVIEW/);
});
test('OWNER report contains 26 questions and every required final section', () => {
  const doc=fs.readFileSync(path.join(root,'docs/v2/CANONICAL_BANK_FINAL_LEGACY_REVIEW.md'),'utf8');
  assert.equal((doc.match(/^## \d+\./gm)||[]).length,26);
  for(const h of ['## Executive Summary','## Final-batch counts','## Final 151-question legacy reconstruction counts','## Legacy reconstruction findings','## Complete reconstructed legacy-only coverage snapshot','## Complete expansion backlog','## Recommended next step','## Further questions','## Caveats and assumptions']) assert.ok(doc.includes(h));
});
function* walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())yield* walk(f);else yield f;}}
