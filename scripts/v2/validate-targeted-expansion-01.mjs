#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../..");
const file=path.join(ROOT,"data/v2-proposals/targeted-expansion-01.json");
const data=JSON.parse(fs.readFileSync(file,"utf8"));
const fail=(message)=>{throw new Error(message);};
if(data.status!=="PROPOSED_FOR_OWNER_REVIEW_NON_PRODUCTION")fail("Wrong status");
if(data.production_impact!=="NONE")fail("Production impact must be NONE");
if(data.canonical_starting_bank.question_count!==120)fail("Starting bank must be 120");
if(data.candidates.length!==28)fail("Expected 28 candidates");
if(new Set(data.candidates.map(x=>x.candidate_id)).size!==28)fail("Duplicate candidate id");
if(data.candidates.filter(x=>x.format==="SINGLE_SELECT").length!==20)fail("Expected 20 single-select");
if(data.candidates.filter(x=>x.format==="LIKERT").length!==8)fail("Expected 8 Likert");
const colors=["red","blue","yellow","green"];
for(const x of data.candidates){
 for(const key of ["candidate_id","wording","intended_mapping","measurement","orientation","context","tone","backlog_item_served","coverage_classification","closest_canonical_item","why_it_earns_a_place"])if(!x[key])fail(`${x.candidate_id} missing ${key}`);
 if(x.runtime_authority!==false)fail(`${x.candidate_id} has runtime authority`);
 if(!["NET_NEW_COVERAGE","DELIBERATE_PARALLEL_MEASUREMENT"].includes(x.coverage_classification))fail(`${x.candidate_id} invalid coverage class`);
 if(x.format==="SINGLE_SELECT"){
  if(x.options.length!==4)fail(`${x.candidate_id} must have four options`);
  if(JSON.stringify(x.options.map(o=>o.color))!==JSON.stringify(colors))fail(`${x.candidate_id} colors/order invalid`);
  if(x.pairwise_contribution.length!==6)fail(`${x.candidate_id} needs all six pairwise contributions`);
 }else{
  if(x.options.length!==0||!colors.includes(x.intended_mapping))fail(`${x.candidate_id} Likert mapping invalid`);
 }
 if(x.closest_canonical_item.similarity>=0.6)fail(`${x.candidate_id} is lexically too close to ${x.closest_canonical_item.id}`);
}
if((data.counts.orientations.PREFERENCE_IN_OTHERS||0)<14)fail("Preference-in-others did not materially increase");
if(data.counts.non_work_share<0.7)fail("Non-work share below 70%");
for(const id of ["EXP-004","EXP-009","EXP-010","EXP-011"])if(!data.counts.backlog_coverage[id])fail(`Missing ${id}`);
if(data.semantic_screen_rejects.length<5)fail("Semantic reject evidence too thin");
if(data.counts.projected_unique_bank_if_all_admitted!==148)fail("Projected bank arithmetic invalid");
const runtime=fs.readFileSync(path.join(ROOT,"app/v2/page.tsx"),"utf8");
if(runtime.includes("targeted-expansion-01"))fail("Runtime imports research tranche");
console.log(JSON.stringify({status:"PASS",candidates:28,formats:{single_select:20,likert:8},preference_in_others:data.counts.orientations.PREFERENCE_IN_OTHERS,non_work_share:data.counts.non_work_share,projected_bank:148,production_impact:"NONE"},null,2));
