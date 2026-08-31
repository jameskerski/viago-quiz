# VIAGO Canonical Bank Reconstruction — Batch 01 Handoff

## A. Metadata Model Created

`VIAGO_CANONICAL_QUESTION_METADATA_V1` separates immutable question identity from immutable revision identity and records origin, format, proposed status, scoring target, core traits, domain, context, tone, tradeoff, orientation, semantic family, pairwise discrimination, quality risks, historical evidence, and OWNER state.

Approved revisions are never edited in place. A reword creates a new revision linked to its predecessor. Replacement preserves both the legacy identity and the candidate identity. Every status remains proposed/non-runtime until separate OWNER approval.

## B. Normalized Taxonomies

The proposed taxonomy uses:

- 26 color-specific core traits grounded in Behavioral Color Model V1.0;
- 18 behavioral domains;
- 17 life contexts;
- 16 situational tones;
- seven orientations;
- six pairwise color-discrimination relationships.

Important normalization boundaries:

- fairness is not an independent Yellow trait;
- introversion and sociability are not independent color traits;
- Red is not defined by generic risk appetite;
- competence, courage, kindness, intelligence, accuracy, directness, and organization are not independently diagnostic;
- concrete ordinary-life context is preferred when it reveals the same motive without occupational dependence.

## C. Review Batch 01

Batch 01 contains the first 25 canonical legacy identities in the stable order of `current-question-audit.json`. The full OWNER-readable review—including current wording, proposed wording/options, decision, mapping, construct, context, tradeoff, and rationale—is in `CANONICAL_BANK_REVIEW_BATCH_01.md` and the machine-readable equivalent is `review-batch-01.json`.

## D. Counts

| Disposition | Count |
|---|---:|
| KEEP_EXACTLY | 3 |
| REWORD | 8 |
| REPLACE | 9 |
| RETIRE | 5 |

Only 3 of 25 legacy questions comfortably meet today's exact-wording standard. Seventeen preserve a valuable measurement through rewording or an already reviewed replacement; five do not currently earn future-bank admission.

## E. Early Coverage Observations

- **Self-preference dominates:** 16 of 25 items primarily ask what the respondent prefers. Only six substantially engage interpersonal/response-to-others orientation. Attention, preferences in others, and mixed orientation are sparse or absent.
- **General and work contexts dominate:** 11 are general/cross-context and five are work/business. The proposed replacements introduce household, family, close relationships, and free time without forcing context variety for its own sake.
- **Organization/process and relationship/support recur frequently:** each accounts for four reviewed items. This is an early signal, not yet a full-corpus overmeasurement conclusion.
- **Change items need motive discipline:** generic adaptability, worry, or considerate implementation does not establish a color. Revised/replacement items distinguish momentum, possibility, continuity, and clarity.
- **Pairwise coverage is present but not equal:** among non-retired proposals, counts range from nine Red/Blue opportunities to 14 Red/Green opportunities. Counts alone do not establish item quality.
- **Candidate replacements are doing useful work:** nine legacy items have a materially stronger OWNER-reviewed candidate, avoiding unnecessary rewrites and preserving semantic traceability.

## F. OWNER Questions

1. **Taxonomy granularity:** approve the proposed separation of `organization-process` and `planning`, or direct that they be merged before Batch 02.
2. **General context:** approve `general-cross-context` as a legitimate context when abstraction is necessary, with a continuing preference for concrete ordinary-life settings.
3. **Fairness boundary:** confirm that fairness remains non-diagnostic by itself and only becomes Yellow evidence when the item exposes trust, loyalty, harmony, support, continuity, or belonging.
4. **Replacement semantics:** confirm that a legacy single-select may be replaced by a stronger single-select measuring the same family even when the scenario changes materially.
5. **Item 09:** confirm whether the exact “ideal workday” item is sufficiently balanced for `KEEP_EXACTLY`, or whether its compound Blue/Green options should receive one later wording pass.

No color-model contradiction blocks Batch 01. These questions tune taxonomy governance and the strictness of exact-wording admission.

## G. Artifact Locations

- metadata schema: `data/v2-governance/canonical-question-metadata-schema-v1.json`
- normalized taxonomies: `data/v2-governance/canonical-question-taxonomies-v1.json`
- machine-readable Batch 01: `data/v2-reconstruction/review-batch-01.json`
- OWNER-readable Batch 01: `docs/v2/CANONICAL_BANK_REVIEW_BATCH_01.md`
- deterministic builder: `scripts/v2/build-canonical-bank-batch-01.mjs`
- validator: `scripts/v2/validate-canonical-bank-batch-01.mjs`

## H. Validation Status

- deterministic artifact replay: passed;
- metadata/schema validation: passed;
- exactly 25 stable legacy identities: passed;
- disposition reconciliation 3/8/9/5: passed;
- replacement traceability: passed;
- taxonomy/value validation: passed;
- runtime-isolation tests: passed;
- full repository suite, typecheck, governance, and lint: passed.

## I. Zero Production Changes

Zero production changes were made. No active question, database row, selector, scoring rule, result narrative, Spanish content, historical attempt/result, Vercel deployment, V1/V2 runtime, or Traveler data changed. No candidate was activated and Cohort 04 was not generated.
