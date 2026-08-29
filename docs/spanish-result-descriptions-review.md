# Spanish result-description review

This review covers the four long result narratives rendered by the bilingual quiz. Authoritative English remains in `app/quiz/page.tsx`; the proposed Spanish is isolated in `lib/spanishResultDescriptions.ts`. The former Spanish copy is represented by the accepted audit findings and repository history. No production deployment occurred.

## Red

| Review dimension | Finding |
|---|---|
| Authoritative English | Driver/Achiever; motivated by progress, competition, outcomes, visible success and momentum; decisive and responsible, with impatience, weak listening, dismissiveness and team-friction risks. |
| Current Spanish defects | Broken `sinoporque`; masculine respondent assumptions; `top`, `rankings` and `desbloqueo` anglicisms; broken line punctuation; additional claims about raising standards and processing emotion that were not in English. |
| Proposed Spanish | Complete text: `SPANISH_RESULT_DESCRIPTIONS.red` in `lib/spanishResultDescriptions.ts`. |
| Semantic equivalence | Restores all four English strengths and weaknesses, the deadline/morale example, visible-success motive and quiet need for validation without adding or softening traits. |
| Gender neutrality | Uses `las personas de perfil rojo` and neutral noun constructions instead of treating every respondent as male. |
| Valid alternatives | `orientada al logro` and `realizadora` are possible for “Achiever”; the former is broader and more natural in personality copy. `marcadores` and `tableros de resultados` are both valid for “scoreboards”; `marcadores` is more concise. |

## Yellow

| Review dimension | Finding |
|---|---|
| Authoritative English | Stabilizer/Loyalist; motivated by values, fairness, relationships and harmony; dependable, ethical and intuitive, with conflict avoidance, reluctance to lead, enabling and burnout risks. |
| Current Spanish defects | Masculine collective framing; unnatural `se siente por fuera`; broken punctuation; added claims about being the most capable and selfish personalities; `retención` is overly transactional in respondent-facing prose. |
| Proposed Spanish | Complete text: `SPANISH_RESULT_DESCRIPTIONS.yellow` in `lib/spanishResultDescriptions.ts`. |
| Semantic equivalence | Preserves harmony as the goal, loyalty “to a fault,” the four strengths/cautions, and the hidden cost of taking on extra work. Added interpretations were removed. |
| Gender neutrality | Uses `personas de perfil amarillo`, neutral abstractions, and grammatical agreement with `personas`. |
| Valid alternatives | “Emotional glue” may be `vínculo emocional` or `pegamento emocional`; `vínculo` sounds like original Spanish prose. “Retention” may be `permanencia` or `retención`; `permanencia` is more human-centered here. |

## Blue

| Review dimension | Finding |
|---|---|
| Authoritative English | Energizer/Explorer; motivated by experience, connection, stimulation, novelty and freedom; magnetic, adaptable and creative, with follow-through, time-awareness, impulsivity and distraction risks. |
| Current Spanish defects | Masculine collective framing; regional `le meten`; literal `ceguera del tiempo`; `soporte` anglicism; added spreadsheet/decision claim absent from English; inconsistent intensity and awkward `no los microgestione`. |
| Proposed Spanish | Complete text: `SPANISH_RESULT_DESCRIPTIONS.blue` in `lib/spanishResultDescriptions.ts`. |
| Semantic equivalence | Preserves social energy, spontaneity, routine aversion, all four strengths/cautions, and the strong-start/inconsistent-finish example without adding motives. |
| Gender neutrality | Uses `personas de perfil azul` and avoids respondent adjectives requiring masculine/feminine selection. |
| Valid alternatives | “Energizer” can be `dinamizadora` or `animadora`; `dinamizadora` better preserves adding energy without implying entertainment. “Time blindness” can be `poca percepción del tiempo` or `dificultad para calcular el tiempo`; the former stays closest in intensity. |

## Green

| Review dimension | Finding |
|---|---|
| Authoritative English | Analyst/Planner; seeks clarity, logic and predictability; thorough, precise, calm and risk-aware, with analysis paralysis, apparent coldness, rigidity and premature-judgment risks. |
| Current Spanish defects | Masculine collective framing; unnatural `calmos`; added irritation and motive-skepticism claims absent from English; “airtight” rendered as absolute `a prueba de todo`; some strengths were expanded beyond the source. |
| Proposed Spanish | Complete text: `SPANISH_RESULT_DESCRIPTIONS.green` in `lib/spanishResultDescriptions.ts`. |
| Semantic equivalence | Preserves evidence-based decisions, intentional slowing, all four strengths/cautions, and the fast-imperfect-decision example while removing unsupported additions. |
| Gender neutrality | Uses `personas de perfil verde`, neutral nouns, and agreement with the collective referent. |
| Valid alternatives | “Airtight process” may be `proceso sin cabos sueltos` or `proceso sólido`; the former preserves meticulous completeness. “Risk-aware” may be `consciencia de los riesgos` or `atención a los riesgos`; both preserve the construct. |

## Psychometric conclusion

No result narrative contains an irreducible business interpretation. The proposed versions preserve direction, intensity and interpersonal implications. No color becomes more flattering or harsher than its English source. The alternatives above are stylistic rather than construct-changing and do not require owner judgment.
