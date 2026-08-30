begin;

-- V2 public runtime writes additive attempt metadata through the server-side
-- service role only. Browser roles remain explicitly denied.
revoke all on table viago_quiz.assessment_attempt_metadata from public, anon, authenticated;
grant select, insert, update on table viago_quiz.assessment_attempt_metadata to service_role;

do $$
begin
  if not has_table_privilege('service_role', 'viago_quiz.assessment_attempt_metadata', 'SELECT, INSERT, UPDATE') then
    raise exception 'service_role metadata write grants are incomplete';
  end if;
  if has_table_privilege('anon', 'viago_quiz.assessment_attempt_metadata', 'SELECT, INSERT, UPDATE')
     or has_table_privilege('authenticated', 'viago_quiz.assessment_attempt_metadata', 'SELECT, INSERT, UPDATE') then
    raise exception 'browser role has metadata privileges';
  end if;
  if exists (
    select 1 from pg_class c
    cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) acl
    where c.oid = 'viago_quiz.assessment_attempt_metadata'::regclass
      and acl.grantee = 0
      and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE')
  ) then
    raise exception 'PUBLIC has metadata privileges';
  end if;
end $$;

commit;
