-- TARGET-STATE migration. Future application requires separate authorization.
-- Owns only viago_quiz; does not reference or alter Traveler / Big Chill objects.
create schema if not exists viago_quiz authorization postgres;
revoke all on schema viago_quiz from public, anon, authenticated;
grant usage on schema viago_quiz to service_role;

create table viago_quiz.questions (
  id uuid primary key default gen_random_uuid(), is_active boolean not null default true, prompt text not null, prompt_es text,
  category text, difficulty integer, created_at timestamptz not null default now(),
  qtype text not null check(qtype in ('likert','single','tf','rank4')),
  primary_color text check(primary_color is null or primary_color in ('red','blue','yellow','green')),
  color text check(color is null or color in ('red','blue','yellow','green')),
  likert_color text check(likert_color is null or likert_color in ('red','blue','yellow','green'))
);
create table viago_quiz.question_options (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references viago_quiz.questions on delete restrict,
  label text not null, label_es text, sort_order integer not null default 0, is_active boolean not null default true,
  red integer not null default 0, blue integer not null default 0, yellow integer not null default 0, green integer not null default 0,
  created_at timestamptz not null default now(),
  unique(question_id,id),
  check(red between 0 and 4 and blue between 0 and 4 and yellow between 0 and 4 and green between 0 and 4)
);
create table viago_quiz.quiz_attempts (id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now());
create table viago_quiz.quiz_attempt_questions (
  attempt_id uuid not null references viago_quiz.quiz_attempts on delete cascade,
  question_id uuid not null references viago_quiz.questions on delete restrict, qtype text not null check(qtype in ('likert','single')),
  -- No 1..50 check: historical source facts include 36/48/53-question attempts.
  position integer not null, created_at timestamptz default now(),
  -- Source history contains four duplicate position groups across two attempts.
  -- New attempts remain unique because the picker assigns row_number(), but history must not be normalized.
  primary key(attempt_id,question_id)
);
create table viago_quiz.quiz_attempt_answers (
  attempt_id uuid not null, question_id uuid not null, qtype text not null check(qtype in ('likert','single')),
  likert_value integer check(likert_value between 0 and 4), option_id uuid references viago_quiz.question_options on delete restrict,
  created_at timestamptz not null default now(), primary key(attempt_id,question_id),
  foreign key(attempt_id,question_id) references viago_quiz.quiz_attempt_questions(attempt_id,question_id) on delete cascade,
  foreign key(question_id,option_id) references viago_quiz.question_options(question_id,id) on delete restrict,
  check((qtype='likert' and likert_value is not null and option_id is null) or (qtype='single' and option_id is not null and likert_value is null))
);
create table viago_quiz.quiz_attempt_option_order (
  attempt_id uuid not null, question_id uuid not null, option_id uuid not null references viago_quiz.question_options on delete restrict,
  sort_order integer not null, position integer not null,
  primary key(attempt_id,option_id), unique(attempt_id,question_id,position),
  foreign key(attempt_id,question_id) references viago_quiz.quiz_attempt_questions(attempt_id,question_id) on delete cascade
);
create index on viago_quiz.questions(qtype,likert_color) where is_active;
create index on viago_quiz.question_options(question_id) where is_active;
create index on viago_quiz.quiz_attempt_answers(attempt_id);
create index on viago_quiz.quiz_attempt_option_order(attempt_id,question_id);

alter table viago_quiz.questions enable row level security;
alter table viago_quiz.question_options enable row level security;
alter table viago_quiz.quiz_attempts enable row level security;
alter table viago_quiz.quiz_attempt_questions enable row level security;
alter table viago_quiz.quiz_attempt_answers enable row level security;
alter table viago_quiz.quiz_attempt_option_order enable row level security;
-- Intentionally no anon/authenticated table policies or grants. Runtime access is server-only.
revoke all on all tables in schema viago_quiz from public, anon, authenticated;
grant select,insert,update,delete on all tables in schema viago_quiz to service_role;

create or replace function viago_quiz.pick_balanced_questions_50(p_attempt_id uuid) returns void
language plpgsql volatile security invoker set search_path='' as $$
begin
  if not exists(select 1 from viago_quiz.quiz_attempts where id=p_attempt_id) then raise exception 'unknown attempt'; end if;
  delete from viago_quiz.quiz_attempt_option_order where attempt_id=p_attempt_id;
  delete from viago_quiz.quiz_attempt_questions where attempt_id=p_attempt_id;
  with targets(qtype,color,n) as (values ('likert','red',6),('likert','blue',6),('likert','yellow',6),('likert','green',7),('single',null::text,25)),
  ranked as (select q.id,q.qtype,q.likert_color color,row_number() over(partition by q.qtype,q.likert_color order by random()) rn
    from viago_quiz.questions q where q.is_active and q.qtype in ('likert','single')),
  picked as (select r.id,r.qtype from ranked r join targets t on t.qtype=r.qtype and (t.color is null or t.color=r.color) where r.rn<=t.n),
  numbered as (select id,qtype,row_number() over(order by random()) position from picked)
  insert into viago_quiz.quiz_attempt_questions(attempt_id,question_id,qtype,position)
  select p_attempt_id,id,qtype,position from numbered;
  if (select count(*) from viago_quiz.quiz_attempt_questions where attempt_id=p_attempt_id)<>50 then raise exception 'Expected 50 questions'; end if;
  insert into viago_quiz.quiz_attempt_option_order(attempt_id,question_id,option_id,sort_order,position)
  select p_attempt_id,aq.question_id,o.id,rn,rn from (
    select aq.*,o.id option_id,row_number() over(partition by aq.question_id order by random()) rn
    from viago_quiz.quiz_attempt_questions aq join viago_quiz.question_options o on o.question_id=aq.question_id and o.is_active
    where aq.attempt_id=p_attempt_id and aq.qtype='single') x
  join viago_quiz.quiz_attempt_questions aq on aq.attempt_id=p_attempt_id and aq.question_id=x.question_id
  join viago_quiz.question_options o on o.id=x.option_id;
end $$;

create or replace function viago_quiz.results_for_attempt(p_attempt_id uuid) returns jsonb
language sql stable security invoker set search_path='' as $$
with colors(color,ord) as (values ('red',1),('blue',2),('green',3),('yellow',4)),
ans as (
 select q.likert_color color,a.likert_value::int points from viago_quiz.quiz_attempt_answers a join viago_quiz.questions q on q.id=a.question_id
 where a.attempt_id=p_attempt_id and a.qtype='likert' and q.likert_color is not null and a.likert_value is not null
 union all select 'red',o.red from viago_quiz.quiz_attempt_answers a join viago_quiz.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.red>0
 union all select 'blue',o.blue from viago_quiz.quiz_attempt_answers a join viago_quiz.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.blue>0
 union all select 'green',o.green from viago_quiz.quiz_attempt_answers a join viago_quiz.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.green>0
 union all select 'yellow',o.yellow from viago_quiz.quiz_attempt_answers a join viago_quiz.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.yellow>0),
agg as (select color,sum(points)::int total_score,max(points)::int max_hits,count(*) filter(where points>0) pos_hits from ans group by color),
ranked as (select a.color,a.total_score,row_number() over(order by a.total_score desc,a.max_hits desc,a.pos_hits desc,c.ord) rk
 from agg a join colors c using(color))
select jsonb_build_object('attempt_id',p_attempt_id,'winner_color',(select color from ranked where rk=1),
 'results',(select jsonb_agg(jsonb_build_object('color',r.color,'total_score',r.total_score) order by c.ord) from ranked r join colors c using(color))) $$;
revoke all on all functions in schema viago_quiz from public, anon, authenticated;
grant execute on function viago_quiz.pick_balanced_questions_50(uuid),viago_quiz.results_for_attempt(uuid) to service_role;
