import { createClient } from "@supabase/supabase-js";
import { canonical, requireEnv } from "./lib.mjs";
import { assertArchivedMigrationAuthorized } from "./retirement-guard.mjs";
assertArchivedMigrationAuthorized({ source: true, target: true });
requireEnv(["QUIZ_SOURCE_URL","QUIZ_SOURCE_SERVICE_ROLE_KEY","QUIZ_TARGET_URL","QUIZ_TARGET_SERVICE_ROLE_KEY"]);
const limit=Number(process.env.QUIZ_PARITY_SAMPLE||100);
const source=createClient(process.env.QUIZ_SOURCE_URL,process.env.QUIZ_SOURCE_SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const target=createClient(process.env.QUIZ_TARGET_URL,process.env.QUIZ_TARGET_SERVICE_ROLE_KEY,{auth:{persistSession:false},db:{schema:"viago_quiz"}});
const {data:attempts,error}=await source.from("quiz_attempts").select("id,created_at").order("created_at",{ascending:false}).limit(limit);if(error)throw error;
let failures=0;
for(const attempt of attempts){const [a,b]=await Promise.all([source.rpc("results_for_attempt",{p_attempt_id:attempt.id}),target.rpc("results_for_attempt",{p_attempt_id:attempt.id})]);if(a.error)throw a.error;if(b.error)throw b.error;const equal=canonical(a.data)===canonical(b.data);if(!equal){failures++;console.error(JSON.stringify({attempt_id:attempt.id,source:a.data,target:b.data}));}}
console.log(JSON.stringify({sampled:attempts.length,failures}));if(failures)process.exitCode=1;
