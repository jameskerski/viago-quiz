# VIAGO Personality Quiz V2 — Approved UI Reference

The V2 kickoff concept board is approved as the visual direction for the following interfaces.

## 1. Home screen
- Premium dark VIAGO presentation rather than the current immediate redirect into the quiz.
- Strong hero message focused on discovering natural personality.
- Primary Start Quiz action.
- Language choice remains available.
- Public social-proof counter based on **completed assessments**.
- Four-color personality language may be teased without exposing enough scoring logic to prime answers.
- A discreet settings/admin entry must exist without becoming a prominent public CTA.

## 2. Question and answer screen
- One question at a time.
- Strong readable question hierarchy.
- Answer choices as distinct touch-friendly cards.
- Clear progress through 50 questions.
- Mobile-first behavior equivalent to the approved desktop treatment.
- Natural scenario-style wording is preferred over obvious personality-test statements.
- Presentation must not expose the color/scoring assignment behind an answer.

## 3. Result screen
- Primary personality receives strong visual emphasis.
- All four scores remain visible so the result is a profile, not only a winner label.
- Four-color visualization is approved as the central graphic direction.
- Result narrative should support primary and eventually secondary-color interpretation.
- Sharing and historical result-link compatibility remain first-class requirements.

## 4. Admin analytics
- Separate authenticated screen, not public.
- Core metrics: completed assessments, starts, completion rate, result distribution, language mix, activity over time, score/tie/margin health, and question-health analytics.
- Analytics must derive from canonical quiz data and deterministic definitions.

## 5. Admin question/content management
The admin area must make routine content maintenance possible without opening Codex or editing source files.

Required capabilities:
- Search/filter questions.
- View qtype, category/dimension, scoring/color metadata, English, Spanish, and options.
- Edit English question text and answer labels.
- Edit Spanish translations under the existing translation governance standard.
- Create/deactivate questions and options under guarded business rules.
- Validate balance/coverage before publication.
- Draft -> review -> publish lifecycle.
- Immutable publication/audit history identifying what changed and when.
- Preview exactly how a question will render before publishing.

Direct live-row editing from an admin form is **not** the V2 design. Content editing must produce a reviewable draft/version and publication action so an accidental edit cannot silently alter the live assessment.

## Visual reference artifact

The approved generated concept board has been preserved outside conversational memory in the OWNER's Google Drive:

- File: `VIAGO Personality Quiz V2 - Approved Concept Board.png`
- Drive file ID: `1uFF8ldqps8jmvIv2414YO6R_zS-QhuSW`
- Reference URL: `https://drive.google.com/file/d/1uFF8ldqps8jmvIv2414YO6R_zS-QhuSW/view?usp=drivesdk`

A repository-local binary copy may also be added later at:

`docs/v2/assets/viago-v2-approved-concept-board.png`

The written contract in this file is authoritative for implementation details where generated concept artwork contains decorative/demo values that are not real product requirements (for example sample countries, completion time, or invented analytics values).
