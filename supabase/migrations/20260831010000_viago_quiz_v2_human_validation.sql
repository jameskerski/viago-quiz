begin;
create table if not exists viago_quiz.validation_participants (
  id uuid primary key default gen_random_uuid(), participant_code text not null unique,
  population text not null check(population in ('EXPERIENCED','NEW')),
  known_primary text null check(known_primary in ('red','blue','yellow','green')),
  known_secondary text null check(known_secondary in ('red','blue','yellow','green')),
  created_at timestamptz not null default now()
);
create table if not exists viago_quiz.validation_attempts (
  id uuid primary key default gen_random_uuid(), participant_id uuid not null references viago_quiz.validation_participants(id), attempt_number int not null,
  mode text not null check(mode='VIAGO_V2_PRIVATE_HUMAN_VALIDATION'), bank_version text not null, bank_hash text not null,
  assembler_version text not null, scoring_version text not null, seed text not null, manifest_hash text not null, manifest jsonb not null,
  answers jsonb not null default '{}'::jsonb, item_flags jsonb not null default '{}'::jsonb,
  score_vector jsonb null, primary_color text null, secondary_color text null, ranking jsonb null, score_margin int null,
  started_at timestamptz not null default now(), completed_at timestamptz null, elapsed_seconds int null,
  unique(participant_id,attempt_number), unique(bank_version,assembler_version,seed)
);
create table if not exists viago_quiz.validation_feedback (
  attempt_id uuid primary key references viago_quiz.validation_attempts(id), result_feels_like_me int not null check(result_feels_like_me between 1 and 5),
  primary_correct boolean null, secondary_correct boolean null, repetitive int not null check(repetitive between 1 and 5), natural_score int not null check(natural_score between 1 and 5),
  notes text null, submitted_at timestamptz not null default now()
);
alter table viago_quiz.validation_participants enable row level security;
alter table viago_quiz.validation_attempts enable row level security;
alter table viago_quiz.validation_feedback enable row level security;
revoke all on viago_quiz.validation_participants,viago_quiz.validation_attempts,viago_quiz.validation_feedback from public,anon,authenticated;
grant select,insert on viago_quiz.validation_participants to service_role;
grant select,insert,update on viago_quiz.validation_attempts to service_role;
grant select,insert on viago_quiz.validation_feedback to service_role;
create or replace function viago_quiz.validation_attempt_immutable() returns trigger language plpgsql set search_path='' as $fn$
begin
  if old.completed_at is not null then raise exception 'Completed validation attempts are immutable'; end if;
  if new.id<>old.id or new.participant_id<>old.participant_id or new.attempt_number<>old.attempt_number or new.seed<>old.seed or new.manifest<>old.manifest then raise exception 'Validation attempt identity and manifest are immutable'; end if;
  return new;
end $fn$;
drop trigger if exists validation_attempt_immutable_trigger on viago_quiz.validation_attempts;
create trigger validation_attempt_immutable_trigger before update on viago_quiz.validation_attempts for each row execute function viago_quiz.validation_attempt_immutable();
revoke all on function viago_quiz.validation_attempt_immutable() from public,anon,authenticated;
do $guard$ begin
 if has_table_privilege('anon','viago_quiz.validation_attempts','SELECT,INSERT,UPDATE,DELETE') or has_table_privilege('authenticated','viago_quiz.validation_attempts','SELECT,INSERT,UPDATE,DELETE') then raise exception 'Validation data exposed to browser roles'; end if;
end $guard$;
notify pgrst,'reload schema';
commit;
