import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const bank=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-293-v2.0.0.json','utf8'));
const calibration=JSON.parse(fs.readFileSync('data/v2-research/human-language-calibration-v1.0.0.json','utf8'));

test('calibration samples 30 frozen-bank questions without changing authority',()=>{
 assert.equal(calibration.status,'PROPOSED_FOR_OWNER_VOICE_CALIBRATION');
 assert.equal(calibration.items.length,30);
 assert.deepEqual(calibration.sample.formats,{LIKERT:12,SINGLE_SELECT:18});
 assert.equal(calibration.production_authority,'NONE');
 assert.equal(calibration.frozen_source.bank_version,'viago-validation-bank-293-v2.0.0');
 assert.equal(calibration.frozen_source.bank_hash,'14fe458091426af874d524b5d1f9417fa0d5c1b23db0b55fa1f9451095bbc4ca');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(bank.questions)).digest('hex'),bank.bank_hash);
});

test('every current phrase is exact and every proposed mapping is preserved',()=>{
 for(const item of calibration.items){
  const frozen=bank.questions.find(question=>question.question_revision_id===item.question_revision_id);
  assert.ok(frozen,item.question_revision_id);
  assert.equal(item.current.prompt,frozen.prompt);
  assert.deepEqual(item.current.options,Object.fromEntries(frozen.options.map(option=>[option.color,option.label])));
  assert.equal(item.preservation_check.same_option_mapping,true);
  assert.equal(item.preservation_check.no_scoring_change,true);
  assert.ok(item.measures&&item.must_not_change&&item.why_easier);
 }
});

test('sample spans governed formats, colors, sources, contexts, and orientations',()=>{
 assert.deepEqual(new Set(calibration.sample.colors),new Set(['red','blue','yellow','green']));
 assert.ok(calibration.sample.sources.includes('reconstructed-legacy'));
 assert.ok(calibration.sample.sources.includes('final-pretest-expansion-v2'));
 assert.ok(calibration.sample.contexts.length>=12);
 assert.ok(calibration.sample.orientations.length>=5);
});

test('proposed calibration eliminates moderate and high reading load in the sample',()=>{
 assert.equal(calibration.metrics.proposed_cognitive_load.MODERATE,0);
 assert.equal(calibration.metrics.proposed_cognitive_load.HIGH,0);
 assert.ok(calibration.metrics.average_proposed_prompt_words<calibration.metrics.average_current_prompt_words);
 assert.ok(calibration.metrics.average_proposed_option_words<calibration.metrics.average_current_option_words);
});
