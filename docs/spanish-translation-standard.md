# Spanish-language source-of-truth standard

English is the semantic source of truth for VIAGO quiz content. Spanish must use neutral, conversational Latin American Spanish and preserve the psychological construct rather than English word order.

- Preserve intensity, frequency, certainty, valence, agency, social desirability, and scoring direction.
- Prefer natural gender-neutral phrasing when possible. Do not use `@`, `x`, or artificial `e` forms.
- Avoid Spain-specific wording, regional slang, unnecessary formality, and untranslated English business jargon.
- Keep the respondent voice, grammatical person, and option-fragment structure consistent. The product uses conversational `tú`.
- Translation may modify only localized fields. It may never change IDs, English, scoring/color metadata, result mappings, selection rules, or historical responses.
- Every new or changed English question, option, instruction, or result narrative requires Spanish semantic review before release.
- AI-generated translations are drafts. They require bilingual human review and are never automatically production-approved.
- Canonical bilingual changes must be source-controlled, baseline-pinned, tested, reviewed, and deployed through a guarded migration or reviewed application release.
