import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const bank=JSON.parse(fs.readFileSync('data/v2-research/viago-validation-bank-human-recognition-purge-v1.0.0.json','utf8'));
const review=JSON.parse(fs.readFileSync('data/v2-research/human-recognition-complete-bank-purge-v1.0.0.json','utf8'));
const simulation=JSON.parse(fs.readFileSync('data/v2-research/human-recognition-purge-1000-participant-simulation.json','utf8'));

test('complete source inventory reconciles without silent identity loss',()=>{
 assert.equal(review.source_inventory.unique_identities,390);
 assert.equal(review.reconciliation.total,390);
 assert.equal(review.reconciliation.source,review.reconciliation.retained+review.reconciliation.replaced+review.reconciliation.retired+review.reconciliation.deferred);
 assert.equal(review.decisions.length,390);
 assert.equal(new Set(review.decisions.map(x=>x.id)).size,390);
});

test('purged bank is separately identified, immutable, and not active',()=>{
 assert.equal(bank.status,'PROPOSED_FOR_OWNER_REVIEW_NOT_ACTIVE');
 assert.equal(bank.parent_bank_version,'viago-validation-bank-308-human-recognition-v6.0.0');
 assert.equal(bank.question_count,240);
 assert.deepEqual(bank.formats,{LIKERT:112,SINGLE_SELECT:128});
 assert.deepEqual(bank.likert_by_color,{red:28,blue:28,yellow:28,green:28});
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,240);
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex'),bank.bank_hash);
});

test('final single-select bank has zero weak, alignment, distinction, or duplicate failures',()=>{
 assert.equal(review.quality.single_select.length,128);
 assert.equal(review.quality.single_select.some(x=>x.classification==='WEAK'),false);
 assert.equal(review.quality.prompt_answer_alignment_failures_after,0);
 assert.equal(review.quality.answer_distinction_failures_after,0);
 assert.equal(review.redundancy.exact_duplicates_after,0);
});

test('history-aware four-attempt simulation passes at actual bank depth',()=>{
 assert.equal(simulation.participants,1000);
 assert.equal(simulation.attempts_each,4);
 assert.equal(simulation.selector_failures,0);
 assert.equal(simulation.scoring_changes,'NONE');
 for(const attempt of simulation.attempts){assert.equal(attempt.single,26);assert.equal(attempt.likert,24);assert.ok(attempt.contexts>=30);assert.ok(attempt.work<2)}
 for(const transition of simulation.transitions){assert.equal(transition.exact,0);assert.equal(transition.revision,0);assert.equal(transition.family,0);assert.ok(transition.construct<1);assert.ok(transition.experiential<0.5)}
});

test('purge remains isolated from active runtime and production authority',()=>{
 const runtimeFiles=['lib/v2/validation.ts','data/v2-governance/active-validation-bank.json','app/api/v2/validation/route.ts'].map(file=>fs.readFileSync(file,'utf8')).join('\n');
 assert.doesNotMatch(runtimeFiles,/viago-validation-bank-240-human-recognition-purge-v1\.0\.0/);
 assert.equal(review.quality.new_gap_fill_questions.length,0);
});
