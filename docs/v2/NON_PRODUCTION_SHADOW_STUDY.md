# VIAGO V2 Non-Production Shadow Study

## Executive Summary

- **Decision: `CURRENT_206_POOL_SUFFICIENT_FOR_HUMAN_VALIDATION`.** Design B/capped is mechanically sound enough for a paired human study. Another content cohort is not justified before response evidence identifies a real measurement gap.
- **The Green opportunity concern is confirmed as a bounded structural sensitivity.** Current attempts always offer Green one extra Likert item: four additional maximum points and two additional points under a uniform-neutral response model. Six-sevenths Green scaling changed the historical winner in 47 of 1,259 completed attempts (3.73%), all of them near ties.
- **Weak legacy exposure is materially lower under Design B.** Historical completed attempts averaged 13.27 weak-flagged questions and every attempt exceeded the five-item research cap. Design B averaged 4.99 and never exceeded five while retaining at least 12 domains, eight contexts, and zero within-attempt semantic-family collisions.
- **Computational evidence cannot establish result validity or agreement.** Respondents never answered the alternative Design B questions, so answers cannot be projected. Recognizability, retest stability, ambiguity, gameability, and dominant/secondary agreement require the proposed randomized paired human study.

## A. Stale Test Correction and Full Suite Status

The obsolete Cohort 02 test was corrected to reflect the governed state: Cohort 03 exists as an OWNER-approved development cohort but remains isolated from runtime. The historical Cohort 02 artifact still truthfully records that it did not itself generate or authorize Cohort 03. Runtime-isolation assertions now cover Cohort 03 as well.

Repository status after correction:

- tests: **70/70 passing** after adding four shadow-governance tests;
- TypeScript: passing;
- governance validation: passing;
- research validators and deterministic manifest replay: passing.

No unrelated assertion was weakened.

## B. Shadow Study Method

The analysis used the immutable retirement archive exported August 29, 2026. All five required gzip source checksums matched the accepted archive manifest before analysis. The six rollback-only attempts marked `ARCHIVE_ONLY_DO_NOT_MERGE` were excluded.

Study populations:

| Population step | Attempts |
|---|---:|
| Archived attempts after six rollback-only exclusions | 1,972 |
| Exact current 50-question shape | 1,940 |
| Exactly 50 unique assigned answers | 1,259 |

The 1,259 completed attempts are immutable observational evidence. Stored answers and results were never updated or replaced. Current-selection overlap was measured chronologically. Result sensitivity was calculated in memory from preserved answers and scoring metadata, then discarded; only aggregate findings were saved.

Design B mechanics use the accepted 5,000-attempt simulation from bank `research-bank-2b2ea69c8694a63a` and assembler `viago-research-assembler-1.0.0`.

## C. Computationally Proven Findings

1. Current random selection does **not** vary color-opportunity counts: every conforming attempt has 25 single-select questions and Likert quotas of 6R/6B/6Y/7G.
2. Current question identity varies substantially, but not enough to prevent high repeat exposure: adjacent historical attempts shared 25.47 questions on average, closely matching the independent 25.43 simulation baseline.
3. Design B reduces simulated adjacent overlap to 16.09 while enforcing equal Likert opportunities and zero within-attempt semantic duplication.
4. Historical completed attempts contained 6–20 weak-flagged legacy items; Design B caps this at five.
5. Every simulated Design B attempt met the domain, context, workplace, weak-item, uniqueness, and semantic-family constraints.
6. Historical result ordering under an alternative unasked question set cannot be computed. Selection variation's causal effect on a respondent's result is therefore **not established**.

## D. Green Opportunity and Bias Analysis

Current architecture provides:

- Red/Blue/Yellow theoretical maximum: 124 each;
- Green theoretical maximum: 128;
- Red/Blue/Yellow uniform-neutral expectation: 37 each;
- Green uniform-neutral expectation: 39.

Among the 1,259 completed historical attempts, Green was the recorded-rule winner 427 times (33.9%). This winner share is descriptive and cannot by itself prove bias because respondent traits and item behavior are not controlled.

Two sensitivity checks bound the structural concern:

| Diagnostic | Winner sensitivity | Full-order sensitivity |
|---|---:|---:|
| Scale Green Likert subtotal to six-sevenths | 47 attempts (3.73%) | 145 (11.52%) |
| Remove each observed Green Likert answer in turn | 316/8,813 counterfactuals (3.59%) | 1,012/8,813 (11.48%) |

Six-sevenths scaling moved 47 Green winners: 29 to Yellow, 12 to Red, and six to Blue. These are sensitivity diagnostics—not corrected results, Design B rescoring, or evidence that the historical result was wrong.

## E. Tie and Near-Tie Sensitivity

The historical top-score margin was:

- exact raw-score tie: 25 attempts (1.99%);
- top margin ≤4 points: 218 attempts (17.32%);
- median margin: 14 points;
- mean margin: 18.92 points.

All 47 six-sevenths winner changes occurred among the 218 near ties, affecting 21.56% of that group and 3.73% overall. At least one possible observed-Green omission changed the winner for 60 attempts—27.52% of near ties and 4.77% overall.

The imbalance is therefore not a broad reversal of established results; it is a meaningful boundary effect when the leading colors are already close.

## F. Weak-Legacy-Item Analysis

Historical completed attempts averaged 13.27 weak-flagged questions (median 13; 95th percentile 17; maximum 20). Every completed attempt exceeded the proposed cap of five. Weak questions contributed an average 22.09% of awarded points, with a 95th percentile of 29.55%.

Removing every weak answer in memory changed the winner in 136 attempts (10.8%). This must not be read as proof that 136 stored results are wrong: wholesale removal changes opportunity counts and the weakness designation combines audit concerns rather than empirical item performance.

Design B/capped materially bounds exposure without destroying breadth:

- weak items: mean 4.99, maximum five;
- domains: mean 15.89, minimum 12;
- contexts: mean 8.72, minimum eight;
- semantic-family collisions: zero;
- workplace questions: mean 7.77, maximum eight.

## G. Design B Selection Distribution

Across 5,000 Design B attempts, the average source composition was:

- legacy: 32.95 questions;
- Cohort 01: 3.54;
- Cohort 02: 7.39;
- Cohort 03: 6.12.

All 206 questions were selected. Question-frequency coefficient of variation was 0.573 versus 0.731 in the current-production simulation. Constraints therefore improve—but do not equalize—selection distribution.

This inequality is expected: question type/color quotas, the weak cap, semantic exclusions, and the workplace cap produce different eligibility rates. Selection frequency should be monitored during human validation rather than force-equalized at the expense of assembly quality.

## H. Domain and Context Distribution

No simulated attempt failed the governed diversity floors. The five lowest average domain counts were:

| Domain | Questions per attempt |
|---|---:|
| Independent follow-through | 1.33 |
| Emotional expression | 1.46 |
| Detail/accuracy | 1.58 |
| Rules/process | 1.70 |
| Competition/achievement | 1.75 |

The sparsest normalized contexts were leadership (0.09), communication (1.16), pressure (1.60), conflict (2.23), and unfamiliar situations (3.43). These are metadata concentrations, not demonstrated measurement failures. Leadership behavior also appears inside team/work contexts, so the narrow `leadership` context count should not be treated as total leadership coverage.

The current bank is broad enough to assemble diverse attempts. Human response evidence should determine whether any sparse domain needs more items.

## I. New-Candidate Selection Frequency

The 55 candidates averaged a 31.0% selection rate per Design B attempt, ranging from 11.7% to 49.2%.

The most frequent candidates are situational single-select items, led by:

- `C03-S-12`: 49.2%;
- `C03-S-05`: 48.18%;
- `C03-S-02`: 47.58%;
- `C02-S-04`: 47.44%;
- `C02-S-01`: 47.20%.

This is primarily a format-pool effect: Design B draws 26 of 62 single-select questions (41.9%) on every attempt, and some alternatives become ineligible through semantic/workplace constraints. The highest rate is 7.3 percentage points above the unconstrained single-pool expectation—worth monitoring, but not evidence that another cohort is required before testing.

The least selected candidates are chiefly workplace/team Likert items affected by the eight-question workplace cap and same-family exclusions. Their low frequency is consistent with the intended ordinary-life balance.

## J. Repeat and Diversity Findings

| Metric | Current historical | Design B/capped | Change |
|---|---:|---:|---:|
| Total overlap | 25.47 | 16.09 | −36.8% |
| Single-select overlap | 20.19 | 11.23 | −44.4% |
| Likert overlap | 5.28 | 4.85 | −8.1% |

Design B materially reduces repetition while retaining governed breadth. Two attempts still share about 16 questions on average; a 50-question assessment drawn from 206 constrained items cannot eliminate overlap. The key improvement is that exact repetition falls while no attempt duplicates a governed semantic family internally.

## K. Limits of What Historical Data Can Prove

Historical data can prove composition, exposure, score margins, stored-rule results, audit-flag exposure, and counterfactual sensitivity to mathematical opportunity changes.

It cannot prove:

- how the same person would answer unseen Design B questions;
- direct legacy-versus-Design-B dominant/secondary agreement;
- whether either result is more recognizable or accurate;
- retest reliability;
- item discrimination or scale calibration;
- whether respondents find candidates clearer, less repetitive, or harder to game;
- clinical, diagnostic, employment-selection, or population validity.

Answers were not fabricated or projected onto unasked questions. No stored result was rescored.

## L. Proposed Human Validation Protocol

Do not launch without separate OWNER approval.

### Population

- 40–60 experienced VIAGO users, using their prior color understanding as recognition context—not ground truth;
- 80–120 new test takers without prior-model anchoring.

### Paired crossover

1. Randomly assign half of each population to legacy-first and half to Design-B-first.
2. Keep 48–72 hours between the initial paired assessments.
3. Do not label which version is legacy/research until both are complete.
4. Store Design B bank version, assembler version, seed, manifest, option order, and type-separated scores.
5. Have at least 60 balanced participants repeat Design B after 14–21 days with a fresh seed.

### Feedback and endpoints

Collect per-item flags for ambiguity, two equally true answers, obvious desirability, repetition, and “none fit.” Collect post-assessment recognition, clarity, repetition, gameability, and effort ratings.

Analyze descriptively:

- dominant exact agreement;
- ordered and unordered dominant/secondary agreement;
- four-color rank correlation;
- score-margin movement;
- Design B retest stability;
- item response and ambiguity rates;
- completion time and abandonment;
- experienced-versus-new differences.

Before launch, pre-register minimum usable sample, primary endpoints, agreement/ambiguity decision thresholds, missing-data rules, and exclusions. Do not claim clinical psychometrics.

## M. Content-Sufficiency Decision

**`CURRENT_206_POOL_SUFFICIENT_FOR_HUMAN_VALIDATION`**

The bank already produces 50-question manifests meeting every mechanical diversity requirement, reduces repeat overlap substantially, caps weak legacy exposure, and provides equal color opportunity. The remaining uncertainty is respondent behavior—not a demonstrated shortage of questions.

Do not generate Cohort 04 before human validation. Treat independent follow-through, emotional expression, detail/accuracy, rules/process, and competition/achievement as monitoring domains. Expand only if item-response evidence, ambiguity feedback, or selection scarcity demonstrates a specific need.

## N. Remaining OWNER Decisions

Before any human study:

1. approve the participant ranges and recruitment source;
2. approve randomized order and timing intervals;
3. define primary success thresholds for dominant/secondary agreement, retest stability, and ambiguity;
4. decide whether participants may see result narratives between paired assessments;
5. approve consent/privacy language and data-retention rules;
6. decide whether Design B should remain entirely offline or receive a separately isolated research interface;
7. approve how candidate scoring telemetry may be retained without creating production authority.

## O. Zero Production Changes

Zero production changes were made. The 55 candidates remain inactive. Production selector `pick_balanced_questions_50(uuid)`, production scoring, active corpus, database, Vercel, V1/V2 public assessment behavior, Traveler, Spanish content, and historical attempts/results were not modified. Design B was not deployed.

## Caveats and Assumptions

- Historical evidence comes from the accepted immutable rollback-retirement archive, not a live production query. The six rollback-only attempts were excluded; target-only attempts created after the archive are outside this cohort.
- Completed-attempt analysis covers 1,259 of 1,940 structurally conforming attempts (64.9%). It may reflect completion-related selection effects.
- “Weak” is an audit classification, not an empirically validated bad-item label.
- The Green sensitivity models remove or rescale observed contributions; neither reproduces Design B's additional single-select question or unseen candidate responses.
- Domain/context conclusions depend on governed metadata whose categories may be refined in later versions.
