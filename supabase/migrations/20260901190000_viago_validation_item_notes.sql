begin;

alter table viago_quiz.validation_attempts
  add column if not exists item_notes jsonb not null default '{}'::jsonb;

comment on column viago_quiz.validation_attempts.item_notes is
  'Optional participant-authored short notes keyed by immutable question revision ID.';

notify pgrst, 'reload schema';
commit;
