# Proposed VIAGO question taxonomy

This is a maintainable review vocabulary for expanding the bank. It is a proposal, not an OWNER-approved reclassification and not a production migration.

## Principles

- Preserve `canonical_question_id` forever; publish changes as immutable revisions.
- Separate **what an item measures** from **how it scores**.
- Keep one primary behavioral domain and one primary context, with optional secondary tags only when necessary.
- Record measurement direction explicitly. Natural negative wording is not automatically reverse-scored.
- Use controlled vocabularies small enough for OWNER review and deterministic selection.
- Bind every attempt to an engine version and content revision so old results remain reproducible.

## Minimum item metadata

| Field | Purpose |
| --- | --- |
| canonical ID + revision ID | permanent identity and immutable version |
| publication state | draft, review, approved, published, retired |
| item type | Likert or single-select; future types require separate authorization |
| scoring key | Likert color/direction or per-option weights |
| behavioral domain | primary construct the wording presents |
| context | situation the respondent should imagine |
| measurement direction | behavior represented by stronger endorsement |
| intensity | mild, moderate, strong |
| review classification/reason | KEEP, LIGHT_REWRITE, FULL_REWRITE, RETIRE_CANDIDATE, DEFER |
| quality flags | ambiguity, double-barrel, context, desirability, overlap, reverse interpretation |
| assignment confidence | High, Moderate, Low, Disputed |
| semantic family | groups variants/near-duplicates for exclusion during assembly |
| language-review state | independent English and Spanish approval/version |

## Proposed behavioral domains

Use these 16 first-pass domains; merge after OWNER review if inter-rater use proves unreliable:

1. decision-making
2. pace/action
3. planning/organization
4. risk/change
5. conflict
6. communication
7. social interaction
8. leadership/influence
9. cooperation/support
10. detail/accuracy
11. rules/process
12. stability/security
13. competition/achievement
14. emotional expression
15. problem solving/learning
16. independence/follow-through

`general-behavioral-preference` is permitted only as a temporary audit fallback; a publish-ready item should be specific enough to receive a governed domain.

## Proposed contexts

- personal preference
- work/business
- team
- leadership
- social
- communication
- conflict
- pressure
- planning
- unfamiliar situation

Avoid embedding “work” by default. Where behavior is expected to vary materially across work/family/social settings, make the context explicit or classify the item for rewrite.

## Deterministic future assembly

The minimum inspectable algorithm should:

1. select a published engine/content version;
2. validate sufficient eligible pools;
3. allocate fixed color/type targets;
4. allocate domain targets within color;
5. apply context-diversity floors/caps;
6. exclude multiple items from the same semantic family;
7. use a cryptographically suitable stored seed to choose among equally eligible items;
8. persist seed, candidates/version, selected IDs, positions, and option order;
9. fail closed when constraints cannot be satisfied—never silently relax them;
10. grade with the attempt's bound engine version.

This remains deterministic and auditable without AI runtime selection.

## Quality review workflow

Machine flags are triage only. Two human passes should separately answer:

1. Does ordinary language admit one intended behavioral interpretation?
2. Is the proposed color/direction semantically justified?

Disagreements should be retained as review evidence. No content or scoring key becomes publishable merely because a classifier assigned metadata.

## Measurement roadmap

Future reports may calculate response distribution, missingness, item-total correlation by color/domain, selection frequency, repeat stability, and score-margin sensitivity. Label all outputs FACT, INFERENCE, HYPOTHESIS, or RECOMMENDATION. Do not describe descriptive statistics as scientific validation.
