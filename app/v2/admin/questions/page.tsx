import { requireAdminSession } from '@/lib/v2/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import { V2AdminShell } from '@/components/v2/V2AdminShell';
import V2QuestionEditor, { type CanonicalOption, type CanonicalQuestion, type DraftRow } from '@/components/v2/V2QuestionEditor';

export const dynamic = 'force-dynamic';

export default async function V2QuestionEditorPage(){
 await requireAdminSession();
 const [qRes,oRes,qrRes,orRes,rRes]=await Promise.all([
  supabaseAdmin.from('questions').select('id,is_active,prompt,prompt_es,category,difficulty,qtype,primary_color,color,likert_color').order('created_at'),
  supabaseAdmin.from('question_options').select('id,question_id,label,label_es,sort_order,is_active,red,blue,yellow,green').order('sort_order'),
  supabaseAdmin.from('assessment_question_revisions').select('revision_id,canonical_question_id,prompt_en,prompt_es,category,construct,dimension,context,content_kind,review_classification,review_reason,review_status,created_at'),
  supabaseAdmin.from('assessment_option_revisions').select('revision_id,canonical_option_id,label_en,label_es'),
  supabaseAdmin.from('assessment_content_revisions').select('id,status,notes,updated_at').order('updated_at',{ascending:false}),
 ]);
 for(const result of [qRes,oRes,qrRes,orRes,rRes]) if(result.error) throw new Error(`Unable to load question management data: ${result.error.message}`);
 const revisionMap=new Map((rRes.data??[]).map(r=>[r.id,r]));
 const revisions=(qrRes.data??[]).map(q=>{const root=revisionMap.get(q.revision_id);return {...q,status:root?.status??'UNKNOWN',notes:root?.notes??null,updated_at:root?.updated_at??q.created_at,options:(orRes.data??[]).filter(o=>o.revision_id===q.revision_id).map(o=>({id:o.canonical_option_id,label_en:o.label_en,label_es:o.label_es}))}}) as DraftRow[];
 const questions=(qRes.data??[]) as CanonicalQuestion[]; const options=(oRes.data??[]) as CanonicalOption[];
 return <V2AdminShell active="questions"><div className="mt-8"><p className="v2-eyebrow">Screen 5</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Questions & Content</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/45">Search the real canonical corpus, prepare governed revisions, and compare every draft without changing the published quiz.</p><div className="mt-5 flex flex-wrap gap-2 text-xs text-white/45"><span className="rounded-full border border-white/10 px-3 py-1.5">{questions.length} canonical</span><span className="rounded-full border border-white/10 px-3 py-1.5">{questions.filter(q=>q.qtype==='likert'&&q.is_active).length} Likert</span><span className="rounded-full border border-white/10 px-3 py-1.5">{questions.filter(q=>q.qtype==='single'&&q.is_active).length} single-select</span><span className="rounded-full border border-amber-300/20 px-3 py-1.5 text-amber-200/60">Publishing disabled</span></div></div><V2QuestionEditor questions={questions} options={options} revisions={revisions}/></V2AdminShell>;
}
