import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/v2/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { configuredValidationEnvironment } from '@/lib/v2/validationEnvironmentAuthority';
import bank from '@/data/v2-research/viago-validation-bank-human-recognition-purge-v1.0.0.json';

const EXPECTED_BANK='viago-validation-bank-240-human-recognition-purge-v1.0.0';
const EXPECTED_HASH='24564443527bfa818c27659519ee5d32b1a6257433e2ccce0552a26d33988b73';
const EXPECTED_ASSEMBLER='VIAGO_RETEST_NOVELTY_ASSEMBLER_V1';
const respond=(error:string,status=400)=>NextResponse.json({error},{status});

export async function POST(request:Request){
 if(!(await hasAdminSession()))return respond('Unauthorized',401);
 let environment:string;try{environment=configuredValidationEnvironment()}catch(error){return respond(error instanceof Error?error.message:'Environment authority failed',403)}
 if(bank.bank_version!==EXPECTED_BANK||bank.bank_hash!==EXPECTED_HASH||bank.assembler_version!==EXPECTED_ASSEMBLER)return respond('Frozen bank identity mismatch',409);
 const body=await request.json().catch(()=>null) as {deployment_id?:string}|null;
 const deploymentId=body?.deployment_id?.trim();
 if(!deploymentId||!/^dpl_[A-Za-z0-9]+$/.test(deploymentId))return respond('Valid deployment identity required');
 const sourceCommit=process.env.VERCEL_GIT_COMMIT_SHA;
 if(!sourceCommit||!/^[a-f0-9]{40}$/.test(sourceCommit))return respond('Source commit provenance unavailable',409);
 const activatedAt=new Date().toISOString();
 const revisions=bank.questions.map(q=>({question_revision_id:q.question_revision_id,question_id:q.id,prompt:q.prompt,format:q.format,likert_target:q.color||null,semantic_metadata:{domain:q.domain,context:q.context,tones:q.tones,orientation:q.orientation,semantic_family:q.family,construct:q.construct,pairs:q.pairs,dimensions:q.dimensions,source:q.source,human_recognition_revision:q.human_recognition_revision||null,purge_quality_classification:q.format==='SINGLE_SELECT'?'OWNER_APPROVED_EMPIRICAL_REVIEW_SET':null},created_at:activatedAt,created_by_source:sourceCommit,supersedes_revision_id:null,change_reason:'OWNER-approved complete Human Recognition purge',status:'ACTIVE'}));
 for(let i=0;i<revisions.length;i+=100){const {error}=await supabaseAdmin.from('validation_question_revisions').upsert(revisions.slice(i,i+100),{onConflict:'question_revision_id',ignoreDuplicates:true});if(error)return respond(`Question registration failed: ${error.message}`,500)}
 const options=bank.questions.flatMap(q=>(q.options||[]).map((o,index)=>({option_revision_id:`${q.question_revision_id}:${o.id}`,question_revision_id:q.question_revision_id,option_id:o.id,wording:o.label,mapped_color:o.color,display_identity:String(index+1),created_at:activatedAt})));
 for(let i=0;i<options.length;i+=100){const {error}=await supabaseAdmin.from('validation_option_revisions').upsert(options.slice(i,i+100),{onConflict:'option_revision_id',ignoreDuplicates:true});if(error)return respond(`Option registration failed: ${error.message}`,500)}
 const existing=await supabaseAdmin.from('validation_bank_versions').select('*').eq('bank_id',bank.bank_version).maybeSingle();if(existing.error)return respond(`Bank read failed: ${existing.error.message}`,500);
 if(existing.data){if(existing.data.bank_hash!==bank.bank_hash||existing.data.question_count!==bank.question_count||existing.data.source_commit!==sourceCommit||existing.data.deployment_id!==deploymentId)return respond('Existing bank provenance mismatch',409)}else{
  const {error}=await supabaseAdmin.from('validation_bank_versions').insert({bank_id:bank.bank_version,semantic_version:'1.0.0',bank_hash:bank.bank_hash,created_at:bank.created_at,activated_at:activatedAt,retired_at:null,source_commit:sourceCommit,deployment_id:deploymentId,assembler_version:bank.assembler_version,scoring_version:bank.scoring_version,status:'ACTIVE_VALIDATION',question_count:bank.question_count});if(error)return respond(`Bank registration failed: ${error.message}`,500)
 }
 const members=bank.questions.map((q,index)=>({bank_id:bank.bank_version,question_revision_id:q.question_revision_id,bank_position:index+1}));for(let i=0;i<members.length;i+=100){const {error}=await supabaseAdmin.from('validation_bank_questions').upsert(members.slice(i,i+100),{onConflict:'bank_id,question_revision_id',ignoreDuplicates:true});if(error)return respond(`Membership registration failed: ${error.message}`,500)}
 const {error:authorityError}=await supabaseAdmin.from('validation_runtime_environments').upsert({environment_key:environment,active_validation_bank_id:bank.bank_version,assembler_version:bank.assembler_version,changed_at:activatedAt,changed_by:'OWNER_APPROVED_PURGED_BANK_ACTIVATION',change_reason:'Live OWNER test of Human Recognition purged bank'},{onConflict:'environment_key'});if(authorityError)return respond(`Environment activation failed: ${authorityError.message}`,500);
 const [memberReadback,authorityReadback,attempts]=await Promise.all([supabaseAdmin.from('validation_bank_questions').select('*',{count:'exact',head:true}).eq('bank_id',bank.bank_version),supabaseAdmin.from('validation_runtime_environments').select('*').eq('environment_key',environment).single(),supabaseAdmin.from('validation_attempts').select('*',{count:'exact',head:true}).neq('bank_version',bank.bank_version)]);
 if(memberReadback.error||authorityReadback.error||attempts.error||memberReadback.count!==bank.question_count||authorityReadback.data.active_validation_bank_id!==bank.bank_version)return respond('Activation readback failed',500);
 return NextResponse.json({ok:true,environment_key:environment,bank_id:bank.bank_version,bank_hash:bank.bank_hash,question_count:memberReadback.count,assembler_version:bank.assembler_version,source_commit:sourceCommit,deployment_id:deploymentId,activated_at:authorityReadback.data.changed_at,historical_attempts_preserved:attempts.count});
}
