begin;

create table if not exists viago_quiz.validation_question_revisions (
  question_revision_id text primary key,
  question_id text not null,
  prompt text not null,
  format text not null check (format in ('LIKERT','SINGLE_SELECT')),
  likert_target text null check (likert_target is null or likert_target in ('red','blue','yellow','green')),
  semantic_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by_source text not null,
  supersedes_revision_id text null references viago_quiz.validation_question_revisions(question_revision_id),
  change_reason text not null,
  status text not null check (status in ('PROPOSED','ACTIVE','SUPERSEDED','RETIRED'))
);

create table if not exists viago_quiz.validation_option_revisions (
  option_revision_id text primary key,
  question_revision_id text not null references viago_quiz.validation_question_revisions(question_revision_id),
  option_id text not null,
  wording text not null,
  mapped_color text not null check (mapped_color in ('red','blue','yellow','green')),
  display_identity text not null,
  created_at timestamptz not null default now(),
  unique(question_revision_id, option_id)
);

create table if not exists viago_quiz.validation_bank_versions (
  bank_id text primary key,
  semantic_version text not null,
  bank_hash text not null unique,
  created_at timestamptz not null,
  activated_at timestamptz null,
  retired_at timestamptz null,
  source_commit text not null,
  deployment_id text null,
  assembler_version text not null,
  scoring_version text not null,
  status text not null check (status in ('PROPOSED','ACTIVE_VALIDATION','RETIRED_VALIDATION')),
  question_count int not null check (question_count > 0)
);

create table if not exists viago_quiz.validation_bank_questions (
  bank_id text not null references viago_quiz.validation_bank_versions(bank_id),
  question_revision_id text not null references viago_quiz.validation_question_revisions(question_revision_id),
  bank_position int not null,
  primary key(bank_id, question_revision_id),
  unique(bank_id, bank_position)
);

create table if not exists viago_quiz.validation_runtime_config (
  singleton boolean primary key default true check(singleton),
  active_validation_bank_id text not null references viago_quiz.validation_bank_versions(bank_id),
  changed_at timestamptz not null default now(),
  changed_by text not null,
  change_reason text not null
);

alter table viago_quiz.validation_attempts
  add column if not exists bank_activated_at timestamptz null,
  add column if not exists source_commit text null,
  add column if not exists source_deployment_id text null;

create or replace function viago_quiz.validation_revision_immutable() returns trigger
language plpgsql set search_path='' as $fn$
begin
  raise exception 'Validation revisions and bank membership are immutable';
end $fn$;

create or replace function viago_quiz.validation_bank_identity_immutable() returns trigger
language plpgsql set search_path='' as $fn$
begin
  if new.bank_id<>old.bank_id or new.semantic_version<>old.semantic_version or new.bank_hash<>old.bank_hash
     or new.created_at<>old.created_at or new.activated_at is distinct from old.activated_at
     or new.source_commit<>old.source_commit or new.deployment_id is distinct from old.deployment_id
     or new.assembler_version<>old.assembler_version or new.scoring_version<>old.scoring_version
     or new.question_count<>old.question_count
  then raise exception 'Validation bank identity and composition provenance are immutable'; end if;
  if old.status='RETIRED_VALIDATION' and (new.status<>old.status or new.retired_at is distinct from old.retired_at)
  then raise exception 'Retired validation bank lifecycle is immutable'; end if;
  return new;
end $fn$;

drop trigger if exists validation_question_revision_immutable on viago_quiz.validation_question_revisions;
create trigger validation_question_revision_immutable before update or delete on viago_quiz.validation_question_revisions
for each row execute function viago_quiz.validation_revision_immutable();
drop trigger if exists validation_option_revision_immutable on viago_quiz.validation_option_revisions;
create trigger validation_option_revision_immutable before update or delete on viago_quiz.validation_option_revisions
for each row execute function viago_quiz.validation_revision_immutable();
drop trigger if exists validation_bank_question_immutable on viago_quiz.validation_bank_questions;
create trigger validation_bank_question_immutable before update or delete on viago_quiz.validation_bank_questions
for each row execute function viago_quiz.validation_revision_immutable();
drop trigger if exists validation_bank_identity_immutable_trigger on viago_quiz.validation_bank_versions;
create trigger validation_bank_identity_immutable_trigger before update or delete on viago_quiz.validation_bank_versions
for each row execute function viago_quiz.validation_bank_identity_immutable();

alter table viago_quiz.validation_question_revisions enable row level security;
alter table viago_quiz.validation_option_revisions enable row level security;
alter table viago_quiz.validation_bank_versions enable row level security;
alter table viago_quiz.validation_bank_questions enable row level security;
alter table viago_quiz.validation_runtime_config enable row level security;
revoke all on viago_quiz.validation_question_revisions,viago_quiz.validation_option_revisions,viago_quiz.validation_bank_versions,viago_quiz.validation_bank_questions,viago_quiz.validation_runtime_config from public,anon,authenticated;
grant select,insert on viago_quiz.validation_question_revisions,viago_quiz.validation_option_revisions,viago_quiz.validation_bank_versions,viago_quiz.validation_bank_questions to service_role;
grant select,insert,update on viago_quiz.validation_runtime_config to service_role;
revoke all on function viago_quiz.validation_revision_immutable() from public,anon,authenticated;
revoke all on function viago_quiz.validation_bank_identity_immutable() from public,anon,authenticated;

create or replace function viago_quiz.validation_attempt_immutable() returns trigger language plpgsql set search_path='' as $fn$
begin
  if old.completed_at is not null then raise exception 'Completed validation attempts are immutable'; end if;
  if new.id<>old.id or new.participant_id<>old.participant_id or new.attempt_number<>old.attempt_number or new.seed<>old.seed
     or new.manifest<>old.manifest or new.bank_version<>old.bank_version or new.bank_hash<>old.bank_hash
     or new.assembler_version<>old.assembler_version or new.scoring_version<>old.scoring_version
     or new.bank_activated_at is distinct from old.bank_activated_at or new.source_commit is distinct from old.source_commit
     or new.source_deployment_id is distinct from old.source_deployment_id
  then raise exception 'Validation attempt identity and provenance are immutable'; end if;
  return new;
end $fn$;

notify pgrst,'reload schema';
commit;
