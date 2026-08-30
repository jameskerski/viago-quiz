# Cutover, rollback, and retirement runbook

Do not execute without separate hosted-change authorization.

## Preflight and initial copy

1. Resolve repository ownership, approve the target migration, and validate it in a disposable project. Confirm `viago_quiz` is an exposed Data API schema for service-role use but has no anon/auth grants.
2. Deploy only `20260821000200_viago_quiz_target.sql`. Assert Traveler schema/object definitions and migration checksums are unchanged.
3. Record `T0`; run `migration:snapshot` against the source with `QUIZ_SNAPSHOT_CUTOFF=T0`. Archive manifest read-only.
4. Run `migration:load` without `--apply`, inspect counts, then explicitly authorize and run with `--apply`.
5. Run reconciliation, FK/orphan checks, English/Spanish content checks, 50-question composition/order checks, and at least 100 historical result comparisons. Any mismatch blocks cutover.

## Final delta and authoritative cutover

6. Announce a short write freeze/maintenance window. There is no dual write.
7. Capture `T1`; run `migration:delta` with `QUIZ_DELTA_SINCE=T0`. Replay delta in parent-before-child order and rerun exact counts/hashes/parity. Confirm no source rows newer than T1.
8. Change Vercel production variables atomically: target URL/key plus `SUPABASE_QUIZ_SCHEMA=viago_quiz`. Do not expose service credentials as `NEXT_PUBLIC_*`. Deploy the already-tested commit.
9. Smoke test English and Spanish: language/start, 50 questions, 25/25 composition, stable question/option order, answer persistence, finish/result, tie-break/result descriptions, direct result retrieval, and recovery behavior.
10. Monitor API 4xx/5xx, function/database errors, latency, attempt creation, assignment count, answer completion, and result distribution.

## Historical rollback (retired 2026-08-29)

The former standalone rollback project `zkmkenhziznafbgmcayp` was permanently deleted after the authorized retirement gate. It is no longer a deployable rollback destination, and its credential was destroyed. Historical records are preserved only in the immutable OWNER retirement archive with disposition `ARCHIVE_ONLY_DO_NOT_MERGE`.

Any future recovery requires a separately authorized isolated restoration from that archive. Never restore into or overwrite canonical production automatically.

## Retirement gates

The retirement gates were completed and OWNER-authorized deletion occurred on 2026-08-29. Preserve the immutable export/manifests permanently unless OWNER separately authorizes destruction.
