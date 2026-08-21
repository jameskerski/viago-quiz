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

## Rollback

Rollback immediately for any material score/result mismatch; assignment not exactly 50 or 25/25; translation/order loss; elevated start/answer/finish failure rate; cross-domain access; target integrity error; or unacceptable latency/error regression.

Action: freeze quiz writes, point Vercel variables back to the unchanged standalone URL/key with schema `public`, redeploy the known-good production commit, and smoke test. Do not delete target rows. Identify attempts whose `created_at` falls between target cutover and rollback; export those attempts, assignments, orders, and answers as a reconciliation bundle. Because writes were single-authority, these are the only divergent records. Decide after incident review whether to import them into the standalone source; never overwrite same-PK historical answers automatically.

## Retirement gates

The standalone project cannot be retired until all are true: approved production soak; final count/hash and sampled-result parity; no Vercel environment references; no application/site/embed references; no unresolved production errors; rollback window complete; reconciliation bundles resolved; owner acceptance. When authorized, pause first, observe through an additional window, retain export/manifests, and delete only under a separate destructive-action approval.
