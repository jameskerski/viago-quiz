import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PK, hashRows, requireEnv } from "./lib.mjs";
import { assertArchivedMigrationAuthorized } from "./retirement-guard.mjs";
assertArchivedMigrationAuthorized({ source: true });
requireEnv(["QUIZ_SOURCE_URL","QUIZ_SOURCE_SERVICE_ROLE_KEY"]);
const since=process.env.QUIZ_DELTA_SINCE;if(!since)throw new Error("Missing QUIZ_DELTA_SINCE (initial snapshot cutoff)");
const out=path.resolve(process.argv[2]||"artifacts/quiz-delta");await fs.mkdir(out,{recursive:true});
const source=createClient(process.env.QUIZ_SOURCE_URL,process.env.QUIZ_SOURCE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const {data:attempts,error}=await source.from("quiz_attempts").select("id,created_at").gt("created_at",since).order("created_at");if(error)throw error;
const ids=attempts.map(x=>x.id);const tables={quiz_attempts:attempts};
for(const table of ["quiz_attempt_questions","quiz_attempt_option_order","quiz_attempt_answers"]){let rows=[];for(let i=0;i<ids.length;i+=200){const {data,error:e}=await source.from(table).select("*").in("attempt_id",ids.slice(i,i+200));if(e)throw e;rows.push(...data);}tables[table]=rows;}
// Capture answers first submitted after T0 even when their attempt predates T0.
const {data:lateAnswers,error:lateError}=await source.from("quiz_attempt_answers").select("*").gt("created_at",since);if(lateError)throw lateError;
const answerKey=row=>`${row.attempt_id}:${row.question_id}`;const merged=new Map(tables.quiz_attempt_answers.map(row=>[answerKey(row),row]));for(const row of lateAnswers)merged.set(answerKey(row),row);tables.quiz_attempt_answers=[...merged.values()].sort((a,b)=>answerKey(a).localeCompare(answerKey(b)));
for(const [table,rows] of Object.entries(tables))await fs.writeFile(path.join(out,`${table}.ndjson`),rows.map(JSON.stringify).join("\n")+(rows.length?"\n":""));
const manifest={version:1,kind:"delta",since,captured_at:new Date().toISOString(),tables:{}};for(const [table,rows] of Object.entries(tables))manifest.tables[table]={rows:rows.length,sha256:hashRows(rows),pk:PK[table]};
await fs.writeFile(path.join(out,"manifest.json"),JSON.stringify(manifest,null,2)+"\n");
