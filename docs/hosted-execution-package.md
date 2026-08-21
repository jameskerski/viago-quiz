# Future hosted execution package

This package is prepared but not authorized for execution. Operators must use separately provisioned source-read and target-write credentials; never echo values or commit artifact data.

## Gate 0 — immutable inputs

- Approved commit/PR from `jameskerski/viago-quiz`; clean CI and migration review.
- Record source ref `zkmkenhziznafbgmcayp`, target ref `xombtulaktoprxxtkbcy`, source/target Postgres versions, current migration lists, Traveler schema checksums, Vercel project/deployment IDs, and rollback deployment.
- Disposable-project application of the target SQL passes SQL parsing, advisors, RLS/grant assertions, 50-question generation tests, and result fixtures.
- Owner has selected result-link mode and soak duration.

## Gate 1 — deploy schema only

Apply `supabase/migrations/20260821000200_viago_quiz_target.sql` to the target through the shared integration lane. Confirm the Data API exposes `viago_quiz` to service-role calls. Assert `anon` and `authenticated` have neither schema usage, table privileges, nor function execution. Compare every pre-recorded Traveler checksum; any difference stops execution and rolls back the new quiz schema only.

## Gate 2 — initial snapshot and copy

Set `QUIZ_SNAPSHOT_CUTOFF=T0`, run `npm run migration:snapshot -- artifacts/quiz-snapshot-T0`, inspect the manifest, then run `npm run migration:load -- artifacts/quiz-snapshot-T0` without `--apply`. After explicit approval, repeat with `--apply`. Preserve UUIDs/timestamps. The loader order is content → attempts → assignments → option order → answers and is PK-replay-safe.

Required evidence: exact per-table counts/hashes; zero FK orphans; translations populated; 14 zero-assignment attempts retained; assignment distribution retains 36/48/50/53 shapes; no normalization.

## Gate 3 — parity

Run `npm run migration:reconcile` and `QUIZ_PARITY_SAMPLE=100 npm run migration:parity`. Add explicit samples from every historical shape and all four winner colors. One count, hash, question/order, option/order, answer, score, winner, percentage/detail, or bilingual-content difference blocks cutover.

## Gate 4 — final delta and freeze

Open a short write freeze. Set `QUIZ_DELTA_SINCE=T0`; run `npm run migration:delta -- artifacts/quiz-delta-T1`, dry-run/load it, then reconcile again. Delta includes new attempts and children plus answers first submitted after T0 to older attempts. Record T1 and prove no source writes after T1.

## Gate 5 — Vercel cutover

Atomically select target URL/service credential and `SUPABASE_QUIZ_SCHEMA=viago_quiz`; apply the chosen token flags. Deploy the prevalidated commit. Do not expose the service credential under a `NEXT_PUBLIC_` name and do not dual-write.

## Gate 6 — production validation and soak

Smoke English and Spanish from language selection through result. Verify 50 questions, 25/25 composition, persisted question/option order, answer validation, score/winner/details, current refresh behavior, and selected result-link policy. Monitor API errors/latency, attempt/assignment/answer rates, database errors, RLS/grant advisories, and Traveler health throughout the approved soak.

## Rollback gate

Immediately freeze and roll Vercel back to the old URL/key with `SUPABASE_QUIZ_SCHEMA=public` for any semantic mismatch, non-50 new attempt, bilingual/order regression, authorization bypass, cross-domain change, elevated API/database failure, or unacceptable latency. Redeploy the known-good commit and smoke test. Export target-only attempts created between cutover and rollback as a reconciliation bundle; never overwrite source history automatically.

## Retirement gate

Only after soak, final parity, zero old references, resolved reconciliation, clean monitoring, expired rollback window, and owner acceptance: authorize pausing the standalone project. Observe the paused state before any separately authorized deletion. Retain encrypted exports and manifests.
