# VIAGO legacy color-result evidence review

Status: **OWNER REVIEW ONLY — NOT RUNTIME AUTHORITY**

Review date: 2026-08-30

Compared model: commit `51a04e9` (`data/v2-proposals/cohort-01-color-model-review.json`)

Production impact: none

## Executive finding

The preserved result narratives confirm the OWNER's broad recollection of the VIAGO model. Red is the outcome-and-action-oriented Driver; Blue is the socially expressive, spontaneous Energizer; Yellow is the values-and-relationship-oriented Stabilizer whose characteristic overextension is conflict avoidance; Green is the evidence-and-structure-oriented Analyst.

The Yellow concern is confirmed. Commit `51a04e9` correctly recorded conflict avoidance as the historical Yellow pattern, but then allowed mature directness to become conditionally color-relevant. The result content treats direct conversation as **growth advice for Yellow**, not as evidence of the core Yellow preference. Directness, healthy boundaries, advocacy skill, or courageous confrontation can be learned by any color and must not score Yellow on their own.

The audit also found narrower unsupported extensions for the other colors: Red change/risk/conflict specifics, Blue story-based communication and conflict-lightening, and Green relationship/leadership/conflict specifics go beyond what the preserved result content establishes. They may be plausible hypotheses, but they are not yet canonical VIAGO meaning.

## A. Exact preserved sources found

Semantic authority, in priority order:

1. `app/quiz/page.tsx:132-255` — the current V1 English result output shown to test takers. It contains each color's core drive, behavioral expression, strengths, challenges, example, and business/industry guidance.
2. `/Users/jameskerski/Documents/ChatGPT/yest/app/quiz/page.tsx:131-254` — a preserved local legacy application copy. A normalized extraction of all four result narratives is byte-for-byte identical to the current V1 narrative extraction (`SHA-256 61e52a132a9855117d44fb9399e6075c981584eca4ca664a485095594aa5ef1e`).
3. Git commit `f44ae0f` (`Initial Viago personality quiz`) — the repository provenance of the result narratives. Yellow, Blue, and Green match the current narrative extraction exactly. Red's later presentation is editorially shorter, but retains the same drive, strengths, weaknesses, example, and industry meaning.
4. `app/results/[sessionId]/page.tsx` — the preserved shareable-result summary: Red progress/challenge/outcomes; Blue experience/people/variety; Yellow people/values/loyalty; Green analysis/caution/structure.
5. `lib/v2/publicContent.ts:16-39` — the accepted V2 concise narratives. These preserve the same four roles and central distinctions; they do not add broader authority beyond V1.
6. `lib/spanishResultDescriptions.ts:1-117` and `docs/spanish-result-descriptions-review.md` — the reviewed Spanish semantic counterpart. The review explicitly identifies the English V1 result content as authority and independently confirms the same drives, strengths, and challenges.
7. `docs/v2/CONTENT_MODEL.md` — a useful top-level summary, but it explicitly labels subdimensions as candidates rather than frozen meaning. It cannot override result output.

Preservation/scoring evidence, not semantic authority:

- `/Users/jameskerski/PCS-Secure/Credential-Registry/VIAGO__ROLLBACK_RETIREMENT__20260829T231712.741Z/MANIFEST.json`
- `/Users/jameskerski/PCS-Secure/Credential-Registry/VIAGO__ROLLBACK_RETIREMENT__20260829T231712.741Z/context/current_live_functions.sql`
- the immutable full database snapshot and six-attempt package in that same retirement archive

The retirement archive contains database state, scoring metadata, answers, and result functions. Its manifest correctly records that there was no dedicated result-narrative table. It therefore corroborates how results were computed and preserved, but supplies no richer behavioral definitions.

Scoped searches of the preserved legacy application, repository documentation, migrated content, result-generation code, and retirement archive found no separate, richer color manual. Existing question assignments were deliberately excluded as primary semantic evidence.

## B. RED — canonical behavioral summary

**Historical role:** Driver / Achiever.

Red is motivated by progress, competition, achievement, visible results, and momentum. It prefers an imperfect but actionable decision over delay when progress is at stake. In groups, Red readily assumes direction, pushes deadlines, negotiates, pursues milestones, and responds to targets, scoreboards, and clear standards.

The legacy material supports decisiveness under pressure, responsibility, ambition, and result focus. It also supports the shadow side: impatience, stopping listening after deciding, dismissiveness, team friction, and steamrolling people in pursuit of the win. Recognition, status, and visible competence matter, even when approval needs are not openly acknowledged.

What the evidence does **not** independently establish is a complete Red doctrine of change, risk appetite, relationship selection, or conflict technique. Direct/assertive communication is consistent with the narrative and OWNER recollection, but the most defensible scoring discriminator is the motive: restoring progress, owning the decision, or securing the outcome—not merely speaking directly, leading, meeting a deadline, or being courageous.

## C. BLUE — canonical behavioral summary

**Historical role:** Energizer / Explorer.

Blue is motivated by experience, connection, stimulation, novelty, freedom, fun, and a socially rich life. It is outgoing, expressive, optimistic, spontaneous, and energized by interaction and new possibility. Blue tends to connect broadly, bring energy to groups, generate enthusiasm, and adapt creatively. It follows leaders who are engaging and humane and resists micromanagement and deadening routine.

The historical challenge pattern is equally clear: repetitive follow-through, time blindness, impulsive decisions, distraction after novelty fades, and strong starts followed by inconsistent finishes unless simple structure helps sustain effort.

The material does not establish storytelling as a defining Blue communication mechanism, nor a specific Blue conflict strategy of lightening, reframing, or avoiding heaviness. Those are hypotheses, not canonical facts. Being friendly, adaptable, creative, or a skilled speaker is not independently Blue; the meaningful preference is energy from novelty, expression, freedom, and broad connection.

## D. YELLOW — canonical behavioral summary

**Historical role:** Stabilizer / Loyalist.

Yellow is motivated by values, fairness, relationships, ethical treatment, harmony, safety, support, and loyalty. It is the emotional glue: attentive to exclusion, discomfort, unmet support needs, and whether leadership treats people well. Yellow does not characteristically seek authority, but cares deeply about who leads and how. It invests for the long term, supports others dependably, and may stay loyal well beyond the point at which other colors leave.

The preserved strengths are dependability, support, integrity, emotional intuition, culture-building, trust, retention, and durable relationships. The overextensions are also explicit: conflict avoidance, reluctance to lead, enabling poor behavior, self-silencing, carrying excess workload quietly, resentment, burnout, and being drained by aggressive personalities.

The legacy result content does not literally label Yellow “introverted” or “soft-spoken,” so those words should not yet become formal scoring rules. They are directionally consistent with not craving authority, quiet burden-carrying, and conflict avoidance, and with OWNER recollection, but require OWNER governance rather than inference. Most importantly, direct confrontation is not Yellow evidence. The result narrative presents direct conversation as a developmental need that counterbalances Yellow's preference—not as the preference itself. Caring directness, supportive boundary-setting, courageous advocacy, and healthy conflict are mature behaviors available to all colors.

## E. GREEN — canonical behavioral summary

**Historical role:** Analyst / Planner.

Green is motivated by clarity, logic, predictability, evidence, defined systems, and clear expectations. It slows the process intentionally to research, analyze, test assumptions, plan, and reduce avoidable risk. Green prefers specifics over emotional momentum or impulse and is comfortable building guidelines, processes, training, and quality controls.

The supported strengths are thoroughness, precision, planning, calm logic in chaos, consistency, and risk awareness. The overextensions are analysis paralysis, rigidity under pressure, appearing cold or critical, and delaying action while seeking certainty. Its growth edge is acting before every unknown has been resolved.

The evidence strongly supports analysis, structure, precision, and risk control. It does not independently define Green as socially selective, establish a complete fact-based conflict technique, or specify leadership through expertise. Those claims may follow plausibly from the core, but should remain hypotheses until OWNER-approved evidence exists. Noticing a missing instruction, checking work, being accurate, or making a careful high-stakes choice is competent behavior, not independently Green.

## F. Four-color comparison matrix

| Dimension | Red | Blue | Yellow | Green |
|---|---|---|---|---|
| Historical role | Driver / Achiever | Energizer / Explorer | Stabilizer / Loyalist | Analyst / Planner |
| Core motive | Progress, achievement, outcome, momentum | Experience, connection, novelty, freedom | Values, fairness, harmony, loyalty, support | Clarity, logic, predictability, evidence |
| Decision preference | Fast, workable direction and closure | Interest, possibility, intuition, spontaneity | People impact, trust, commitments, values | Facts, assumptions, consequences, sufficient evidence |
| Social tendency | Takes charge; status/competence aware | Broadly outgoing, expressive, energetic | Deeply supportive, loyal, attentive to exclusion | Reserved/precise is plausible, but sociability level is not explicitly defined |
| Communication | Concise/direct is consistent; outcome motive is firmer evidence | Expressive and conversational; storytelling specifically unproven | Tactful/supportive is consistent; quiet/soft-spoken is not explicit | Measured, specific, question-led is consistent with analysis |
| Relationship orientation | May put objective above comfort | Connection through shared experience and energy | Long-term trust, safety, belonging, care | Reliability/expectations are plausible but not directly defined |
| Conflict | Can steamroll and discount consultation; complete style not defined | No canonical conflict style established | Characteristically avoids/softens conflict; direct conversation is growth behavior | Facts/process orientation is plausible; complete style not defined |
| Pressure | Decides, controls, pushes the next move | Generates energy/options; may become impulsive or scattered | Stabilizes people, carries load, suppresses disagreement | Adds structure/checks; may slow or rigidify |
| Leadership | Readily takes responsibility and direction | Energizes participation; likes engaging leadership | Does not crave authority; reluctant when rupture is required | Expertise/standards leadership is plausible but not explicit |
| Change | Supports progress; broader change doctrine unproven | Welcomes novelty/possibility, dislikes repetitive implementation | Evaluates people/continuity is plausible but not explicit | Needs rationale, clarity, and bounded uncertainty |
| Risk | Outcome/competition can invite risk, but appetite is not explicitly defined | Impulsivity is supported; risk motive is not fully defined | People-harm caution is plausible but not explicit | Risk awareness and consequence checking are explicit |
| Planning/execution | Goals, milestones, action, momentum | Flexible start; weak repetitive follow-through | Dependable support is explicit; planning style is not | Steps, systems, standards, contingencies, checks |
| Characteristic overextension | Impatience and steamrolling | Impulsivity and inconsistency | Conflict avoidance, enabling, burnout | Analysis paralysis and rigidity |
| Growth edge | Develop people and listen without losing momentum | Add simple structure for sustained follow-through | Have direct conversations without abandoning care | Act with incomplete certainty |

## G. Differences from commit `51a04e9`

Legend: `ALIGNED`, `PARTIALLY_ALIGNED`, `SEMANTIC_DRIFT`, `CONTRADICTED`, `NOT_ESTABLISHED_BY_LEGACY_CONTENT`.

| Dimension | Red | Blue | Yellow | Green |
|---|---|---|---|---|
| Core motivations | ALIGNED | ALIGNED | ALIGNED | ALIGNED |
| Decision style | ALIGNED | PARTIALLY_ALIGNED | PARTIALLY_ALIGNED | ALIGNED |
| Communication style | PARTIALLY_ALIGNED | PARTIALLY_ALIGNED — story orientation unproven | PARTIALLY_ALIGNED — quiet/soft-spoken not explicit | PARTIALLY_ALIGNED |
| Relationship orientation | PARTIALLY_ALIGNED | ALIGNED | ALIGNED | NOT_ESTABLISHED_BY_LEGACY_CONTENT |
| Conflict response | PARTIALLY_ALIGNED | SEMANTIC_DRIFT | SEMANTIC_DRIFT — growth directness was allowed to act as color evidence | PARTIALLY_ALIGNED |
| Pressure response | ALIGNED | PARTIALLY_ALIGNED | ALIGNED | ALIGNED |
| Leadership/followership | ALIGNED | PARTIALLY_ALIGNED | PARTIALLY_ALIGNED | NOT_ESTABLISHED_BY_LEGACY_CONTENT |
| Approach to change | PARTIALLY_ALIGNED | ALIGNED | NOT_ESTABLISHED_BY_LEGACY_CONTENT | PARTIALLY_ALIGNED |
| Approach to risk | NOT_ESTABLISHED_BY_LEGACY_CONTENT | PARTIALLY_ALIGNED | NOT_ESTABLISHED_BY_LEGACY_CONTENT | ALIGNED |
| Planning/execution | PARTIALLY_ALIGNED | ALIGNED | NOT_ESTABLISHED_BY_LEGACY_CONTENT | ALIGNED |
| Strengths | ALIGNED | ALIGNED | ALIGNED | ALIGNED |
| Overextensions | ALIGNED | ALIGNED | ALIGNED | ALIGNED |
| Confusion zones | NOT_ESTABLISHED_BY_LEGACY_CONTENT | NOT_ESTABLISHED_BY_LEGACY_CONTENT | NOT_ESTABLISHED_BY_LEGACY_CONTENT | NOT_ESTABLISHED_BY_LEGACY_CONTENT |
| Nonqualifiers | Governance rule, not legacy claim | Governance rule, not legacy claim | Governance rule, not legacy claim | Governance rule, not legacy claim |

No major `51a04e9` claim was found to be flatly `CONTRADICTED`; the problem is narrower but important: plausible extensions were stated with more certainty than the preserved result evidence supports. Yellow directness crosses from unsupported extension into semantic drift because the legacy narrative places direct conversation on the growth side of the preference.

## H–I. Concern and other semantic drift

**Yellow concern: confirmed.** The stable core is caring, loyal, values-centered, supportive, harmony-seeking, and generally conflict-averse. Learned directness cannot independently distinguish Yellow.

Other drift or overreach:

- **Red:** “changes course before consensus” and aggressive/calculated risk are not established result meanings.
- **Blue:** story-first explanation and conflict-lightening/avoidance are not established result meanings.
- **Green:** selective relationships and leadership-through-expertise are not established result meanings; fact/process conflict is only a core-derived hypothesis.

## J. Cohort 01 items requiring reconsideration

No proposal is approved or rewritten by this review. The following `51a04e9` recommendations relied materially on drifted or unsupported extensions and must be reopened:

| Proposal ID | Why it is affected | Required next review question |
|---|---|---|
| `C01-L-R-04` | Treats changing course before agreement as established Red | Can it measure outcome/momentum preference without equating Red with bypassing consensus? |
| `C01-L-R-05` | Contrasts Red with emotional processing using an inferred relationship/emotion doctrine | Is the tradeoff truly outcome motive, or merely emotional insensitivity? |
| `C01-L-B-01` | Treats story/example-first communication as canonical Blue | Is story use preference evidence-backed or learned communication skill? |
| `C01-L-B-04` | Relied on an unestablished “expressive precision” construct | Rejection remains prudent; do not reuse that construct without new authority. |
| `C01-L-Y-01` | Makes mature directness conditionally Yellow | Remove directness as evidence; a relationship-protection motive alone may still be socially desirable. |
| `C01-L-Y-03` | Boundary-setting is learned behavior, not core Yellow | Rejection remains supported; do not rehabilitate it as Yellow evidence. |
| `C01-S-04` | Encodes an unsupported Blue conflict reset and inferred cross-color mistake responses | Rebuild only after conflict dimensions are governed. |
| `C01-S-05` | Encodes conflict/facilitation styles not fully established for any color | Keep ambiguous and reopen after model approval. |
| `C01-S-06` | Encodes Yellow shared-support and other color-specific learning styles absent from result content | Do not treat learning modality as established color meaning. |

The remaining 15 items still require ordinary social-desirability and discrimination review, but this audit did not find a direct semantic conflict requiring immediate reclassification. In particular, `C01-L-B-03`, `C01-L-Y-02`, and `C01-L-G-01` retain competence/context concerns already recorded in `51a04e9`; those are calibration problems rather than newly discovered color drift.

## K. Recommended permanent source of truth

Create an OWNER-approved, versioned **VIAGO Behavioral Color Model** as governed domain data, separate from questions and result prose. Until OWNER approval, this document remains evidence only.

Recommended architecture:

1. A human-readable canonical specification plus a machine-readable schema with `model_version`, lifecycle status (`DRAFT`, `OWNER_APPROVED`, `RETIRED`), approval evidence, effective date, and immutable source hashes.
2. Per-color claims split into: core motivations; preference tendencies; observable indicators; strengths; overextensions; cross-color discriminators; explicit nonqualifiers; growth/coaching behaviors; and claims not yet established.
3. Every claim carries evidence references and an evidence status. “Core preference” and “mature/learned behavior” must be distinct fields.
4. Questions and revisions reference the approved `color_model_version` and the exact discriminator they are intended to measure. Questions never define the model by majority vote.
5. Result narratives, Spanish translations, coaching/sales/recruiting material, scoring audits, and AI-assisted writing all reference the same approved model version. Translation is semantic representation, not a parallel model.
6. Assessment attempts record engine, corpus, scoring, result-narrative, and color-model versions so future audits can reproduce what a test taker saw.
7. Publishing fails closed when a proposed item cites an unapproved dimension or conflates a nonqualifier/growth behavior with core preference.

## L–M. Artifacts and production confirmation

Artifacts created:

- this OWNER-readable evidence review;
- `data/v2-proposals/legacy-color-model-comparison.json`, a machine-readable review index and Cohort 01 impact list.

No production database, deployed application, result content, question, score, selector, or runtime configuration was changed. Cohort 02 was not generated. No Cohort 01 proposal was activated or rewritten.
