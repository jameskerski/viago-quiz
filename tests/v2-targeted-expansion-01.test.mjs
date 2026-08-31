import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const data=JSON.parse(fs.readFileSync(new URL("../data/v2-proposals/targeted-expansion-01.json",import.meta.url),"utf8"));

test("targeted expansion 01 remains review-only and correctly sized",()=>{
 assert.equal(data.status,"PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION");
 assert.equal(data.production_impact,"NONE");
 assert.equal(data.candidates.length,28);
 assert.equal(data.counts.single_select,20);
 assert.equal(data.counts.likert,8);
 assert.equal(data.counts.projected_unique_bank_if_all_admitted,148);
});

test("single-select candidates provide one option per color with balanced mapping",()=>{
 for(const item of data.candidates.filter(x=>x.format==="SINGLE_SELECT")){
  assert.deepEqual(item.options.map(x=>x.color),["red","blue","yellow","green"]);
  assert.equal(new Set(item.options.map(x=>x.label)).size,4);
  assert.equal(item.pairwise_contribution.length,6);
 }
});

test("tranche materially closes priority gaps without work dominance",()=>{
 assert.ok(data.counts.orientations.PREFERENCE_IN_OTHERS>=14);
 assert.ok(data.counts.non_work_share>=0.7);
 for(const id of ["EXP-004","EXP-009","EXP-010","EXP-011"])assert.ok(data.counts.backlog_coverage[id]>0);
});

test("semantic screening and runtime isolation are preserved",()=>{
 assert.ok(data.semantic_screen_rejects.length>=5);
 assert.ok(data.candidates.every(x=>x.runtime_authority===false));
 const runtime=fs.readFileSync(new URL("../app/v2/page.tsx",import.meta.url),"utf8");
 assert.equal(runtime.includes("targeted-expansion-01"),false);
});
