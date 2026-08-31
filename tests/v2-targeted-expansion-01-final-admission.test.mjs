import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const d=JSON.parse(fs.readFileSync(new URL("../data/v2-reconstruction/targeted-expansion-01-final-admission.json",import.meta.url),"utf8"));
test("final admission records the exact OWNER disposition",()=>{assert.equal(d.dispositions.ADMIT.length,25);assert.deepEqual(d.dispositions.REVISE_AND_ADMIT,["EXP1-S-10","EXP1-S-11","EXP1-L-G-02"]);assert.equal(d.dispositions.DEFER_REDUNDANCY.length,0);assert.equal(d.dispositions.RETIRE_CANDIDATE.length,0)});
test("three requested revisions are exact and balanced",()=>{assert.equal(d.revisions.find(x=>x.candidate_id==="EXP1-L-G-02").wording,"After a mistake, I want to understand why it happened before I try the same task again.");for(const id of["EXP1-S-10","EXP1-S-11"])assert.deepEqual(d.revisions.find(x=>x.candidate_id===id).options.map(x=>x.color),["red","blue","yellow","green"])});
test("bank, format, and orientation totals reconcile",()=>{assert.equal(d.admission_summary.resulting_unique_bank,148);assert.deepEqual(d.admission_summary.formats,{LIKERT:81,SINGLE_SELECT:67});assert.equal(Object.values(d.admission_summary.orientations).reduce((a,b)=>a+b,0),148);assert.equal(d.admission_summary.orientations.PREFERENCE_IN_OTHERS,21)});
test("final admission remains non-production and runtime-isolated",()=>{assert.equal(d.production_impact,"NONE");assert.equal(d.runtime_authority,false);const app=fs.readFileSync(new URL("../app/v2/page.tsx",import.meta.url),"utf8");assert.equal(app.includes("targeted-expansion-01-final-admission"),false)});
