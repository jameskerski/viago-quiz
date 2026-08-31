import { NextResponse } from 'next/server';
import { hasAdminSession } from '@/lib/v2/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { assembleValidationAttempt, createSeed, publicManifest, scoreValidationAttempt } from '@/lib/v2/validation';
import { bindValidationAttempt, canAccessValidationAttempt } from '@/lib/v2/validationAccess';

const FLAGS=new Set(['confusing','two_answers_true','no_answer_true','obvious_best_answer','context_dependent','repetitive','other']);
export async function GET(request:Request){
 const id=new URL(request.url).searchParams.get('attempt_id'); if(!id)return NextResponse.json({error:'attempt_id required'},{status:400});
 if(!(await hasAdminSession())&&!(await canAccessValidationAttempt(id)))return NextResponse.json({error:'Validation attempt access required'},{status:401});
 const {data,error}=await supabaseAdmin.from('validation_attempts').select('id,participant_id,attempt_number,manifest,answers,item_flags,score_vector,primary_color,secondary_color,ranking,score_margin,started_at,completed_at,elapsed_seconds').eq('id',id).single();
 if(error)return NextResponse.json({error:error.message},{status:404});
 return NextResponse.json({...data,manifest:publicManifest(data.manifest)});
}

export async function POST(request:Request){
 const body=(await request.json().catch(()=>({}))) as Record<string,unknown>; const action=body.action;
 try{
  if(action==='start'){
   const participantCode=String(body?.participant_code||'').trim().slice(0,80); const population=body?.population==='EXPERIENCED'?'EXPERIENCED':'NEW';
   if(!participantCode)return NextResponse.json({error:'Participant code is required'},{status:400});
   const known=(value:unknown)=>['red','blue','yellow','green'].includes(String(value))?String(value):null;
   let {data:participant}=await supabaseAdmin.from('validation_participants').select('*').eq('participant_code',participantCode).maybeSingle();
   if(!participant){const created=await supabaseAdmin.from('validation_participants').insert({participant_code:participantCode,population,known_primary:known(body.known_primary),known_secondary:known(body.known_secondary)}).select().single();if(created.error)throw created.error;participant=created.data;}
   const previous=await supabaseAdmin.from('validation_attempts').select('attempt_number').eq('participant_id',participant.id).order('attempt_number',{ascending:false}).limit(1);
   if(previous.error)throw previous.error;const attemptNumber=(previous.data?.[0]?.attempt_number||0)+1;const manifest=assembleValidationAttempt(createSeed());
   const inserted=await supabaseAdmin.from('validation_attempts').insert({participant_id:participant.id,attempt_number:attemptNumber,mode:manifest.mode,bank_version:manifest.bank_version,bank_hash:manifest.bank_hash,assembler_version:manifest.assembler_version,scoring_version:manifest.scoring_version,seed:manifest.seed,manifest_hash:manifest.manifest_hash,manifest}).select('id,attempt_number').single();
   if(inserted.error)throw inserted.error;await bindValidationAttempt(inserted.data.id);return NextResponse.json(inserted.data);
  }
  const attemptId=String(body?.attempt_id||'');if(!attemptId)return NextResponse.json({error:'attempt_id required'},{status:400});
  if(!(await hasAdminSession())&&!(await canAccessValidationAttempt(attemptId)))return NextResponse.json({error:'Validation attempt access required'},{status:401});
  const current=await supabaseAdmin.from('validation_attempts').select('*').eq('id',attemptId).single();if(current.error)throw current.error;if(current.data.completed_at&&action!=='feedback')return NextResponse.json({error:'Completed attempts are immutable'},{status:409});
  if(action==='answer'){
   const revision=String(body.question_revision_id||'');const question=current.data.manifest.questions.find((q:{question_revision_id:string})=>q.question_revision_id===revision);if(!question)return NextResponse.json({error:'Question is not in this manifest'},{status:400});
   const answer=body.answer;if(question.format==='LIKERT'&&(!Number.isInteger(answer)||Number(answer)<0||Number(answer)>4))return NextResponse.json({error:'Invalid Likert answer'},{status:400});
   if(question.format==='SINGLE_SELECT'&&!question.options.some((o:{id:string})=>o.id===answer))return NextResponse.json({error:'Invalid option'},{status:400});
   const answers={...current.data.answers,[revision]:answer};const update=await supabaseAdmin.from('validation_attempts').update({answers}).eq('id',attemptId);if(update.error)throw update.error;return NextResponse.json({ok:true});
  }
  if(action==='flag'){
   const revision=String(body.question_revision_id||'');const flag=String(body.flag||'');if(!FLAGS.has(flag))return NextResponse.json({error:'Invalid flag'},{status:400});
   const list=new Set<string>(current.data.item_flags?.[revision]||[]);body.enabled===false?list.delete(flag):list.add(flag);const item_flags={...current.data.item_flags,[revision]:[...list]};const update=await supabaseAdmin.from('validation_attempts').update({item_flags}).eq('id',attemptId);if(update.error)throw update.error;return NextResponse.json({ok:true});
  }
  if(action==='complete'){
   if(Object.keys(current.data.answers||{}).length!==50)return NextResponse.json({error:'All 50 answers are required'},{status:400});const result=scoreValidationAttempt(current.data.manifest,current.data.answers);const completedAt=new Date();const elapsed=Math.max(0,Math.round((completedAt.getTime()-new Date(current.data.started_at).getTime())/1000));
   const update=await supabaseAdmin.from('validation_attempts').update({score_vector:result.scores,primary_color:result.primary,secondary_color:result.secondary,ranking:result.ranking,score_margin:result.margin,completed_at:completedAt.toISOString(),elapsed_seconds:elapsed}).eq('id',attemptId);if(update.error)throw update.error;return NextResponse.json(result);
  }
  if(action==='feedback'){
   if(!current.data.completed_at)return NextResponse.json({error:'Complete the assessment first'},{status:409});const row={attempt_id:attemptId,result_feels_like_me:Number(body.result_feels_like_me),primary_correct:body.primary_correct??null,secondary_correct:body.secondary_correct??null,repetitive:Number(body.repetitive),natural_score:Number(body.natural),notes:String(body.notes||'').slice(0,2000)||null};
   const insert=await supabaseAdmin.from('validation_feedback').insert(row);if(insert.error)throw insert.error;return NextResponse.json({ok:true});
  }
  return NextResponse.json({error:'Unknown action'},{status:400});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Validation request failed'},{status:500});}
}
