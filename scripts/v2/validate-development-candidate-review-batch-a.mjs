#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
const read=f=>JSON.parse(fs.readFileSync(f,"utf8"));
const x=read("data/v2-reconstruction/development-candidate-review-batch-a.json");
const approval=read("data/v2-reconstruction/final-legacy-owner-approval.json");
const taxonomy=read("data/v2-governance/canonical-question-taxonomies-v1.json");
assert.equal(approval.status,"OWNER_APPROVED_REVIEW_BASELINE_NON_PRODUCTION");
assert.equal(x.status,"PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION");
assert.equal(x.production_impact,"NONE");
assert.equal(x.records.length,28);
assert.deepEqual(x.counts,{ADMIT:10,REVISE:3,REPLACE_LEGACY:11,DEFER_REDUNDANCY:4,RETIRE_CANDIDATE:0});
assert.equal(x.unique_replacements_represented,11);
assert.equal(x.legacy_identities_replaced,12);
assert.equal(x.early_potential_unique_bank_count,109);
assert.equal(new Set(x.records.map(r=>r.candidate_id)).size,28);
assert.deepEqual(x.records.slice(0,16).map(r=>r.cohort),Array(16).fill("COHORT_01"));
assert.deepEqual(x.records.slice(16).map(r=>r.candidate_id),Array.from({length:12},(_,i)=>`C02-S-${String(i+1).padStart(2,"0")}`));
for(const r of x.records){
  assert.equal(r.runtime_authority,false);
  assert.ok(r.closest_reconstructed_legacy?.question_id);
  assert.ok(r.closest_development_candidate);
  assert.ok(r.what_unique_value_it_adds.length>30);
  assert.ok(taxonomy.behavioral_domains.includes(r.measurement.behavioral_domain));
  assert.ok(taxonomy.life_contexts.includes(r.measurement.life_context));
  assert.ok(r.measurement.situational_tones.every(v=>taxonomy.situational_tones.includes(v)));
  assert.ok(taxonomy.orientations.includes(r.measurement.orientation));
  assert.ok(r.measurement.pairwise_discrimination.every(v=>taxonomy.pairwise_discrimination.includes(v)));
  if(r.options.length)assert.deepEqual(r.options.map(o=>o.color).sort(),["blue","green","red","yellow"]);
  if(r.decision==="REVISE")assert.ok(r.revised_wording?.length>40);
  if(r.decision==="REPLACE_LEGACY")assert.ok(r.replaced_legacy_identities.length>0);
  else assert.equal(r.replaced_legacy_identities.length,0);
}
const covered=new Set(x.records.filter(r=>r.decision==="REPLACE_LEGACY").flatMap(r=>r.replaced_legacy_identities.map(y=>y.question_id)));
assert.equal(covered.size,12);
console.log(JSON.stringify({status:"PASS",counts:x.counts,unique_replacements:11,legacy_identities_replaced:12,early_unique_bank:109,production_impact:"NONE"},null,2));
