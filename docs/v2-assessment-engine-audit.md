# VIAGO V2 assessment-engine forensic audit

Status: discovery/foundation only. This audit does not change active questions, scoring, selection, attempts, results, or production configuration.

## Executive finding

V2 does not have a separate assessment engine. Its Home → Quiz → Results experience calls the same `/api/start`, `/api/attempt`, `/api/answer`, `/api/finish`, and `/api/results` routes used by V1. Those routes use the server-side Supabase client scoped to `xombtulaktoprxxtkbcy.viago_quiz`. The authoritative selector and grader are the database functions `pick_balanced_questions_50(uuid)` and `results_for_attempt(uuid)` established in `supabase/migrations/20260821000200_viago_quiz_target.sql`.

The implementation reliably enforces the intended 50-question **type balance** and the intended Likert **color balance**, but it does not balance behavioral domain or context. Raw scoring is deterministic and inspectable, but it is not normalized. The current bank contains exact duplicate English items under different canonical UUIDs, and repeat attempts are expected to share about half their questions because 25 of the 31 single-select prompts are selected every time.

## Evidence and authority

| Concern | Authoritative implementation | Runtime caller |
| --- | --- | --- |
| Questions and activation | `viago_quiz.questions` | `/api/attempt`; V2 admin reads the same table |
| Option text, eligibility, order, weights | `viago_quiz.question_options` and persisted `quiz_attempt_option_order` | `/api/attempt`, `/api/answer` |
| Attempt construction | `viago_quiz.pick_balanced_questions_50` | `POST /api/start` |
| Answer persistence | `viago_quiz.quiz_attempt_answers` | `POST /api/answer` |
| Final grading | `viago_quiz.results_for_attempt` | `/api/finish`, `/api/results`, V2 metadata capture |
| V2 presentation/profile narrative | `lib/v2/publicContent.ts` | V2 results client |
| Reconstructing an attempt | persisted assignments, positions, option order, and answers | database records |

The reconciled corpus source used for this item-level audit is `data/spanish-corpus-review.json`. It contains production UUIDs, English authority, Spanish text, option weights, and the accepted snapshot hashes (`questions` SHA-256 `51a541889f71de51f8802cfc2051b4816de5f576996b89218a348aed89e23756`; `question_options` SHA-256 `e4d9e5e1dbd6b9693158c3709134350708aa7b08021277bd3fb6b712a9521e72`). The Spanish release changed translations only; the English/scoring authority used here was guarded as unchanged.

## Complete execution path

1. `POST /api/start` inserts an empty `quiz_attempts` row.
2. It invokes `pick_balanced_questions_50` for that attempt.
3. The function deletes any existing option order and assignments for that attempt, ranks active `likert` and `single` rows with PostgreSQL `random()`, applies fixed targets, randomizes the 50 selected rows again, and persists positions 1–50.
4. It aborts unless exactly 50 assignments exist.
5. For selected single questions it randomizes active options and persists their per-attempt positions.
6. `/api/attempt` returns persisted questions in position order, resolving English or Spanish at read time. It does not expose scoring colors or weights to the browser.
7. `/api/answer` verifies that the question was assigned. Likert accepts integer 0–4. Single-select verifies that the active option belongs to the assigned question. Answers are upserted by `(attempt_id, question_id)`.
8. `/api/finish` refuses to grade until answer count is at least assignment count, then calls `results_for_attempt`.
9. The grader converts every Likert value directly to points for that question's `likert_color`. Each positive single-option color weight becomes a contribution; the schema permits 0–4 for each color.
10. Contributions are summed by color. Ranking is raw total descending, then largest individual contribution descending, then number of positive contributions descending, then fixed order Red → Blue → Green → Yellow.
11. The winner and raw totals are returned. There is no database percentage, normalization, threshold, reverse-score transform, or profile-band calculation.
12. V2 displays the same winner/raw totals and adds narratives. Its bars are scaled relative to the highest displayed raw score; they are not percentages. V2 separately stores language/completion/result metadata after a completed attempt.

## Exact selection and balancing

Each current attempt targets:

- 25 Likert: Red 6, Blue 6, Yellow 6, Green 7.
- 25 single-select from the complete active single pool, irrespective of color. Current single prompts have four one-hot answer options—one per color, each worth 4 points.
- Random global question order and random active option order per selected single question.

This is exact, not probabilistic, when pool prerequisites are satisfied. A deterministic independent simulation of 10,000 attempts observed only `{single:25, red:6, blue:6, yellow:6, green:7}`. Tests over 1,000 seeds also prove 50 unique assignments and fail-closed behavior for an insufficient color pool.

Pool prerequisites and edge cases:

- Required minimums are 6 active Red, Blue, and Yellow Likert; 7 active Green Likert; and 25 active single questions.
- The picker has no explicit prerequisite check; it constructs fewer rows and then raises `Expected 50 questions`.
- A failed start can leave the separately inserted empty attempt row because attempt insertion and the RPC are not one transaction.
- Single questions are assumed to have `likert_color = null`. A future non-null single color would form another ranking partition and can over-select because the single target matches every single partition.
- No guard requires exactly four active options per selected single question.
- PostgreSQL randomness is not seeded or recorded. The persisted assignments/order make a completed attempt auditable, but the original random draw cannot be replayed from a seed.
- Numeric color balance does not prevent six questions about nearly the same theme. Domain/context are not selection dimensions.

### Repeat exposure

For two independent attempts, expected overlap is approximately `k²/N` per pool:

- Single: `25²/31 = 20.16` repeated prompts.
- Likert: about 5.22 repeated prompts in total across the four color pools.
- Expected total overlap: about 25.4 of 50 questions.

This mathematically explains visible repetition even though randomization works.

## Exact scoring model

### Likert

Every answer is stored as 0, 1, 2, 3, or 4 and added unchanged to exactly one `likert_color`. There is no reverse-key column and no reverse-scoring operation. Negatively framed items therefore rely on their wording and assigned color being directionally correct.

### Single-select

The grader adds every positive color weight on the selected option. The current 124 options are four per question and are one-hot weights of 4, so current content contributes 4 points to exactly one color. The underlying schema/grader could support a multi-color option without code changes; that possibility is architecture, not current content.

### Weighting and possible maxima

Likert and single items both have a per-item maximum of 4, but they are behaviorally different: a single item forces a choice among colors, whereas a Likert item independently adds 0–4 to its assigned color. Twenty-five single items can contribute up to 100 points to one color. Likert maxima are Red 24, Blue 24, Yellow 24, and Green 28. Thus theoretical raw maxima are Red/Blue/Yellow 124 and Green 128.

No normalization corrects the extra Green item, changing pool composition, or differing realized opportunities. The one-question Green surplus can matter in close results.

### Completion, ties, and display

- Current UI requires all 50 answers; `/api/finish` returns 409 when incomplete. Skipping is not a supported completed-state behavior.
- Tie resolution is deterministic: total, maximum contribution, positive-hit count, then Red → Blue → Green → Yellow.
- An all-zero Likert vector still creates all four aggregate rows and selects Red by fixed order.
- V2's `COLOR_ORDER` is Red → Blue → Yellow → Green, different from the database's final Green/Yellow tie order. It cannot change the database winner, but it can change which tied non-winning color V2 labels secondary.
- Neither V1 nor V2 calculates a true percentage. V2 bar width is `score / highest score`; the term “four-color profile” should not be read as normalized share.

## Independent scoring vectors

`data/v2-audit/selection-scoring-validation.json` contains executable vectors for:

1. all-zero Likert/fixed-order tie;
2. equal totals resolved by maximum contribution;
3. equal totals and maximum resolved by positive-hit count;
4. the grader's technically supported multi-color option.

The vectors are calculated by `scripts/v2/lib/assessment-model.mjs`, independently transcribing the canonical SQL. All pass. This proves the documented math against the repository's authoritative deployed function definition; it is not a claim of psychometric validity.

## Current corpus

| Type/color | Active count | Selected per attempt | Per-item exposure probability |
| --- | ---: | ---: | ---: |
| Likert Red | 26 | 6 | 23.1% |
| Likert Blue | 30 | 6 | 20.0% |
| Likert Yellow | 29 | 6 | 20.7% |
| Likert Green | 35 | 7 | 20.0% |
| Single-select | 31 | 25 | 80.6% |
| Total | 151 | 50 | — |

## Item-quality and assignment findings

The machine-readable audit evaluates all 151 active questions. These labels are screening inferences for OWNER/content review, not silent reclassification:

- 90 items passed the deterministic screen as `CLEAR`.
- 25 contain wording that can create reverse-interpretation risk.
- 23 contain vague/general terms flagged `AMBIGUOUS`.
- 8 are explicitly context-dependent; 4 have elevated social-desirability risk; 1 was screened as double-barreled.
- 22 question records participate in high-similarity groups.
- Assignment confidence: 104 High, 25 Moderate, 22 Low, 0 Disputed. Single-select confidence evaluates the four one-hot option assignments; Likert confidence evaluates the prompt-to-color assignment. Moderate/Low means “review,” not “wrong.”

Most important duplication finding: nine pairs are exact English duplicates under different UUIDs, plus one near-exact pair about keeping a group moving when others hesitate. Exact duplicates receive independent random-selection probability and can appear together in one attempt because uniqueness is by UUID, not semantics.

The largest semantic ambiguity cluster involves negation/tradeoff wording. Such questions may legitimately be useful, but the current system has no explicit measurement-direction metadata, so a future editor cannot distinguish intentional reverse framing from an accidental classification.

## Coverage findings

The proposed first-pass matrix is in `data/v2-audit/coverage-matrix.json`. It shows broad themes but uneven depth:

- Yellow is concentrated in social interaction and cooperation/support.
- Red has pace/action representation but thin explicit leadership/influence and decision-making coverage.
- Green covers risk/change, decision-making, and planning, but limited explicit detail/accuracy and problem-solving/learning were detected by the conservative classifier.
- Blue has planning/organization and general-preference items, with thinner risk/change, communication, and detail/accuracy coverage than its bank size suggests.
- Single prompts are dominated by generic preference framing; they need more explicit context variety before expansion.
- Work/business, pressure, unfamiliar-situation, leadership, and conflict contexts are not evenly represented across colors.

Taxonomy results are deliberately proposed rather than written into production. Human review is required because short natural-language items can legitimately measure adjacent constructs.

## Does implementation match intended design?

**Yes** for: fixed practical length, 25/25 type composition, exact Likert color quotas, randomized item/order presentation, persisted answers, and deterministic raw-score winner.

**Partially** for: “balanced colors.” Likert exposure is explicitly balanced, while single-select exposure is balanced only through one option per color, not through respondent-independent scoring opportunity or domain/context quotas.

**No/absent** for: domain balance, context balance, selection reproducibility from a seed, normalization, reverse-key metadata, version-bound scoring rules, formal semantic duplicate exclusion, and psychometric monitoring.

## Scoring risks and questions for OWNER

1. Is the Green 7-versus-6 Likert surplus intentional? If so, the rationale should become versioned metadata.
2. Should secondary-color ties follow the database order or the V2 display order?
3. Are exact duplicate UUIDs intentional controls/history, or should future revisions retire duplicates while preserving old attempts?
4. Should negative/tradeoff items remain, and if so should they receive explicit direction/reverse-key metadata?
5. What level of repeat overlap is acceptable (for example, under 25%, rather than today's expected ~51%)?
6. Should future attempt assembly balance domain and context as hard quotas, soft deterministic targets, or exclusion constraints?

## Historical evidence that can legitimately help

Existing assignments and answers can support item response distributions, item/color correlations, selection frequency, completion behavior, score-margin sensitivity, and repeat-attempt stability where a person can be linked without inventing identity. They cannot establish clinical validity, causality, workplace performance, or “correct personality” without external criteria. Analyses must bind every answer to the exact immutable question/option revision used at the time and must not rewrite history.

## Recommended expansion target and staged plan

Recommend a validated target of **about 280 active questions** while keeping attempts at 50:

- approximately 200 Likert (about 50 per color);
- approximately 80 single-select prompts with four governed one-hot options.

At those sizes, expected pairwise overlap falls to roughly 10.7 of 50 (~21%) before semantic-exclusion rules—materially better than ~25.4 today. This target is evidence-based, not a quota to fill blindly.

Staged plan:

1. OWNER reviews taxonomy, Low/Moderate confidence items, duplicates, and scoring-policy questions.
2. Version current definitions immutably; add metadata in draft/revision tables only.
3. Build a first expansion to roughly 220 validated items in the largest coverage gaps.
4. Shadow-test a deterministic assembler that balances color, domain, and context without publishing it.
5. Evaluate selection variance and item behavior using non-destructive historical/new metadata.
6. Expand toward ~280 only where coverage and repeat-exposure evidence justify items.
7. Separately authorize any scoring/selector/content migration, with old/new engine versions preserved per attempt.

## Architecture debt

- V1 and V2 share the engine (good), but UI code independently sorts tied secondary colors (duplication with a discrepancy).
- The canonical SQL function is represented in migrations; production-function drift needs a routine hash/check rather than trust in filenames.
- Content, scoring weights, selection targets, and tie policy are not bound to an explicit engine version on every attempt.
- Selection quotas are hard-coded in SQL rather than governed configuration.
- Randomness is opaque and not seed-replayable.

## Preservation confirmation

This tranche creates documentation, deterministic offline simulations, proposed metadata, and item-audit data only. It does not update Supabase, Vercel, active corpus content, Spanish translations, scoring, selection, authentication, V1/V2 public behavior, Traveler, or historical attempts/results.
