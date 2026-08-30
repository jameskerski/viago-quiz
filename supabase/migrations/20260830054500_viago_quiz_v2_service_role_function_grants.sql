begin;

-- V2 database functions are callable only by the server-side service role.
revoke all on function viago_quiz.v2_admin_analytics() from public, anon, authenticated;
revoke all on function viago_quiz.v2_completed_assessment_count() from public, anon, authenticated;

grant execute on function viago_quiz.v2_admin_analytics() to service_role;
grant execute on function viago_quiz.v2_completed_assessment_count() to service_role;

do $guard$
declare
  function_oid oid;
begin
  foreach function_oid in array array[
    'viago_quiz.v2_admin_analytics()'::regprocedure::oid,
    'viago_quiz.v2_completed_assessment_count()'::regprocedure::oid
  ]
  loop
    if not has_function_privilege('service_role', function_oid, 'EXECUTE') then
      raise exception 'service_role EXECUTE grant is missing for %', function_oid::regprocedure;
    end if;

    if has_function_privilege('anon', function_oid, 'EXECUTE')
       or has_function_privilege('authenticated', function_oid, 'EXECUTE') then
      raise exception 'browser role has EXECUTE on %', function_oid::regprocedure;
    end if;

    if exists (
      select 1
      from pg_proc p
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
      where p.oid = function_oid
        and acl.grantee = 0
        and acl.privilege_type = 'EXECUTE'
    ) then
      raise exception 'PUBLIC has EXECUTE on %', function_oid::regprocedure;
    end if;
  end loop;
end
$guard$;

commit;
