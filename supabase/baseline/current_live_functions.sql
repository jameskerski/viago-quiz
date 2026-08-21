-- Companion to 20260821000100_current_live_baseline.sql.
-- Reconstructed from pg_get_functiondef(zkmkenhziznafbgmcayp) on 2026-08-21.
-- Kept separate so the unsafe current contract cannot be confused with target RPCs.

create or replace function public.create_quiz_attempt() returns uuid language plpgsql as $$
declare v_attempt_id uuid;
begin
  insert into public.quiz_attempts(id) values(gen_random_uuid()) returning id into v_attempt_id;
  with likert_pool as (
    select q.id,q.qtype,q.likert_color color_bucket,row_number() over(partition by q.likert_color order by random()) rn
    from public.questions q where q.is_active and q.qtype='likert' and q.likert_color in ('red','blue','green','yellow')),
  picked_likert as (select id,qtype,color_bucket from likert_pool where rn<=6),
  tf_colors as (select qo.question_id,case when max(qo.red)=4 then 'red' when max(qo.blue)=4 then 'blue' when max(qo.green)=4 then 'green' when max(qo.yellow)=4 then 'yellow' end color_bucket
    from public.question_options qo where qo.is_active group by qo.question_id),
  tf_pool as (select q.id,q.qtype,tc.color_bucket,row_number() over(partition by tc.color_bucket order by random()) rn
    from public.questions q join tf_colors tc on tc.question_id=q.id where q.is_active and q.qtype='tf' and tc.color_bucket in ('red','blue','green','yellow')),
  picked_tf as (select id,qtype,color_bucket from tf_pool where rn<=3),
  picked_single as (select q.id,q.qtype,null::text color_bucket from public.questions q where q.is_active and q.qtype='single' order by random() limit 12),
  picked_all as (select * from picked_likert union all select * from picked_tf union all select * from picked_single),
  shuffled as (select id question_id,qtype,row_number() over(order by random()) position from picked_all)
  insert into public.quiz_attempt_questions(attempt_id,question_id,qtype,position) select v_attempt_id,question_id,qtype,position from shuffled;
  return v_attempt_id;
end $$;

create or replace function public.get_results(p_attempt_id uuid) returns table(color text,total_score integer) language sql stable as $$
with likert_scores as (select q.likert_color::text color,sum(a.likert_value)::int score from public.quiz_attempt_answers a join public.questions q on q.id=a.question_id where a.attempt_id=p_attempt_id and a.qtype='likert' group by q.likert_color),
single_scores as (
 select 'red'::text color,coalesce(sum(o.red),0)::int score from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single'
 union all select 'blue',coalesce(sum(o.blue),0)::int from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single'
 union all select 'green',coalesce(sum(o.green),0)::int from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single'
 union all select 'yellow',coalesce(sum(o.yellow),0)::int from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single'),
combined as (select * from likert_scores union all select * from single_scores)
select c.color,coalesce(sum(c.score),0)::int from combined c group by c.color order by 2 desc,c.color asc $$;

create or replace function public.get_winner(p_attempt_id uuid) returns table(winner_color text,total_score integer,max_hits integer,pos_hits integer) language sql stable as $$
with per_answer as (select a.attempt_id,
 case when a.qtype='likert' and q.likert_color='red' then coalesce(a.likert_value,0) when a.qtype='single' then coalesce(o.red,0) else 0 end red_pts,
 case when a.qtype='likert' and q.likert_color='blue' then coalesce(a.likert_value,0) when a.qtype='single' then coalesce(o.blue,0) else 0 end blue_pts,
 case when a.qtype='likert' and q.likert_color='green' then coalesce(a.likert_value,0) when a.qtype='single' then coalesce(o.green,0) else 0 end green_pts,
 case when a.qtype='likert' and q.likert_color='yellow' then coalesce(a.likert_value,0) when a.qtype='single' then coalesce(o.yellow,0) else 0 end yellow_pts
 from public.quiz_attempt_answers a left join public.questions q on q.id=a.question_id left join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id),
agg as (select 'red'::text color,sum(red_pts)::int total_score,sum((red_pts=4)::int)::int max_hits,sum((red_pts>0)::int)::int pos_hits from per_answer
 union all select 'blue',sum(blue_pts)::int,sum((blue_pts=4)::int)::int,sum((blue_pts>0)::int)::int from per_answer
 union all select 'green',sum(green_pts)::int,sum((green_pts=4)::int)::int,sum((green_pts>0)::int)::int from per_answer
 union all select 'yellow',sum(yellow_pts)::int,sum((yellow_pts=4)::int)::int,sum((yellow_pts>0)::int)::int from per_answer)
select color,total_score,max_hits,pos_hits from agg order by total_score desc,max_hits desc,pos_hits desc,array_position(array['red','blue','green','yellow'],color) limit 1 $$;

create or replace function public.pick_balanced_questions_50(p_attempt_id uuid) returns void language plpgsql as $$
begin
  delete from public.quiz_attempt_questions where attempt_id=p_attempt_id;
  with targets(qtype,color,n) as (values ('likert','red',6),('likert','blue',6),('likert','yellow',6),('likert','green',7),('single',null::text,25)),
  pool as (select q.id,q.qtype,q.likert_color color from public.questions q where q.qtype in ('likert','single')),
  ranked as (select p.*,row_number() over(partition by p.qtype,p.color order by random()) rn from pool p),
  picked as (select r.id,r.qtype from ranked r join targets t on t.qtype=r.qtype and (t.color is null or t.color=r.color) where r.rn<=t.n),
  numbered as (select id,qtype,row_number() over(order by random()) position from picked)
  insert into public.quiz_attempt_questions(attempt_id,question_id,qtype,position) select p_attempt_id,id,qtype,position from numbered;
  delete from public.quiz_attempt_option_order where attempt_id=p_attempt_id;
  insert into public.quiz_attempt_option_order(attempt_id,question_id,option_id,sort_order,position)
  select p_attempt_id,aq.question_id,o.id,row_number() over(partition by aq.question_id order by random()),row_number() over(partition by aq.question_id order by random())
  from public.quiz_attempt_questions aq join public.question_options o on o.question_id=aq.question_id where aq.attempt_id=p_attempt_id and aq.qtype='single';
  if (select count(*) from public.quiz_attempt_questions where attempt_id=p_attempt_id)<>50 then raise exception 'Expected 50 picked questions, got %',(select count(*) from public.quiz_attempt_questions where attempt_id=p_attempt_id); end if;
end $$;

create or replace function public.results_for_attempt(p_attempt_id uuid) returns jsonb language sql stable as $$
with ans as (
 select q.likert_color color,a.likert_value::int points from public.quiz_attempt_answers a join public.questions q on q.id=a.question_id where a.attempt_id=p_attempt_id and a.qtype='likert' and q.likert_color is not null and a.likert_value is not null
 union all select 'red',o.red from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.red>0
 union all select 'blue',o.blue from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.blue>0
 union all select 'green',o.green from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.green>0
 union all select 'yellow',o.yellow from public.quiz_attempt_answers a join public.question_options o on o.id=a.option_id where a.attempt_id=p_attempt_id and a.qtype='single' and o.yellow>0),
agg as (select color,coalesce(sum(points),0)::int total_score,coalesce(max(points),0)::int max_hits,count(*) filter(where points>0) pos_hits from ans group by color),
ranked as (select color,total_score,row_number() over(order by total_score desc,max_hits desc,pos_hits desc,array_position(array['red','blue','green','yellow'],color)) rk from agg)
select jsonb_build_object('attempt_id',p_attempt_id,'winner_color',(select color from ranked where rk=1),'results',(select jsonb_agg(jsonb_build_object('color',color,'total_score',total_score) order by array_position(array['red','blue','green','yellow'],color)) from ranked)) $$;

grant execute on function public.create_quiz_attempt(), public.get_results(uuid), public.get_winner(uuid), public.pick_balanced_questions_50(uuid), public.results_for_attempt(uuid) to public, anon, authenticated, service_role;
