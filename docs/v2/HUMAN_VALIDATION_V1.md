# VIAGO V2 private human validation v1

Status: OWNER-authorized private Preview research. This is not production assessment authority and makes no clinical or scientific-validity claim.

## Architecture and flow

The existing V2 admin password protects both `/v2/validation` and `/v2/admin/validation`. The participant flow is setup → deterministic 50-question assessment → research result → overall feedback. The OWNER dashboard reads only the isolated validation tables. No production attempt, question, answer, result, selector, or score table participates.

The first build deliberately supports private OWNER use without recruitment, email, cohort management, or additional infrastructure. An experienced participant can record a known dominant and optional secondary color; a new participant leaves both unknown. A stable participant code links retests without requiring personal information.

## Frozen versions

- Bank: `viago-validation-bank-183-v1.0.0`
- Bank artifact: `data/v2-research/validation-bank-183-v1.0.0.json`
- Assembler: `viago-validation-assembler-v1.0.0`
- Scoring: `viago-validation-scoring-equal-opportunity-v1.0.0`
- Semantic authority: `VIAGO_BEHAVIORAL_COLOR_MODEL_V1_0`

The bank artifact contains 183 exact question revisions (93 Likert, 90 single-select) and a SHA-256 content hash. Any wording, mapping, or option change requires a new immutable bank version. Each attempt stores the bank/version/hash, assembler version, scoring version, seed, complete private manifest, exact question revision IDs, exact option order, and manifest hash.

## Assembly and scoring binding

The deterministic SHA-256 counter assembler selects 26 single-select plus 24 Likert questions, exactly six Likert opportunities per color. It enforces one exact semantic family per attempt, at most three broad-construct items, at most eight work items, at most 18 general-context items, and at most 22 self-preference items. No AI runs during selection.

Validation scoring is explicitly research-only: every color begins at 104, six Likert responses contribute 1–5, and each of the 26 single-select choices contributes four points to its mapped color. Every color therefore has the same theoretical range of 110–134. Deterministic tie order is Red, Blue, Yellow, Green and remains versioned for analysis; it is not production scoring authority.

## Feedback and retests

Overall feedback records 1–5 self-recognition, primary/secondary correctness, perceived repetition, naturalness, and optional notes. Any item may be flagged as confusing, two answers true, no answer true, obvious best answer, context-dependent, repetitive, or other.

Retests create new attempts and never overwrite prior evidence. The practical initial interval is 14–21 days. The dashboard reports dominant/secondary agreement, score vectors and margins, mean question overlap, elapsed time, exact versions, and item-flag frequency. Stored manifests permit later semantic-family overlap calculations without reconstructing mutable content.

## Isolation and security

`validation_participants`, `validation_attempts`, and `validation_feedback` are additive tables in `viago_quiz`, use RLS, and grant no access to `PUBLIC`, `anon`, or `authenticated`. Only the existing server-side `service_role` client can access them, and every route additionally requires the V2 admin session. Completed attempts are database-trigger immutable. Participant responses never expose color, domain, semantic-family, mapping, or scoring metadata in browser payloads.

Production V1 and the accepted V2 public Home → Quiz → Results flow remain unchanged. The validation migration does not alter their tables, functions, content, selector, scores, routes, or runtime behavior.
