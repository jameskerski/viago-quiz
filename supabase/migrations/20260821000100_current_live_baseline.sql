-- CURRENT-STATE BASELINE ONLY. Reconstructed read-only from
-- zkmkenhziznafbgmcayp on 2026-08-21. Do not apply to either hosted project.
-- Exact pg_get_functiondef reconstruction is in ../baseline/current_live_functions.sql.
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists pgcrypto with schema extensions;

create table public.questions (
  id uuid primary key default extensions.uuid_generate_v4(),
  is_active boolean not null default true,
  prompt text not null,
  category text,
  difficulty integer,
  created_at timestamptz not null default now(),
  qtype text not null default 'rank4' check (qtype in ('likert','single','tf','rank4')),
  primary_color text check (primary_color is null or primary_color in ('red','blue','yellow','green')),
  color text check (color is null or color in ('red','blue','yellow','green')),
  likert_color text check (likert_color is null or likert_color in ('red','blue','yellow','green')),
  prompt_es text
);
create table public.answers (
  id uuid primary key default extensions.uuid_generate_v4(), question_id uuid not null references public.questions on delete cascade,
  answer_text text not null, weight_red integer not null default 0, weight_blue integer not null default 0,
  weight_yellow integer not null default 0, weight_green integer not null default 0,
  sort_order integer not null default 1, created_at timestamptz not null default now()
);
create table public.question_options (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions on delete cascade,
  label text not null, sort_order integer not null default 0, is_active boolean not null default true,
  red integer not null default 0, blue integer not null default 0, yellow integer not null default 0, green integer not null default 0,
  created_at timestamptz not null default now(), label_es text,
  constraint question_options_weight_range check (red between 0 and 4 and blue between 0 and 4 and yellow between 0 and 4 and green between 0 and 4)
);
create table public.quiz_sessions (
  id uuid primary key default extensions.uuid_generate_v4(), started_at timestamptz not null default now(), completed_at timestamptz,
  question_ids jsonb not null default '[]', result_primary text,
  result_red integer not null default 0, result_blue integer not null default 0, result_yellow integer not null default 0, result_green integer not null default 0,
  result_red_pct numeric, result_blue_pct numeric, result_yellow_pct numeric, result_green_pct numeric
);
create table public.responses (
  id uuid primary key default extensions.uuid_generate_v4(), session_id uuid not null references public.quiz_sessions on delete cascade,
  question_id uuid not null references public.questions on delete cascade, answer_id uuid not null references public.answers on delete cascade,
  answered_at timestamptz not null default now()
);
create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.quiz_sessions on delete cascade,
  question_id uuid not null references public.questions on delete cascade, answer_id uuid not null references public.answers on delete cascade,
  red integer not null default 0, blue integer not null default 0, yellow integer not null default 0, green integer not null default 0,
  created_at timestamptz not null default now()
);
create table public.quiz_rankings (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.quiz_sessions on delete cascade,
  question_id uuid not null references public.questions on delete cascade, answer_id uuid not null references public.answers on delete cascade,
  rank integer not null check (rank between 1 and 4), created_at timestamptz not null default now(), unique(session_id,question_id,answer_id)
);
create table public.quiz_answer_orders (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.quiz_sessions on delete cascade,
  question_id uuid not null references public.questions on delete cascade, answer_ids uuid[] not null,
  created_at timestamptz not null default now(), unique(session_id,question_id)
);
create table public.quiz_responses (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.quiz_sessions on delete cascade,
  question_id uuid not null references public.questions on delete cascade,
  qtype text not null check (qtype in ('likert','single','tf','rank4')), value_int integer,
  option_id uuid references public.question_options on delete set null, created_at timestamptz not null default now(), unique(session_id,question_id)
);
create table public.quiz_attempts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());
create table public.quiz_attempt_questions (
  attempt_id uuid not null, -- live schema intentionally has no FK to quiz_attempts
  question_id uuid not null references public.questions on delete cascade, qtype text not null, position integer not null,
  created_at timestamptz default now(), primary key(attempt_id,question_id)
);
create table public.quiz_attempt_answers (
  attempt_id uuid not null references public.quiz_attempts on delete cascade,
  question_id uuid not null references public.questions on delete cascade, qtype text not null check(qtype in ('likert','single')),
  likert_value integer check(likert_value between 0 and 4), option_id uuid references public.question_options on delete restrict,
  created_at timestamptz not null default now(), primary key(attempt_id,question_id),
  check ((qtype='likert' and likert_value is not null and option_id is null) or (qtype='single' and option_id is not null and likert_value is null))
);
create table public.quiz_attempt_option_order (
  attempt_id uuid not null references public.quiz_attempts on delete cascade,
  question_id uuid not null references public.questions on delete cascade,
  option_id uuid not null references public.question_options on delete cascade,
  sort_order integer not null, position integer, primary key(attempt_id,option_id)
);

create index answers_question_id_idx on public.answers(question_id);
create index question_options_active_idx on public.question_options(is_active);
create index question_options_qid_idx on public.question_options(question_id);
create index question_options_question_id_idx on public.question_options(question_id);
create index questions_active_idx on public.questions(is_active);
create index questions_category_idx on public.questions(category);
create index questions_type_color_active_idx on public.questions(qtype,color,is_active);
create index quiz_attempt_answers_attempt_id_idx on public.quiz_attempt_answers(attempt_id);
create index quiz_attempt_option_order_attempt_q on public.quiz_attempt_option_order(attempt_id,question_id);
create index quiz_rankings_session_idx on public.quiz_rankings(session_id);
create index quiz_rankings_session_question_idx on public.quiz_rankings(session_id,question_id);
create index quiz_responses_question_idx on public.quiz_responses(question_id);
create index quiz_responses_session_idx on public.quiz_responses(session_id);

create view public.quiz_attempt_scores as
select aq.attempt_id, sum(coalesce(qa.red,0)) red, sum(coalesce(qa.blue,0)) blue,
       sum(coalesce(qa.green,0)) green, sum(coalesce(qa.yellow,0)) yellow
from public.quiz_attempt_questions aq join public.quiz_answers qa on qa.question_id=aq.question_id group by aq.attempt_id;

-- Faithful current security posture (unsafe; retained only for baseline fidelity).
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.answers enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.responses enable row level security;
create policy "Public read active questions" on public.questions for select to anon using (is_active=true);
create policy "read questions" on public.questions for select to public using (is_active=true);
create policy "read options" on public.question_options for select to public using (true);
create policy "Public read answers for active questions" on public.answers for select to anon
  using (exists(select 1 from public.questions q where q.id=question_id and q.is_active=true));
create policy "Public insert quiz sessions" on public.quiz_sessions for insert to anon with check(true);
create policy "Public select quiz sessions" on public.quiz_sessions for select to anon using(true);
create policy "Public update quiz sessions" on public.quiz_sessions for update to anon using(true) with check(true);
create policy "Public insert responses" on public.responses for insert to anon with check(true);
create policy "Public select responses" on public.responses for select to anon using(true);
grant all on all tables in schema public to anon, authenticated, service_role;
