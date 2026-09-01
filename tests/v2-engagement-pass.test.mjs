import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const source=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-293-human-v3.0.1.json','utf8'));
const bank=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-292-engagement-v4.0.0.json','utf8'));
const audit=JSON.parse(fs.readFileSync('data/v2-research/engagement-audit-v1.0.0.json','utf8'));

test('engagement bank is a non-authoritative immutable successor',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(source.questions)).digest('hex'),source.bank_hash);
 assert.equal(bank.parent_bank_version,source.bank_version);
 assert.equal(bank.parent_bank_hash,source.bank_hash);
 assert.equal(bank.status,'OWNER_AUTHORIZED_ACTIVE_VALIDATION');
 assert.equal(audit.integrity.production_authority,'NONE');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex'),bank.bank_hash);
});

test('OWNER-rejected recipe item is retired without replacement or history loss',()=>{
 assert.equal(source.questions.some(q=>q.id==='C03-S-06'),true);
 assert.equal(bank.questions.some(q=>q.id==='C03-S-06'),false);
 assert.deepEqual(bank.retired,[{
  id:'C03-S-06',
  source_question_revision_id:'C03-S-06@human-1.0.0',
  disposition:'OWNER_REJECTED_PRESERVE_HISTORY',
  replacement_needed:false,
  rationale:'The causal-testing construct remains covered elsewhere; replacement would add no demonstrated gap.'
 }]);
 assert.equal(bank.question_count,292);
});

test('engagement edits preserve all admitted mappings and measurement metadata',()=>{
 assert.equal(bank.questions.length,292);
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,292);
 assert.equal(new Set(bank.questions.map(q=>q.question_revision_id)).size,292);
 for(const after of bank.questions){
  const before=source.questions.find(q=>q.id===after.id); assert.ok(before,after.id);
  for(const key of ['format','color']) assert.deepEqual(after[key],before[key],`${after.id}:${key}`);
  if(after.id!=='0ff7b326-c6ce-4cd5-994e-5ce1b6b78552') for(const key of ['domain','family','construct']) assert.deepEqual(after[key],before[key],`${after.id}:${key}`);
  assert.deepEqual(after.options.map(o=>o.color),before.options.map(o=>o.color),after.id);
  if(after.engagement_revision){
   if(after.id==='0ff7b326-c6ce-4cd5-994e-5ce1b6b78552') assert.equal(after.engagement_revision.measurement_change,'BROADENED_FROM_WORKDAY_ENVIRONMENT_TO_CROSS_CONTEXT_SATISFACTION_REWARD');
   else assert.equal(after.engagement_revision.measurement_change,false);
   assert.equal(after.engagement_revision.mapping_change,false);
   assert.equal(after.engagement_revision.scoring_change,false);
   assert.equal(after.engagement_revision.semantic_family_change,after.id==='0ff7b326-c6ce-4cd5-994e-5ce1b6b78552');
  }
 }
 assert.equal(audit.integrity.exact_collisions,false);
 assert.equal(audit.integrity.virtue_loading_regression,false);
 assert.equal(audit.integrity.stereotype_regression,false);
});

test('successor has no moderate/high or dry/mechanical classified items',()=>{
 assert.equal(audit.after.readability.MODERATE??0,0);
 assert.equal(audit.after.readability.HIGH??0,0);
 assert.equal(audit.after.engagement.DRY??0,0);
 assert.equal(audit.after.engagement.MECHANICAL??0,0);
 assert.deepEqual(audit.dispositions,{KEEP:29,POLISH:10,'RE-SCENE':15,RETIRE:1});
});

test('option distinctness audit records resolved and unresolved cases explicitly',()=>{
 assert.ok(audit.mechanical_option_parallelism.before.includes('C03-S-06'));
 assert.equal(audit.mechanical_option_parallelism.after.includes('C03-S-06'),false);
 assert.equal(audit.mechanical_option_parallelism.unresolved.length,0);
 assert.match(audit.mechanical_option_parallelism.resolved_decisions['7d22afa7-f5b6-450c-93d4-a8b2f3318410'],/^PRESERVE/);
 assert.match(audit.mechanical_option_parallelism.resolved_decisions['EXP3-S-031'],/^PRESERVE/);
});

test('0ff7b326 semantic expansion is explicitly governed instead of claiming equivalence',()=>{
 const question=bank.questions.find(q=>q.id==='0ff7b326-c6ce-4cd5-994e-5ce1b6b78552');
 assert.equal(question.domain,'reward-preference');
 assert.equal(question.context,'ordinary-life');
 assert.equal(question.family,'preferred-day-satisfaction-reward');
 assert.equal(question.construct,'preferred-reward-pattern');
 assert.equal(audit.semantic_reconciliations.length,1);
 assert.equal(audit.integrity.semantic_family_reconciliation_count,1);
 assert.equal(audit.integrity.semantic_families_preserved_or_reconciled,true);
});

test('20 deterministic simulated attempts preserve 26 single and 24 balanced Likert questions',()=>{
 assert.equal(audit.simulations.length,20);
 const byRevision=new Map(bank.questions.map(q=>[q.question_revision_id,q]));
 for(const simulation of audit.simulations){
  assert.equal(simulation.question_revision_ids.length,50);
  assert.equal(new Set(simulation.question_revision_ids).size,50);
  const questions=simulation.question_revision_ids.map(id=>byRevision.get(id));
  assert.equal(questions.filter(q=>q.format==='SINGLE_SELECT').length,26);
  assert.equal(questions.filter(q=>q.format==='LIKERT').length,24);
  for(const color of ['red','blue','yellow','green']) assert.equal(questions.filter(q=>q.format==='LIKERT'&&q.color===color).length,6);
 }
});
