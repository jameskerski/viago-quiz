import fs from 'node:fs';
import {createClient} from '@supabase/supabase-js';

const bank=JSON.parse(fs.readFileSync('data/v2-research/validation-bank-292-expression-v5.0.0.json','utf8'));
const pointer=JSON.parse(fs.readFileSync('data/v2-governance/active-validation-bank.json','utf8'));
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Target Supabase server credentials are required');
if(pointer.active_validation_bank_id!==bank.bank_version||pointer.bank_hash!==bank.bank_hash)throw new Error('Active pointer does not match bank');
const db=createClient(url,key,{auth:{persistSession:false},db:{schema:'viago_quiz'}});
const fail=(label,error)=>{if(error)throw new Error(`${label}: ${error.message}`)};

const revisions=bank.questions.map(q=>({question_revision_id:q.question_revision_id,question_id:q.id,prompt:q.prompt,format:q.format,likert_target:q.color||null,semantic_metadata:{domain:q.domain,context:q.context,tones:q.tones,orientation:q.orientation,semantic_family:q.family,construct:q.construct,pairs:q.pairs,dimensions:q.dimensions,source:q.source,active_legacy_id:q.active_legacy_id||null},created_at:pointer.created_at,created_by_source:pointer.source_commit,supersedes_revision_id:q.expression_revision?.source_question_revision_id||q.engagement_revision?.source_question_revision_id||q.revision?.source_question_revision_id||null,change_reason:q.expression_revision?.decision||q.engagement_revision?.decision||'Frozen bank registration',status:'ACTIVE'}));
// A predecessor may not be registered in this tranche, so preserve it in metadata rather than violating the FK.
for(const row of revisions){row.semantic_metadata.supersedes_revision_id=row.supersedes_revision_id;row.supersedes_revision_id=null;}
for(let i=0;i<revisions.length;i+=100)fail('question revisions',(await db.from('validation_question_revisions').upsert(revisions.slice(i,i+100),{onConflict:'question_revision_id',ignoreDuplicates:true})).error);
const options=bank.questions.flatMap(q=>(q.options||[]).map((o,index)=>({option_revision_id:`${q.question_revision_id}:${o.id}`,question_revision_id:q.question_revision_id,option_id:o.id,wording:o.label,mapped_color:o.color,display_identity:String(index+1),created_at:pointer.created_at})));
for(let i=0;i<options.length;i+=100)fail('option revisions',(await db.from('validation_option_revisions').upsert(options.slice(i,i+100),{onConflict:'option_revision_id',ignoreDuplicates:true})).error);
fail('bank version',(await db.from('validation_bank_versions').upsert({bank_id:bank.bank_version,semantic_version:'5.0.0',bank_hash:bank.bank_hash,created_at:pointer.created_at,activated_at:pointer.activated_at,retired_at:null,source_commit:pointer.source_commit,deployment_id:pointer.deployment_id,assembler_version:pointer.assembler_version,scoring_version:pointer.scoring_version,status:'ACTIVE_VALIDATION',question_count:bank.question_count},{onConflict:'bank_id',ignoreDuplicates:true})).error);
const members=bank.questions.map((q,index)=>({bank_id:bank.bank_version,question_revision_id:q.question_revision_id,bank_position:index+1}));
for(let i=0;i<members.length;i+=100)fail('bank membership',(await db.from('validation_bank_questions').upsert(members.slice(i,i+100),{onConflict:'bank_id,question_revision_id',ignoreDuplicates:true})).error);
fail('active pointer',(await db.from('validation_runtime_config').upsert({singleton:true,active_validation_bank_id:bank.bank_version,changed_at:pointer.activated_at,changed_by:'OWNER_AUTHORIZED_DEPLOYMENT',change_reason:'Expression V5 OWNER experience test activation'},{onConflict:'singleton'})).error);
const [q,o,b,m,c]=await Promise.all([db.from('validation_question_revisions').select('*',{count:'exact',head:true}).eq('status','ACTIVE'),db.from('validation_option_revisions').select('*',{count:'exact',head:true}),db.from('validation_bank_versions').select('bank_id,bank_hash,status,activated_at,source_commit,deployment_id').eq('bank_id',bank.bank_version).single(),db.from('validation_bank_questions').select('*',{count:'exact',head:true}).eq('bank_id',bank.bank_version),db.from('validation_runtime_config').select('*').single()]);
for(const [label,result] of [['question count',q],['option count',o],['bank',b],['membership',m],['pointer',c]])fail(label,result.error);
if(q.count!==292||m.count!==292||c.data.active_validation_bank_id!==bank.bank_version)throw new Error('Registry reconciliation failed');
console.log(JSON.stringify({bank_id:b.data.bank_id,bank_hash:b.data.bank_hash,status:b.data.status,question_revisions:q.count,option_revisions:o.count,bank_members:m.count,active_pointer:c.data.active_validation_bank_id,activated_at:b.data.activated_at,source_commit:b.data.source_commit,deployment_id:b.data.deployment_id},null,2));
