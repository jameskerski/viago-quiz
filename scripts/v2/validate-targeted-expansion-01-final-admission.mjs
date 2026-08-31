#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const approval=JSON.parse(fs.readFileSync(path.join(ROOT,"data/v2-reconstruction/targeted-expansion-01-final-admission.json"),"utf8"));
const source=JSON.parse(fs.readFileSync(path.join(ROOT,"data/v2-proposals/targeted-expansion-01.json"),"utf8"));
const baseline=JSON.parse(fs.readFileSync(path.join(ROOT,"data/v2-reconstruction/development-candidate-review-batch-b.json"),"utf8")).combined_coverage;
const fail=(m)=>{throw new Error(m)};
const admitted=[...approval.dispositions.ADMIT,...approval.dispositions.REVISE_AND_ADMIT];
if(approval.status!=="OWNER_APPROVED_NON_PRODUCTION_CANONICAL_RESEARCH_BANK"||approval.production_impact!=="NONE"||approval.runtime_authority!==false)fail("authority boundary invalid");
if(source.candidates.length!==28||new Set(admitted).size!==28||admitted.some(id=>!source.candidates.some(x=>x.candidate_id===id)))fail("candidate reconciliation invalid");
if(approval.dispositions.ADMIT.length!==25||approval.dispositions.REVISE_AND_ADMIT.length!==3||approval.dispositions.DEFER_REDUNDANCY.length||approval.dispositions.RETIRE_CANDIDATE.length)fail("dispositions invalid");
if(approval.revisions.length!==3||approval.revisions.map(x=>x.candidate_id).sort().join()!==approval.dispositions.REVISE_AND_ADMIT.slice().sort().join())fail("revision identities invalid");
if(approval.admission_summary.resulting_unique_bank!==148||approval.admission_summary.starting_bank+approval.admission_summary.admitted_candidates!==148)fail("bank arithmetic invalid");
if(approval.admission_summary.formats.LIKERT!==81||approval.admission_summary.formats.SINGLE_SELECT!==67)fail("format totals invalid");
if(Object.values(approval.admission_summary.orientations).reduce((a,b)=>a+b,0)!==148||approval.admission_summary.orientations.PREFERENCE_IN_OTHERS!==21)fail("orientation totals invalid");
const independentlyDerivedFormats={LIKERT:baseline.format_balance.LIKERT+source.candidates.filter(x=>x.format==="LIKERT").length,SINGLE_SELECT:baseline.format_balance.SINGLE_SELECT+source.candidates.filter(x=>x.format==="SINGLE_SELECT").length};
if(JSON.stringify(independentlyDerivedFormats)!==JSON.stringify(approval.admission_summary.formats))fail("independent format reconciliation failed");
const independentlyDerivedOrientations={...baseline.orientations};for(const x of source.candidates)independentlyDerivedOrientations[x.orientation]=(independentlyDerivedOrientations[x.orientation]||0)+1;
for(const [key,value] of Object.entries(independentlyDerivedOrientations))if(approval.admission_summary.orientations[key]!==value)fail(`independent orientation reconciliation failed: ${key}`);
const green=approval.revisions.find(x=>x.candidate_id==="EXP1-L-G-02");if(green.wording!=="After a mistake, I want to understand why it happened before I try the same task again."||/confidence|anxiety|self-esteem/i.test(green.wording))fail("Green revision invalid");
for(const id of ["EXP1-S-10","EXP1-S-11"]){const x=approval.revisions.find(y=>y.candidate_id===id);if(x.options.length!==4||x.options.map(o=>o.color).join()!=="red,blue,yellow,green")fail(`${id} mapping invalid`)}
if(new Set(approval.backlog.map(x=>x.id)).size!==11)fail("backlog incomplete");
const app=fs.readFileSync(path.join(ROOT,"app/v2/page.tsx"),"utf8");if(app.includes("targeted-expansion-01-final-admission"))fail("runtime import detected");
console.log(JSON.stringify({status:"PASS",admitted:28,deferred:0,retired:0,bank:148,formats:approval.admission_summary.formats,preference_in_others:21,production_impact:"NONE"},null,2));
