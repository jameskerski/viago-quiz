begin;

-- VIAGO Personality Quiz V2 additive foundation.
-- This migration does not alter V1 questions, options, scoring, attempts, answers,
-- selection behavior, historical result links, or existing runtime functions.

create table if not exists viago_quiz.assessment_attempt_metadata (
  attempt_id uuid primary key references viago_quiz.quiz_attempts(id) on delete cascade,
  language text null check (language in ('en', 'es')),
  completed_at timestamptz null,
  winner_color text null check (winner_color in ('red', 'blue', 'yellow', 'green')),
  red_score integer null check (red_score >= 0),
  blue_score integer null check (blue_score >= 0),
  yellow_score integer null check (yellow_score >= 0),
  green_score integer null check (green_score >= 0),
  content_revision_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assessment_attempt_metadata_scores_complete check (
    (winner_color is null and red_score is null and blue_score is null and yellow_score is null and green_score is null)
    or
    (winner_color is not null and red_score is not null and blue_score is not null and yellow_score is not null and green_score is not null)
  )
);

create table if not exists viago_quiz.assessment_content_revisions (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'DRAFT' check (status in ('DRAFT', 'READY_TO_PUBLISH', 'PUBLISHED', 'SUPERSEDED')),
  source_revision_id uuid null references viago_quiz.assessment_content_revisions(id) on delete restrict,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  constraint assessment_content_revision_publish_state check (
    (status = 'PUBLISHED' and published_at is not null)
    or (status <> 'PUBLISHED')
  )
);

create table if not exists viago_quiz.assessment_question_revisions (
  revision_id uuid not null references viago_quiz.assessment_content_revisions(id) on delete cascade,
  canonical_question_id uuid not null,
  qtype text not null,
  category text null,
  dimension text null,
  prompt_en text not null,
  prompt_es text null,
  active boolean not null,
  difficulty integer null,
  primary_color text null,
  color text null,
  likert_color text null,
  created_at timestamptz not null default now(),
  primary key (revision_id, canonical_question_id)
);

create table if not exists viago_quiz.assessment_option_revisions (
  revision_id uuid not null references viago_quiz.assessment_content_revisions(id) on delete cascade,
  canonical_option_id uuid not null,
  canonical_question_id uuid not null,
  label_en text not null,
  label_es text null,
  sort_order integer not null,
  active boolean not null,
  red integer not null default 0,
  blue integer not null default 0,
  yellow integer not null default 0,
  green integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (revision_id, canonical_option_id),
  foreign key (revision_id, canonical_question_id)
    references viago_quiz.assessment_question_revisions(revision_id, canonical_question_id)
    on delete cascade
);

create table if not exists viago_quiz.assessment_content_audit (
  id bigint generated always as identity primary key,
  revision_id uuid null references viago_quiz.assessment_content_revisions(id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

alter table viago_quiz.assessment_attempt_metadata
  add constraint assessment_attempt_metadata_content_revision_fk
  foreign key (content_revision_id)
  references viago_quiz.assessment_content_revisions(id)
  on delete set null;

create index if not exists assessment_attempt_metadata_completed_idx
  on viago_quiz.assessment_attempt_metadata(completed_at)
  where completed_at is not null;

create index if not exists assessment_attempt_metadata_winner_idx
  on viago_quiz.assessment_attempt_metadata(winner_color)
  where winner_color is not null;

create index if not exists assessment_attempt_metadata_language_idx
  on viago_quiz.assessment_attempt_metadata(language)
  where language is not null;

create index if not exists assessment_content_revisions_status_idx
  on viago_quiz.assessment_content_revisions(status, created_at desc);

create index if not exists assessment_content_audit_revision_idx
  on viago_quiz.assessment_content_audit(revision_id, occurred_at desc);

alter table viago_quiz.assessment_attempt_metadata enable row level security;
alter table viago_quiz.assessment_content_revisions enable row level security;
alter table viago_quiz.assessment_question_revisions enable row level security;
alter table viago_quiz.assessment_option_revisions enable row level security;
alter table viago_quiz.assessment_content_audit enable row level security;

revoke all on table viago_quiz.assessment_attempt_metadata from anon, authenticated;
revoke all on table viago_quiz.assessment_content_revisions from anon, authenticated;
revoke all on table viago_quiz.assessment_question_revisions from anon, authenticated;
revoke all on table viago_quiz.assessment_option_revisions from anon, authenticated;
revoke all on table viago_quiz.assessment_content_audit from anon, authenticated;

-- Deterministic read projection for admin analytics. Historical completion is derived
-- from persisted answer counts; V2 metadata is preferred when present.
create or replace function viago_quiz.v2_admin_analytics()
returns jsonb
language sql
stable
set search_path = ''
as $function$
with answer_counts as (
  select a.id as attempt_id,
         a.created_at,
         count(ans.question_id)::int as answer_count
  from viago_quiz.quiz_attempts a
  left join viago_quiz.quiz_attempt_answers ans on ans.attempt_id = a.id
  group by a.id, a.created_at
),
completed as (
  select ac.attempt_id,
         ac.created_at,
         m.language,
         m.completed_at,
         m.winner_color,
         m.red_score,
         m.blue_score,
         m.yellow_score,
         m.green_score
  from answer_counts ac
  left join viago_quiz.assessment_attempt_metadata m on m.attempt_id = ac.attempt_id
  where ac.answer_count = 50 or m.completed_at is not null
),
question_counts as (
  select
    count(*) filter (where is_active)::int as active_questions,
    count(*) filter (where is_active and qtype = 'likert')::int as active_likert,
    count(*) filter (where is_active and qtype = 'single')::int as active_single
  from viago_quiz.questions
),
known_languages as (
  select
    count(*) filter (where language = 'en')::int as en,
    count(*) filter (where language = 'es')::int as es
  from viago_quiz.assessment_attempt_metadata
  where language is not null
),
winners as (
  select winner_color, count(*)::int as count
  from viago_quiz.assessment_attempt_metadata
  where winner_color is not null
  group by winner_color
),
activity as (
  select date(created_at at time zone 'UTC') as day,
         count(*)::int as starts,
         count(*) filter (where attempt_id in (select attempt_id from completed))::int as completed
  from answer_counts
  where created_at >= now() - interval '30 days'
  group by date(created_at at time zone 'UTC')
  order by day
)
select jsonb_build_object(
  'starts', (select count(*)::int from answer_counts),
  'completed', (select count(*)::int from completed),
  'completion_rate', case when (select count(*) from answer_counts) = 0 then 0
    else round(((select count(*) from completed)::numeric / (select count(*) from answer_counts)::numeric) * 100, 1) end,
  'known_languages', jsonb_build_object(
    'en', (select en from known_languages),
    'es', (select es from known_languages)
  ),
  'winner_distribution', coalesce((select jsonb_object_agg(winner_color, count) from winners), '{}'::jsonb),
  'corpus', (select jsonb_build_object(
    'active_questions', active_questions,
    'active_likert', active_likert,
    'active_single', active_single
  ) from question_counts),
  'activity_30d', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'starts', starts, 'completed', completed) order by day) from activity), '[]'::jsonb)
);
$function$;

revoke all on function viago_quiz.v2_admin_analytics() from public, anon, authenticated;

-- Public counter function is still server-side only. The web app exposes only the numeric
-- completed count through its own endpoint/page rendering.
create or replace function viago_quiz.v2_completed_assessment_count()
returns bigint
language sql
stable
set search_path = ''
as $function$
  select count(*)
  from viago_quiz.quiz_attempts a
  left join viago_quiz.assessment_attempt_metadata m on m.attempt_id = a.id
  where m.completed_at is not null
     or (select count(*) from viago_quiz.quiz_attempt_answers ans where ans.attempt_id = a.id) = 50;
$function$;

revoke all on function viago_quiz.v2_completed_assessment_count() from public, anon, authenticated;

commit;
