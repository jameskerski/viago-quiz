# VIAGO Spanish corpus audit

Status: complete linguistic review; correction set is review-only and has **not** been applied to production.

## Scope and inventory

The authoritative snapshot contains 151 active questions (120 Likert, 31 single-select) and 124 bilingual answer options. Every row was reviewed. An individual attempt contains 50 questions because the runtime samples 25 Likert questions (6 red, 6 blue, 6 yellow, 7 green) and 25 of the 31 single-select questions from these larger active pools.

The complete row-level corrected corpus is reproducibly generated from the immutable production snapshot and [`data/spanish-corpus-corrections.json`](../data/spanish-corpus-corrections.json). Rows absent from the correction maps are explicit PASS records and retain their current Spanish. The builder emits all 275 database records with English, current Spanish, classification, exact problem, proposed Spanish, rationale, and scoring metadata.

## Findings

Database content: 275 records audited; 183 PASS, 25 MINOR_LANGUAGE_FIX, 14 SEMANTIC_FIX, 52 GENDER_OR_CULTURAL_FIX, and 1 MAJOR_RETRANSLATION. Counts are mutually exclusive in the prepared data artifact. UI/result strings are tracked separately because they are code, not database rows.

Most serious examples:

- “Diffuse it” was translated as “Difundirlo” (to disseminate it). Proposed: “calmar la situación.” This is the sole major retranslation.
- “potential upside” became “potencial de crecimiento,” narrowing a general reward/risk construct to growth. Proposed: “la posibilidad de obtener un gran beneficio.”
- “effective than liked,” “liked than consistent,” and “correct than fast” were rendered as broken past-tense/comparative fragments. The proposed forms restore the intended “X rather than Y” choice.
- “follow-through” became “seguimiento,” which can mean monitoring rather than completing what one starts. Proposed: “llevarlas hasta el final.”
- “if someone else is treated unfairly” shifted into future tense and also contained the misspelling “beneficiandome.”
- Results copy contains the joined word “sinoporque,” broken punctuation, anglicisms, and pervasive avoidable masculine agreement.

## Style and consistency standard

- Use conversational **tú** consistently; never mix `usted` imperatives with `tú` UI copy.
- Prefer neutral constructions (`siento inquietud`, `tengo confianza`, `todas las personas`) over masculine respondent adjectives. Do not use `@`, `x`, or forced `e` endings.
- Preserve first-person stems and option parallelism. Prefer infinitives for answer fragments where the English is a fragment.
- Preserve degree, frequency, valence, agency, and scoring direction. Translate `follow through` as completing/carrying through, `accountability` as assuming/rendir responsabilidad according to context, and `lose steam` as `perder impulso`.
- Prefer broadly understood Latin American terms: `horario` over `cronograma`, `mercadeo en red` over the English phrase in Spanish copy, and `ambiente` over colloquial `vibra`.
- Use `solo` without an accent under current orthography, Spanish ellipsis `…`, and consistent lowercase option fragments.

## Objective vs. interpretive approval

Objective items cover spelling, grammar, broken register, and clear mistranslation. Gender-neutral and semantic refinements are marked interpretive even when strongly recommended, because alternate natural phrasings may be valid. One owner decision remains: approve a full neutral rewrite of the four long result descriptions. The current artifact identifies that code-level work but intentionally does not pretend a short placeholder is deployable paragraph copy. A bilingual psychometric reviewer should approve those descriptions before implementation.

No English item inherently requires a sex/gender distinction. Some English fragments are editorially awkward (`effective than liked`, `liked than consistent`, `correct than fast`), but their intended comparative meaning is recoverable; English remains unchanged.

## Deterministic review command

```sh
node scripts/content/build-spanish-review.mjs \
  /path/to/questions.ndjson \
  /path/to/question_options.ndjson \
  data/spanish-corpus-corrections.json \
  /tmp/viago-spanish-review.json
```

The builder refuses any snapshot whose exact canonical SHA-256 or row counts differ. This prevents corrections from silently applying to a changed corpus. No SQL file is checked into the migrations directory because the long result descriptions require owner/psychometric approval; placing one there would make the package appear deployable when it is not.

The companion `scripts/content/build-spanish-migration.mjs` produces review-only SQL for the 56 question and 36 option changes. Every update is guarded by ID, authoritative English, and existing Spanish, and changes only `prompt_es` or `label_es`. It deliberately excludes UI/result copy, scoring, IDs, composition, and historical records. The generated SQL is not a deployable release until the owner decision above is resolved and the UI corrections are added to the same reviewed release.
