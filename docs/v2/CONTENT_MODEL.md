# V2 Assessment Content Model

## Purpose

V2 separates **what the assessment means** from **how the UI renders it**. Every live question must exist for a documented construct reason, and routine wording edits must be governable through the admin application rather than source-code edits.

## Personality model

The four primary colors remain the stable top-level model:

- RED — driven, decisive, achievement/result oriented.
- BLUE — social, expressive, novelty/freedom oriented.
- YELLOW — caring, compassionate, harmony/relationship oriented.
- GREEN — analytical, structured, precision/predictability oriented.

V2 will add explicit sub-dimensions beneath each color before the corpus is rewritten. These dimensions are content/scoring governance metadata, not new public personality types.

Candidate dimension families for review:

- RED: decisiveness, achievement drive, assertiveness, pace/accountability.
- BLUE: social energy, novelty, spontaneity, expression/enthusiasm.
- YELLOW: empathy, loyalty, harmony, service/support.
- GREEN: analysis, structure, precision, risk awareness.

These are not yet frozen business rules. They are the starting taxonomy for the V2 corpus review.

## Question forms

V2 should support a deliberate mix:

1. **Scenario single-select** — recognizable real-world situation with four believable reactions.
2. **Tradeoff single-select** — two or more socially acceptable tendencies that force preference rather than virtue signaling.
3. **Likert behavioral statement** — retained selectively where a statement is the clearest measurement form.

Question wording should not expose the intended color or make one response obviously more admirable.

## Question metadata

Each governed question should carry:

- canonical ID;
- revision ID;
- qtype;
- active status;
- category/context;
- intended color construct;
- sub-dimension;
- English authority text;
- Spanish reviewed translation;
- scoring metadata;
- difficulty/obviousness review status;
- human-review notes;
- publication status and provenance.

Each option should carry canonical identity, bilingual labels, scoring metadata, and revision provenance.

## Attempt composition

The existing deterministic 50-question composition remains authoritative until V2 composition rules are explicitly accepted.

V2 composition should eventually balance not only color totals but also sub-dimension/context coverage so two randomized attempts are psychometrically comparable rather than merely equal in color count.

## Publication states

`DRAFT -> REVIEW_REQUIRED -> APPROVED -> PUBLISHED -> SUPERSEDED`

Published content is immutable as a revision. A later edit creates a successor revision.

## Analytics feedback loop

Question analytics may identify:

- unusually dominant answer choices;
- weak differentiation between resulting profiles;
- excessive redundancy with other items;
- abandonment concentration;
- tie/margin effects;
- language-specific response divergence requiring review.

Analytics may recommend review, but must not automatically rewrite, rescore, or publish assessment content.
