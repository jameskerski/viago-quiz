# VIAGO Quiz backend implementation readiness

Audit date: 2026-08-21. Hosted inspection was read-only. No deployment, data copy, key change, or hosted schema change occurred.

## A. Current application architecture

Next.js 16.1.1 App Router, React/React DOM 19.2.3, TypeScript 5, `@supabase/supabase-js` 2.90.1. Vercel reports Node 24.x; the local validation runtime is Node 22.23.1. Commands are `npm run dev`, `build`, `start`, `lint`, `typecheck`, and `test`.

Routes:

- `/` redirects to `/quiz`.
- `/quiz` is a client component with language → start → quiz → results state. It does not persist state in cookies, localStorage, or sessionStorage; refresh starts over.
- `/results/[sessionId]` is an older direct result page. The path parameter is unused; it requires `attempt_id` in the query string and calls `/api/results`.
- Current flow API: `POST /api/start`, `GET /api/attempt`, `POST /api/answer`, `POST /api/finish`; diagnostic/recovery endpoints are `GET /api/progress`, `GET /api/results`, and `GET /api/health`.
- Unused legacy `/api/question`, `/api/rank`, and `/api/auto-answer` routes were removed locally. Their zero-row database objects remain preserved in the current-state baseline.

Runtime environment variables (names only): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, optional `SUPABASE_QUIZ_SCHEMA` (allowlisted to `public` or `viago_quiz`), optional `QUIZ_ATTEMPT_TOKEN_SECRET`, and `QUIZ_REQUIRE_ATTEMPT_TOKEN`. Direct browser Supabase code was removed. All runtime reads and writes use one server-only service-role client.

Current operations:

1. Start inserts `quiz_attempts`, invokes `pick_balanced_questions_50`, and verifies 50 assigned rows.
2. The RPC picks 25 Likert (red/blue/yellow/green = 6/6/6/7) plus 25 single-select questions, shuffles all 50, and persists question and option order.
3. Attempt loading reads assigned rows, bilingual `questions`, bilingual `question_options`, and persisted option order. Spanish falls back to English when a translation is null.
4. Answer upserts one `quiz_attempt_answers` row per attempt/question. Likert is 0–4; single stores one option UUID.
5. Finish checks assignment/answer counts then invokes `results_for_attempt`. Likert contributes its value to the question color; selected options contribute per-color weights. Winner tie-breaks by total score, maximum point value, positive-hit count, then red/blue/green/yellow order.
6. Results and descriptions are rendered in the client. Descriptions are code-owned bilingual strings, not database rows. No result is separately persisted; it is recomputed from immutable historical answers/content.

Refresh/resume is incomplete: assigned/order/answers survive server-side, and `/api/progress` plus `/api/attempt` can reconstruct them, but the UI does not retain or restore the attempt ID/index. A result URL can retrieve by attempt UUID. This is a pre-existing product behavior, not changed here.

## B. Infrastructure reconciliation

- Local branch: `main`; origin: `jameskerski/viago-quiz`. Both the old transferred URL and canonical URL resolved to the same `main` SHA (`7139633f5e7b4cf0ef5d0061f0b5fc12f7cad276`), identical to local HEAD, before the local remote was updated.
- Vercel project `viago-quiz` (`prj_K7lIG6WmbjYOyL5urEEeQczyHxn5`) is Next.js/Node 24.x. Latest production-target deployment was READY, but the connector reported project `live: false`. Domains are `viago-quiz-sigma.vercel.app`, `viago-quiz-pristine5.vercel.app`, and `viago-quiz-git-main-pristine5.vercel.app`. No custom public website domain or embed is present in repository config.
- Standalone Supabase `zkmkenhziznafbgmcayp` is ACTIVE_HEALTHY, Postgres 17, us-east-1, with zero recorded migrations.
- Shared Supabase `xombtulaktoprxxtkbcy` is ACTIVE_HEALTHY, Postgres 17, ca-central-1, with migration `20260718030000 initial_v1_schema`. Its Traveler domain is eight RLS-enabled `public` tables. `viago_quiz` does not exist.
- No Auth, Storage, or Realtime dependency appears in quiz code or quiz data objects.

## C. Live database inventory

Exact rows: questions 151; question_options 124; quiz_attempts 1,972; quiz_attempt_questions 97,833; quiz_attempt_answers 67,928; quiz_attempt_option_order 193,900. Zero rows: answers, quiz_sessions, responses, quiz_answers, quiz_rankings, quiz_answer_orders, quiz_responses. One view: `quiz_attempt_scores`. No materialized views, triggers, identities, or sequences in `public`.

Active content is 120 Likert and 31 single questions. All question and option translations are populated; each option-bearing question has four options. Production MD5 evidence from ordered row JSON: questions `b5a0efb86e50641c60c7637a7f9ff07b`; options `a0e8f90a2e26197274907095dd66015e`.

Attempt timestamps: 2026-01-13T06:13:33.286966Z through 2026-08-15T01:55:58.953514Z. Assigned timestamps: 2026-01-13T06:16:22.937290Z through 2026-08-15T01:55:59.205774Z. Answer timestamps: 2026-01-13T07:18:01.552827Z through 2026-08-15T02:07:45.318428Z.

Integrity audit found zero missing attempt/question/option references, zero answers outside assigned attempts, zero order rows outside assigned attempts, and zero option/question mismatches. Assignment distribution is 1,940 attempts with 50, 14 with 48, 3 with 36, and 1 with 53; 14 attempts have no assigned rows. All 50-question attempts have the 25/25 type mix. There are 1,259 complete 50-question attempts.

Functions/RPCs are `create_quiz_attempt`, `get_results`, `get_winner`, `pick_balanced_questions_50`, and `results_for_attempt`. Every function is invoker-security but executable by PUBLIC/anon/authenticated/service_role. Required extensions are `plpgsql`, `pgcrypto`, and `uuid-ossp`. The baseline migration records exact columns, constraints, indexes, view, RLS posture, and grants; function definitions are reconstructed in the target where runtime-relevant.

One schema defect is material: live `quiz_attempt_questions.attempt_id` has no FK to `quiz_attempts`. Historical data currently has no orphans. The target adds the FK.

## D. Current security defects

RLS is disabled exactly on `quiz_answers`, `quiz_rankings`, `quiz_answer_orders`, `quiz_responses`, `quiz_attempt_questions`, `quiz_attempts`, `quiz_attempt_answers`, and `quiz_attempt_option_order`. Since anon/authenticated currently hold broad table grants, the Data API can enumerate, insert, update, or delete these rows subject only to FK/constraints.

RLS-enabled does not mean safe: `quiz_sessions` permits anon insert, unrestricted select, and unrestricted update; `responses` permits unrestricted anon insert/select; `question_options` is readable by PUBLIC without filtering `is_active`; `questions` has overlapping PUBLIC/anon active-read policies. Default-style grants include DELETE/INSERT/SELECT/UPDATE/TRUNCATE/REFERENCES/TRIGGER to anon/authenticated across tables. All five RPCs are executable by PUBLIC, allowing direct attempt creation, randomized reassignment/destructive repicking, and result lookup outside the Vercel boundary. The view is not `security_invoker` and is broadly granted.

The local implementation includes a signed HttpOnly attempt capability. Enforcement is default-off pending the historical result-link policy decision, so existing links are not silently broken. When enabled, the cookie binds access to one attempt. Answer writes additionally validate the assignment type and option/question relationship regardless of token mode.

## E–F. Access matrices

| Operation | Current browser/public reality | Current server | Target |
|---|---|---|---|
| Active content | Direct anon grants/policies possible; normal UI uses server | service role | server service role only |
| Begin/assign | Public RPC/grants possible | service role | server only |
| Read assignment/order | public tables enumerable | service role | server only, one presented attempt capability |
| Submit answer | public tables writable | service role | server only, validated against assignment/option |
| Result | public RPC executable for arbitrary UUID | service role | server only, attempt capability required |
| Content/admin/history | broad underlying grants | service role | separate admin/internal path; no anon/auth grants |
| Traveler domain | same project not applicable | none | no quiz grants/references; schema-qualified quiz client |

The selected pattern is browser → Vercel server authority → Supabase. It matches existing code, avoids exposing custom-schema tables or RPCs to public roles, and is simpler to audit than a mixed public-read/public-RPC contract. The target enables RLS on every table as defense in depth but creates no anon/auth policies.

## G–H. Recommendation and target

**RECOMMEND_SHARED_VIAGO_PLATFORM**, conditional on repository identity resolution, Data API exposure of `viago_quiz` for service-role PostgREST, successful disposable validation, historical parity, and an approved cutover. Evidence: the target is healthy on the same Postgres major, has no namespace collision, installed UUID/crypto support, and can isolate the quiz completely by schema and grants. Consolidation removes one recurring Supabase compute allocation after a successful soak/retirement while keeping business logic isolated.

Target tables are the six non-empty/runtime tables only: questions, question_options, quiz_attempts, quiz_attempt_questions, quiz_attempt_answers, and quiz_attempt_option_order. IDs/timestamps and current scoring semantics are retained. Target position constraints deliberately permit historical 36/48/53-question attempts. Zero-row legacy tables remain documented in the baseline but are excluded; their unused routes have been removed locally.

## I–K. Local artifacts

- `supabase/migrations/20260821000100_current_live_baseline.sql`: faithful current-state tables, constraints, indexes, view, grants, policies, and insecure RLS state. Never apply to a hosted project.
- `supabase/migrations/20260821000200_viago_quiz_target.sql`: isolated target tables, integrity improvements, RLS/grants, assignment and scoring functions.
- `scripts/migration/snapshot.mjs`: paginated ordered NDJSON snapshot, counts, PK inventory, cutoff, SHA-256 manifests.
- `load.mjs`: dry-run by default; `--apply` is explicit, batched, insert-order deterministic, and replay-safe via PK conflict ignore.
- `delta.mjs`: captures attempts after a declared initial cutoff plus all child rows.
- `reconcile.mjs`: compares exact counts and canonical SHA-256 hashes.
- `parity.mjs`: samples recent historical attempts and fails on any result JSON difference.
- `validate-artifacts.mjs` and `tests/migration.test.mjs`: structural security and deterministic hashing/parity gates.

Snapshot/load/reconciliation service credentials are dedicated variable names documented in `.env.migration.example`; values must never be committed. Tooling has not been run against target because the target schema is intentionally undeployed.

## L–M. Cutover, rollback, retirement

See `docs/cutover-runbook.md`. The standalone backend remains authoritative until the single cutover point. Long-lived dual writes are prohibited. Retirement requires soak, parity, reference removal, monitoring clearance, rollback-window completion, and owner acceptance; pause before delete.

## N–O. Cost and governance

After retirement, one dedicated Supabase project's recurring compute allocation can likely be removed. Exact savings depend on the owner's plan/compute size and are intentionally not invented. Shared-platform storage/egress growth is small relative to current data volume but should be measured.

Governance is defined by `docs/platform/applications.yaml` and `migration-governance.md`: one owner repository and schema per app, protected Traveler namespace, one integration lane, schema allowlisting, reviewed grants, and temporary-resource expiry metadata.

## P. Validation and unresolved dependencies

Validation results: `npm run typecheck` passed; 11 Node contract/determinism tests passed; `npm run db:validate` and `npm run governance:validate` passed; fixture-based migration loading completed in dry-run mode; the production build passed after allowing its existing Google Fonts fetch; `git diff --check` passed. `npm run lint` reports 11 pre-existing `no-explicit-any` errors and three warnings in retained application/import files; no new migration, security, governance, or tooling file fails lint. Read-only production revalidation reconfirmed exact counts, assignment shapes 0/36/48/50/53, zero null option-order positions, and zero duplicate answer keys. Hosted mutation/copy/parity are intentionally unresolved until authorization. Supabase CLI was unavailable locally, so migration files were timestamped consistently and validated by repository tooling rather than generated with `supabase migration new`. Current Supabase 2026 behavior requires explicit Data API grants/exposure; the target makes grants explicit but the dashboard exposed-schema setting must be confirmed during authorized deployment.

## Q. Genuine owner decisions

1. Approve a future hosted target deployment/copy/cutover and choose the production soak/rollback duration.
2. Decide between the two isolated historical result-link policies in `docs/result-link-security.md`.
