begin;

-- Additive OWNER review metadata. Runtime questions/options are intentionally untouched.
alter table viago_quiz.assessment_question_revisions
  add column if not exists construct text null,
  add column if not exists context text null,
  add column if not exists content_kind text null,
  add column if not exists review_classification text null,
  add column if not exists review_reason text null,
  add column if not exists review_status text not null default 'NOT_REVIEWED';

alter table viago_quiz.assessment_question_revisions
  drop constraint if exists assessment_question_revisions_content_kind_check,
  add constraint assessment_question_revisions_content_kind_check
    check (content_kind is null or content_kind in ('SCENARIO','TRADEOFF','LIKERT')),
  drop constraint if exists assessment_question_revisions_review_classification_check,
  add constraint assessment_question_revisions_review_classification_check
    check (review_classification is null or review_classification in ('KEEP','LIGHT_REWRITE','FULL_REWRITE','RETIRE_CANDIDATE','DEFER')),
  drop constraint if exists assessment_question_revisions_review_status_check,
  add constraint assessment_question_revisions_review_status_check
    check (review_status in ('NOT_REVIEWED','IN_REVIEW','REVIEWED'));

create index if not exists assessment_question_revisions_canonical_idx
  on viago_quiz.assessment_question_revisions(canonical_question_id, created_at desc);

-- Authoring access stays server-side. Browser roles retain zero access.
revoke all on table viago_quiz.assessment_content_revisions from public, anon, authenticated;
revoke all on table viago_quiz.assessment_question_revisions from public, anon, authenticated;
revoke all on table viago_quiz.assessment_option_revisions from public, anon, authenticated;
revoke all on table viago_quiz.assessment_content_audit from public, anon, authenticated;
grant select, insert, update on table viago_quiz.assessment_content_revisions to service_role;
grant select, insert, update on table viago_quiz.assessment_question_revisions to service_role;
grant select, insert, update on table viago_quiz.assessment_option_revisions to service_role;
grant select, insert on table viago_quiz.assessment_content_audit to service_role;
grant usage, select on sequence viago_quiz.assessment_content_audit_id_seq to service_role;

create or replace function viago_quiz.v2_save_question_draft(
  p_question_id uuid, p_prompt_en text, p_prompt_es text, p_category text,
  p_construct text, p_dimension text, p_context text, p_content_kind text,
  p_review_classification text, p_review_reason text, p_review_status text,
  p_notes text, p_options jsonb
) returns jsonb
language plpgsql
set search_path=''
as $function$
declare
  v_revision_id uuid;
  v_question viago_quiz.questions%rowtype;
  v_expected_options int;
begin
  select * into v_question from viago_quiz.questions where id=p_question_id;
  if not found then raise exception 'Unknown canonical question'; end if;
  if nullif(btrim(p_prompt_en),'') is null then raise exception 'English wording is required'; end if;
  if p_review_classification is not null and nullif(btrim(p_review_reason),'') is null then raise exception 'A review reason is required'; end if;
  if p_content_kind not in ('SCENARIO','TRADEOFF','LIKERT') then raise exception 'Invalid content kind'; end if;
  if p_review_status not in ('NOT_REVIEWED','IN_REVIEW','REVIEWED') then raise exception 'Invalid review status'; end if;

  select r.id into v_revision_id
  from viago_quiz.assessment_content_revisions r
  join viago_quiz.assessment_question_revisions q on q.revision_id=r.id
  where q.canonical_question_id=p_question_id and r.status='DRAFT'
  order by r.updated_at desc limit 1;
  if v_revision_id is null then
    insert into viago_quiz.assessment_content_revisions(status,notes) values('DRAFT',p_notes) returning id into v_revision_id;
  else
    update viago_quiz.assessment_content_revisions set notes=p_notes,updated_at=now() where id=v_revision_id and status='DRAFT';
  end if;

  insert into viago_quiz.assessment_question_revisions(
    revision_id,canonical_question_id,qtype,category,construct,dimension,context,content_kind,
    prompt_en,prompt_es,active,difficulty,primary_color,color,likert_color,
    review_classification,review_reason,review_status
  ) values (
    v_revision_id,v_question.id,v_question.qtype,p_category,p_construct,p_dimension,p_context,p_content_kind,
    p_prompt_en,p_prompt_es,v_question.is_active,v_question.difficulty,v_question.primary_color,v_question.color,v_question.likert_color,
    p_review_classification,p_review_reason,p_review_status
  ) on conflict(revision_id,canonical_question_id) do update set
    category=excluded.category,construct=excluded.construct,dimension=excluded.dimension,context=excluded.context,
    content_kind=excluded.content_kind,prompt_en=excluded.prompt_en,prompt_es=excluded.prompt_es,
    review_classification=excluded.review_classification,review_reason=excluded.review_reason,review_status=excluded.review_status;

  select count(*) into v_expected_options from viago_quiz.question_options where question_id=p_question_id;
  if v_question.qtype='single' then
    if jsonb_typeof(p_options)<>'array' or jsonb_array_length(p_options)<>v_expected_options then raise exception 'Draft options do not match canonical membership'; end if;
    if exists (
      select 1 from jsonb_to_recordset(p_options) x(id uuid,label_en text,label_es text)
      left join viago_quiz.question_options o on o.id=x.id and o.question_id=p_question_id where o.id is null or nullif(btrim(x.label_en),'') is null
    ) then raise exception 'Draft option identity or English label is invalid'; end if;

    insert into viago_quiz.assessment_option_revisions(
      revision_id,canonical_option_id,canonical_question_id,label_en,label_es,sort_order,active,red,blue,yellow,green
    ) select v_revision_id,o.id,o.question_id,x.label_en,x.label_es,o.sort_order,o.is_active,o.red,o.blue,o.yellow,o.green
      from jsonb_to_recordset(p_options) x(id uuid,label_en text,label_es text)
      join viago_quiz.question_options o on o.id=x.id and o.question_id=p_question_id
    on conflict(revision_id,canonical_option_id) do update set label_en=excluded.label_en,label_es=excluded.label_es;
  elsif jsonb_array_length(coalesce(p_options,'[]'::jsonb))<>0 then
    raise exception 'Likert drafts cannot contain options';
  end if;

  insert into viago_quiz.assessment_content_audit(revision_id,action,metadata)
    values(v_revision_id,'DRAFT_SAVED',jsonb_build_object('canonical_question_id',p_question_id,'review_classification',p_review_classification));
  return jsonb_build_object('revision_id',v_revision_id,'status','DRAFT');
end $function$;

create or replace function viago_quiz.v2_discard_question_draft(p_question_id uuid)
returns jsonb language plpgsql set search_path='' as $function$
declare v_revision_id uuid;
begin
  select r.id into v_revision_id from viago_quiz.assessment_content_revisions r
  join viago_quiz.assessment_question_revisions q on q.revision_id=r.id
  where q.canonical_question_id=p_question_id and r.status='DRAFT'
  order by r.updated_at desc limit 1;
  if v_revision_id is null then return jsonb_build_object('discarded',false); end if;
  update viago_quiz.assessment_content_revisions set status='SUPERSEDED',updated_at=now() where id=v_revision_id and status='DRAFT';
  insert into viago_quiz.assessment_content_audit(revision_id,action,metadata)
    values(v_revision_id,'DRAFT_DISCARDED',jsonb_build_object('canonical_question_id',p_question_id));
  return jsonb_build_object('discarded',true,'revision_id',v_revision_id);
end $function$;

revoke all on function viago_quiz.v2_save_question_draft(uuid,text,text,text,text,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function viago_quiz.v2_discard_question_draft(uuid) from public,anon,authenticated;
grant execute on function viago_quiz.v2_save_question_draft(uuid,text,text,text,text,text,text,text,text,text,text,text,jsonb) to service_role;
grant execute on function viago_quiz.v2_discard_question_draft(uuid) to service_role;

-- Richer deterministic projection. Result/language analytics include only captured V2 metadata.
create or replace function viago_quiz.v2_admin_analytics()
returns jsonb
language sql
stable
set search_path = ''
as $function$
with answer_counts as (
  select a.id attempt_id, a.created_at, count(ans.question_id)::int answer_count
  from viago_quiz.quiz_attempts a
  left join viago_quiz.quiz_attempt_answers ans on ans.attempt_id=a.id
  group by a.id,a.created_at
), completed as (
  select ac.attempt_id,ac.created_at,m.language,m.winner_color,m.red_score,m.blue_score,m.yellow_score,m.green_score
  from answer_counts ac left join viago_quiz.assessment_attempt_metadata m on m.attempt_id=ac.attempt_id
  where ac.answer_count=50 or m.completed_at is not null
), question_counts as (
  select count(*) filter(where is_active)::int active_questions,
    count(*) filter(where is_active and qtype='likert')::int active_likert,
    count(*) filter(where is_active and qtype='single')::int active_single
  from viago_quiz.questions
), known_languages as (
  select count(*) filter(where language='en')::int en,count(*) filter(where language='es')::int es
  from viago_quiz.assessment_attempt_metadata where language is not null
), winners as (
  select winner_color,count(*)::int count from viago_quiz.assessment_attempt_metadata
  where winner_color is not null group by winner_color
), scored as (
  select m.*, s.secondary_color, p.primary_score, s.secondary_score,
    (p.primary_score-s.secondary_score)::int margin
  from viago_quiz.assessment_attempt_metadata m
  cross join lateral (select case m.winner_color when 'red' then m.red_score when 'blue' then m.blue_score when 'yellow' then m.yellow_score when 'green' then m.green_score end primary_score) p
  cross join lateral (
    select v.color secondary_color,v.score secondary_score
    from (values ('red',m.red_score,1),('blue',m.blue_score,2),('yellow',m.yellow_score,3),('green',m.green_score,4)) v(color,score,ord)
    where v.color<>m.winner_color order by v.score desc nulls last,v.ord limit 1
  ) s where m.winner_color is not null
), combinations as (
  select winner_color primary_color,secondary_color,count(*)::int count from scored group by winner_color,secondary_color
), activity as (
  select date(created_at at time zone 'UTC') as activity_day,count(*)::int starts,
    count(*) filter(where attempt_id in(select attempt_id from completed))::int completed
  from answer_counts where created_at>=now()-interval '30 days'
  group by date(created_at at time zone 'UTC') order by activity_day
)
select jsonb_build_object(
 'starts',(select count(*)::int from answer_counts),
 'completed',(select count(*)::int from completed),
 'completion_rate',case when (select count(*) from answer_counts)=0 then 0 else round((select count(*) from completed)::numeric/(select count(*) from answer_counts)*100,1) end,
 'known_languages',jsonb_build_object('en',(select en from known_languages),'es',(select es from known_languages)),
 'known_result_count',(select count(*)::int from scored),
 'winner_distribution',coalesce((select jsonb_object_agg(winner_color,count) from winners),'{}'::jsonb),
 'primary_secondary',coalesce((select jsonb_agg(jsonb_build_object('primary',primary_color,'secondary',secondary_color,'count',count) order by count desc,primary_color,secondary_color) from combinations),'[]'::jsonb),
 'score_margins',jsonb_build_object(
   'known',(select count(*)::int from scored),
   'ties',(select count(*) filter(where margin=0)::int from scored),
   'average',coalesce((select round(avg(margin),1) from scored),0),
   'minimum',coalesce((select min(margin) from scored),0),
   'maximum',coalesce((select max(margin) from scored),0)
 ),
 'corpus',(select jsonb_build_object('active_questions',active_questions,'active_likert',active_likert,'active_single',active_single) from question_counts),
 'activity_30d',coalesce((select jsonb_agg(jsonb_build_object('day',activity_day,'starts',starts,'completed',completed) order by activity_day) from activity),'[]'::jsonb)
);
$function$;

revoke all on function viago_quiz.v2_admin_analytics() from public, anon, authenticated;
grant execute on function viago_quiz.v2_admin_analytics() to service_role;

do $guard$
declare t regclass;
begin
  foreach t in array array[
    'viago_quiz.assessment_content_revisions'::regclass,
    'viago_quiz.assessment_question_revisions'::regclass,
    'viago_quiz.assessment_option_revisions'::regclass,
    'viago_quiz.assessment_content_audit'::regclass
  ] loop
    if has_table_privilege('anon',t,'SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated',t,'SELECT,INSERT,UPDATE,DELETE') then
      raise exception 'browser role has authoring access on %',t;
    end if;
  end loop;
  if not has_table_privilege('service_role','viago_quiz.assessment_question_revisions','SELECT,INSERT,UPDATE') then raise exception 'service role draft grants missing'; end if;
  if not has_function_privilege('service_role','viago_quiz.v2_admin_analytics()','EXECUTE') then raise exception 'service role analytics grant missing'; end if;
  if not has_function_privilege('service_role','viago_quiz.v2_save_question_draft(uuid,text,text,text,text,text,text,text,text,text,text,text,jsonb)','EXECUTE') then raise exception 'service role save-draft grant missing'; end if;
end $guard$;

notify pgrst, 'reload schema';
commit;
