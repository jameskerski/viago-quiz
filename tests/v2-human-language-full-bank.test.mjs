import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const source=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-293-v2.0.0.json','utf8'));
const successor=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-293-human-v3.0.0.json','utf8'));
const review=JSON.parse(fs.readFileSync('data/v2-research/human-language-full-bank-review-v1.0.0.json','utf8'));

test('frozen source remains exact and successor has independent authority',()=>{
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(source.questions)).digest('hex'),source.bank_hash);
 assert.equal(source.bank_hash,'14fe458091426af874d524b5d1f9417fa0d5c1b23db0b55fa1f9451095bbc4ca');
 assert.equal(successor.parent_bank_hash,source.bank_hash);
 assert.equal(successor.status,'PROPOSED_FROZEN_FOR_OWNER_READABILITY_REVIEW');
 assert.equal(review.production_authority,'NONE');
 assert.notEqual(successor.bank_version,source.bank_version);
 assert.notEqual(successor.bank_hash,source.bank_hash);
});

test('all 293 questions have new revision identities with mappings and metadata preserved',()=>{
 assert.equal(successor.questions.length,293);
 assert.equal(new Set(successor.questions.map(q=>q.question_revision_id)).size,293);
 for(let index=0;index<293;index++){
  const before=source.questions[index]; const after=successor.questions[index];
  assert.equal(after.id,before.id);
  assert.notEqual(after.question_revision_id,before.question_revision_id);
  assert.equal(after.revision.source_question_revision_id,before.question_revision_id);
  for(const key of ['format','color','domain','context','orientation','family','construct','work','weak']) assert.deepEqual(after[key],before[key],`${before.id}:${key}`);
  assert.deepEqual(after.options.map(option=>option.color),before.options.map(option=>option.color),before.id);
  assert.equal(after.revision.measurement_change,false);
  assert.equal(after.revision.mapping_change,false);
  assert.equal(after.revision.scoring_change,false);
 }
});

test('successor meets approved load target and retains option balance',()=>{
 assert.equal(review.metrics.proposed.cognitive_load.MODERATE,0);
 assert.equal(review.metrics.proposed.cognitive_load.HIGH,0);
 assert.equal(review.all_moderate_or_high.length,0);
 assert.ok(review.metrics.proposed.average_prompt_words<review.metrics.current.average_prompt_words);
 assert.ok(review.metrics.proposed.average_option_words<=review.metrics.current.average_option_words);
 assert.ok(review.metrics.proposed.average_option_length_spread<=review.metrics.current.average_option_length_spread);
});

test('successor contains no new exact duplicate question bodies',()=>{
 const signature=q=>`${q.format}|${q.prompt.toLowerCase()}|${q.options.map(o=>`${o.color}:${o.label.toLowerCase()}`).join('|')}`;
 assert.equal(new Set(successor.questions.map(signature)).size,293);
 assert.equal(review.integrity.no_new_duplicates,true);
});

test('risk review and deterministic samples resolve to successor questions',()=>{
 const ids=new Set(successor.questions.map(q=>q.question_revision_id));
 assert.equal(review.hardest_rewrites.length,30);
 assert.equal(review.random_quality_sample.length,20);
 for(const id of [...review.hardest_rewrites,...review.random_quality_sample,...review.semantic_risk_items.map(item=>item.question_revision_id)]) assert.ok(ids.has(id),id);
});
