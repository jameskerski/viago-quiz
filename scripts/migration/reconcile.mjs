import { createClient } from "@supabase/supabase-js";
import { TABLES, PK, hashRows, requireEnv } from "./lib.mjs";
import { assertArchivedMigrationAuthorized } from "./retirement-guard.mjs";
assertArchivedMigrationAuthorized({ source: true, target: true });
requireEnv(["QUIZ_SOURCE_URL","QUIZ_SOURCE_SERVICE_ROLE_KEY","QUIZ_TARGET_URL","QUIZ_TARGET_SERVICE_ROLE_KEY"]);
const source=createClient(process.env.QUIZ_SOURCE_URL,process.env.QUIZ_SOURCE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const target=createClient(process.env.QUIZ_TARGET_URL,process.env.QUIZ_TARGET_SERVICE_ROLE_KEY,{auth:{persistSession:false},db:{schema:"viago_quiz"}});
async function rows(client,table){let all=[],from=0;while(true){let q=client.from(table).select("*").range(from,from+999);for(const k of PK[table])q=q.order(k);const {data,error}=await q;if(error)throw error;all.push(...data);if(data.length<1000)return all;from+=1000;}}
let ok=true;
for(const table of TABLES){const [a,b]=await Promise.all([rows(source,table),rows(target,table)]);const result={table,source:a.length,target:b.length,source_sha256:hashRows(a),target_sha256:hashRows(b)};result.equal=result.source===result.target&&result.source_sha256===result.target_sha256;ok&&=result.equal;console.log(JSON.stringify(result));}
if(!ok)process.exitCode=1;
