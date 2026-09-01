import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(new URL(`../${p}`,import.meta.url),'utf8'));
const source=read('data/v2-research/validation-bank-292-engagement-v4.0.0.json');
const bank=read('data/v2-research/validation-bank-292-expression-v5.0.0.json');
const review=read('data/v2-research/behavioral-expression-bank-review-v1.0.0.json');
const model=read('data/v2-governance/viago-behavioral-expression-model-v1.json');

test('behavioral expression model covers all 22 governed dimensions for four colors',()=>{
  assert.equal(model.model_id,'VIAGO_BEHAVIORAL_EXPRESSION_MODEL_V1');
  assert.equal(model.status,'OWNER_APPROVED_FROZEN');
  assert.equal(model.provenance.owner_reference_custody,'PRIVATE_OWNER_EVIDENCE_NOT_IN_PUBLIC_SOURCE_CONTROL');
  assert.equal(model.dimensions.length,22);
  for(const color of ['red','blue','yellow','green']){
    assert.deepEqual(Object.keys(model.colors[color]),model.dimensions);
    for(const dimension of model.dimensions) assert.ok(model.classifications.includes(model.colors[color][dimension].classification));
  }
  assert.equal(model.negative_scoring.implemented,false);
});

test('all 292 identities are reviewed exactly once with no skipped source item',()=>{
  assert.equal(review.complete_review.source_count,292);
  assert.equal(review.complete_review.reviewed_count,292);
  assert.equal(review.complete_review.unique_source_ids,292);
  assert.deepEqual(review.complete_review.skipped,[]);
  assert.equal(new Set(review.item_reviews.map(x=>x.id)).size,292);
});

test('successor is immutable, separately identified, and preserves scoring semantics',()=>{
  assert.notEqual(bank.bank_version,source.bank_version);
  assert.notEqual(bank.bank_hash,source.bank_hash);
  assert.equal(bank.question_count,292);
  assert.deepEqual(bank.formats,{LIKERT:143,SINGLE_SELECT:149});
  for(const q of bank.questions){
    const old=source.questions.find(x=>x.id===q.id); assert.ok(old);
    assert.equal(q.format,old.format); assert.equal(q.color,old.color);
    assert.equal(q.family,old.family); assert.equal(q.construct,old.construct);
    assert.deepEqual(q.options.map(o=>o.color),old.options.map(o=>o.color));
  }
  assert.equal(review.scoring_integrity.mappings_unchanged,true);
  assert.equal(review.scoring_integrity.scoring_unchanged,true);
  assert.equal(review.scoring_integrity.assembler_architecture_unchanged,true);
});

test('final single-select bank has no ambiguity, distinction failure, or mechanical parallelism failure',()=>{
  assert.equal(review.answer_distinction_failure.after,0);
  assert.equal(review.mechanical_option_parallelism.after,0);
  assert.equal(review.single_select_clarity.AMBIGUOUS??0,0);
  assert.equal(review.single_select_clarity.REQUIRES_THOUGHT??0,0);
  assert.equal((review.single_select_clarity.INSTANTLY_DISTINCT??0)+(review.single_select_clarity.CLEAR??0),149);
});

test('simulation preserves deterministic equal-opportunity architecture without family collisions',()=>{
  assert.equal(review.simulation.iterations,2000);
  assert.deepEqual(review.simulation.composition,{single:26,likert:24,likert_per_color:6});
  assert.equal(review.simulation.semantic_family_collisions,0);
  assert.equal(review.simulation.selector_failures,0);
  assert.equal(review.simulation.clarity_per_attempt.ambiguous,0);
  for(const example of review.simulation.examples){
    assert.equal(example.question_count,50); assert.equal(example.single,26); assert.equal(example.likert,24);
    assert.deepEqual(example.likert_colors,{red:6,blue:6,yellow:6,green:6});
  }
});

test('OWNER-authorized V5 remains immutable historical evidence after V6 successor selection',()=>{
  assert.equal(bank.status,'OWNER_AUTHORIZED_ACTIVE_VALIDATION');
  assert.equal(review.production_impact,'NONE');
  assert.equal(review.historical_attempts_unchanged,true);
  const runtime=fs.readFileSync(new URL('../lib/v2/validation.ts',import.meta.url),'utf8');
  assert.match(runtime,/viago-validation-bank-308-human-recognition-v6\.0\.0/);
});
