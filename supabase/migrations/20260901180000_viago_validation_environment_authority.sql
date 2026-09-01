begin;

create table if not exists viago_quiz.validation_runtime_environments (
  environment_key text primary key check (environment_key ~ '^[a-z0-9][a-z0-9_-]{2,63}$'),
  active_validation_bank_id text not null references viago_quiz.validation_bank_versions(bank_id),
  assembler_version text not null,
  changed_at timestamptz not null default now(),
  changed_by text not null,
  change_reason text not null
);

comment on table viago_quiz.validation_runtime_environments is
  'Explicit environment-scoped validation authority. Runtime must resolve an exact configured key and fail closed; no hostname or latest-deployment inference.';

alter table viago_quiz.validation_runtime_environments enable row level security;
revoke all on viago_quiz.validation_runtime_environments from public, anon, authenticated;
grant select, insert, update on viago_quiz.validation_runtime_environments to service_role;

notify pgrst, 'reload schema';
commit;
