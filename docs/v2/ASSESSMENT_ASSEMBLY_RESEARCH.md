# VIAGO V2 Assessment Assembly Research

## Executive Summary

- **Recommended research design:** advance `B_EQUAL_24L_26S` with `CAPPED` legacy admission to shadow/research testing. It selects 26 single-select questions and 24 Likert questions—six per color—while permitting no more than five weak legacy items, eight workplace items, or one item from any semantic family.
- **Repeat exposure improves materially:** across 5,000 simulated attempts, expected overlap between adjacent attempts fell from 25.43 questions under the current-production baseline to 16.09, a 36.7% reduction. Single-select overlap fell 44.3%; semantic-family overlap fell 31.6%.
- **Equal color opportunity removes the known structural imbalance:** the current 6R/6B/6Y/7G Likert design permits a Green maximum of 128 versus 124 for the other colors. Design B gives every color the same raw maximum of 128 and the same neutral-uniform expectation of 38.
- **This is research evidence, not activation authority:** 55 OWNER-reviewed candidates remain non-production; production selector, scoring, corpus, and runtime were unchanged.

## A. Simulated Assembler Architecture

The simulator is an offline, non-production research implementation. Its deterministic identity is:

- bank version: `research-bank-2b2ea69c8694a63a`
- assembler version: `viago-research-assembler-1.0.0`
- replay key: bank version + assembler version + architecture + admission mode + seed
- randomness: SHA-256 counter stream
- AI runtime selection: none

Every attempt is assembled by type and Likert color quota, then checked against hard constraints. Single-select option order is derived from the same deterministic stream and saved in the manifest. The five example manifests reproduce byte-for-byte from their recorded seeds.

## B. Bank Admission Rules

The research bank contains exactly 206 questions: 151 active legacy questions and 55 OWNER-reviewed development candidates (16 Cohort 01, 24 Cohort 02, 15 Cohort 03). It contains 144 Likert and 62 single-select items. Likert availability is 34 Red, 36 Blue, 33 Yellow, and 41 Green.

Three legacy admission modes were tested:

| Admission mode | Rule | Research pool consequence |
|---|---|---:|
| `NORMAL` | Admit all active legacy items | 206 total research items |
| `CAPPED` | Admit all, but select at most five weak legacy items per attempt | 206 available; weak influence bounded |
| `EXCLUDED` | Remove all 58 weak legacy items | 148 admitted items |

A weak legacy item means `LOW` assignment confidence or at least one existing audit flag: questionable color assignment, ambiguity, double-barreling, social-desirability risk, or semantic overlap. This is a research admission rule, not a production-retirement decision.

All research designs additionally require:

- at most one question from each semantic family per attempt;
- at most eight workplace questions;
- at least 12 distinct behavioral domains;
- at least eight normalized contexts;
- exactly 50 unique question IDs.

## C. Current Production Baseline

The current selector draws 25 single-select items from a pool of 31 and 25 Likert items from a pool of 120, divided 6 Red / 6 Blue / 6 Yellow / 7 Green. It uses database randomness rather than a stored replay seed. In the 5,000-attempt baseline simulation, adjacent attempts shared an average of 25.43 questions: 20.17 single-select and 5.26 Likert. Attempts averaged 0.61 within-attempt semantic-family collisions, with a maximum of five.

This simulation reproduces the selector's composition constraints, not PostgreSQL's exact random-number sequence. It is therefore a structural baseline rather than a replay of historical production attempts.

## D. Alternative 50-Question Designs Tested

| Design | Single | Likert | Likert color quota | Raw color opportunity |
|---|---:|---:|---|---|
| A — current shape | 25 | 25 | 6R / 6B / 6Y / 7G | Unequal |
| B — equal, near-current | 26 | 24 | 6 each | Equal |
| C — equal, Likert-rich | 22 | 28 | 7 each | Equal |

Each research architecture was simulated with 5,000 deterministic attempts. Design B was tested with normal, capped, and excluded weak-legacy admission; A and C were tested with capped admission. Across all six scenarios, 30,000 attempts were constructed.

## E. Color and Scoring Comparison

Under the current raw additive scoring rule, a Likert answer contributes 0–4 to its assigned color and a single-select answer contributes 4 to its mapped color.

| Design | R max / neutral | B max / neutral | Y max / neutral | G max / neutral |
|---|---:|---:|---:|---:|
| A | 124 / 37 | 124 / 37 | 124 / 37 | 128 / 39 |
| B | 128 / 38 | 128 / 38 | 128 / 38 | 128 / 38 |
| C | 116 / 36 | 116 / 36 | 116 / 36 | 116 / 36 |

Design B is the smallest composition change that removes the opportunity imbalance. Design C is also balanced, but materially changes the evidence mix toward Likert responses. A simulation-only Green correction for Design A—`single_raw + (likert_raw / 7) × 6`—would equalize maxima at 124, but it is not authoritative and should not be introduced without calibration evidence and OWNER approval.

## F. Repeat-Exposure Results

The figures below are the mean overlap between adjacent deterministic attempts in each 5,000-attempt run.

| Scenario | Total | Single | Likert | Semantic family |
|---|---:|---:|---:|---:|
| Production baseline | 25.43 | 20.17 | 5.26 | 26.12 |
| A, capped | 15.65 | 10.43 | 5.22 | 17.42 |
| B, normal | 15.24 | 11.15 | 4.09 | 17.25 |
| **B, capped** | **16.09** | **11.23** | **4.85** | **17.86** |
| B, excluded | 18.40 | 11.56 | 6.84 | 20.28 |
| C, capped | 14.92 | 8.03 | 6.89 | 16.70 |

Relative to production, recommended Design B/capped reduces total overlap 36.7%, single-select overlap 44.3%, Likert overlap 7.7%, and semantic-family overlap 31.6%. Design C produces the lowest total overlap, but its higher Likert quota raises Likert overlap 31.0% above the production baseline and changes the measurement architecture more substantially.

Question-selection frequency is not uniform because quotas, semantic exclusions, context constraints, and the uneven source bank make some items more eligible than others. The coefficient of variation is 0.573 for B/capped versus 0.731 for the production baseline; this is an improvement, but item-level exposure still requires monitoring during shadow calibration.

## G. Domain and Context Diversity Results

Recommended Design B/capped averaged 15.89 distinct domains and 8.72 contexts per attempt; every attempt met the hard minimums of 12 and eight. Workplace content averaged 7.77 questions and never exceeded eight (16% of the assessment). The apparent rise from the production baseline's 6.12 workplace questions reflects an explicit cap being reached against a bank with many workplace-classified legacy items, not a recommendation to target eight. A future optimizer may lower this further after candidate metadata receives OWNER review.

The five example manifests contain 14–16 domains, 8–9 contexts, and 5–8 workplace questions. Candidate context labels were normalized to the legacy taxonomy for constraint enforcement while the original raw context remains preserved in each manifest.

## H. Semantic-Family Results

The simulator combines three kinds of evidence into semantic-family exclusions:

1. legacy overlap relationships from the forensic audit;
2. shared semantic-family labels among development candidates;
3. explicit cross-bank parallels identified in the coverage reviews.

The production structural baseline averaged 0.61 within-attempt semantic-family collisions. Every research scenario enforced zero. Cross-attempt semantic-family overlap remains higher than exact-question overlap because different questions can measure the same family; B/capped averaged 17.86 shared families versus 26.12 in production.

Semantic-family labels are governed research metadata, not psychometric proof. OWNER review and response evidence may split or merge families later, which would require a new bank version and fresh simulation.

## I. Effect of Excluding Weak Legacy Items

Normal B admission averaged 10.21 weak legacy questions per attempt. Capping reduced that to 4.99, with a hard maximum of five. Strict exclusion removed them entirely but shrank the admitted bank from 206 to 148 and increased expected total overlap from 16.09 to 18.40 compared with capped admission—a 14.4% increase.

The evidence therefore favors **capping, not wholesale exclusion**, for research assembly. Strict exclusion should be reconsidered only after enough replacement items exist or response evidence establishes that particular legacy items must not participate.

## J. Recommended Assessment Composition

Advance **Design B with capped legacy admission** as the next shadow/research assembler:

- 26 single-select;
- 24 Likert, exactly six per color;
- no more than five weak legacy items;
- no more than eight workplace items;
- at least 12 domains and eight contexts;
- no semantic-family duplication within an attempt;
- stored bank version, assembler version, seed, ordered question IDs, and option order.

This recommendation balances the strongest practical gains: equal scoring opportunity, major single-select repeat reduction, limited departure from the accepted 25/25 experience, controlled weak-legacy exposure, and deterministic replay. It is not an activation recommendation.

## K. Recommended Scoring Normalization

Do **not** authorize a production normalization formula from simulation alone. For research records, preserve:

- raw Likert subtotal and opportunity count per color;
- raw single-select subtotal and opportunity count per color;
- normalized Likert share `likert_raw / (4 × Likert opportunities)`;
- normalized single-select share `single_raw / (4 × single-select questions)`;
- final raw scores and margins under every explicitly versioned scoring candidate.

Design B needs no color-specific opportunity correction under the current raw rule. Whether Likert and single-select evidence should retain equal raw weight is a psychometric question for response data, stability analysis, and OWNER governance—not an assembler assumption.

## L. Five Example 50-Question Attempt Manifests

All five manifests use Design B/capped, contain 50 unique questions, 26 single-select items, 24 Likert items (six per color), four-option deterministic order for every single-select item, and no semantic-family collision.

| Seed | Manifest SHA-256 | Domains | Contexts | Workplace | Weak legacy | Source mix L/C1/C2/C3 |
|---|---|---:|---:|---:|---:|---|
| `owner-example-001` | `f390e82a…7d665` | 16 | 9 | 5 | 5 | 32 / 4 / 7 / 7 |
| `owner-example-002` | `d275a9a5…e4d0a` | 15 | 8 | 8 | 5 | 31 / 7 / 6 / 6 |
| `owner-example-003` | `8c850953…406f` | 14 | 9 | 7 | 5 | 36 / 3 / 8 / 3 |
| `owner-example-004` | `28cb5a66…df32` | 15 | 9 | 7 | 5 | 37 / 3 / 6 / 4 |
| `owner-example-005` | `c11ba811…e50f` | 15 | 9 | 7 | 5 | 32 / 5 / 6 / 7 |

The complete ordered question IDs, metadata, and option orders are stored in `data/v2-research/example-attempt-manifests.json`.

## M. Reproducibility Evidence

`node scripts/v2/simulate-research-assembler.mjs --verify-examples` regenerated all five manifests from their saved keys and matched the complete JSON and SHA-256 hashes exactly. `node scripts/v2/validate-assessment-assembly-research.mjs` independently checks bank counts, simulation sizes, color opportunity, all manifest constraints, and the recommended scenario's improvement over baseline.

The research outputs intentionally use `generated_at: null`; reruns do not acquire a changing timestamp. Any bank, metadata, architecture, admission, or algorithm change must advance the relevant version rather than silently changing a saved result.

## N. Risks and Unresolved OWNER Decisions

1. **Composition authority:** approve or reject Design B for shadow testing; no runtime activation is implied.
2. **Scoring authority:** decide only after response evidence whether raw additive scoring, type-separated normalization, or another calibrated model should govern results.
3. **Legacy admission:** the five-item weak cap is evidence-informed but not psychometrically calibrated.
4. **Metadata maturity:** development-candidate domains, contexts, and semantic families are review metadata; legacy classifications inherit known audit uncertainty.
5. **Comparability:** equal theoretical opportunities do not prove equal empirical difficulty, discrimination, reliability, or color-scale calibration.
6. **Repeat model:** adjacent seeded attempts approximate independent repeat exposure; actual user retry timing and previously-seen-question avoidance were not modeled.
7. **Option-order effects:** deterministic shuffling is replayable, but response-position effects require observed data.
8. **Candidate language:** all 55 candidates remain development-only and require any remaining bilingual/content governance before activation.

The next evidence-producing step should be a non-production shadow study using Design B/capped with stored manifests and type-separated score telemetry. It should compare result stability, margins/ties, item selection frequency, completion behavior, and language equivalence before any activation decision.

## O. Production Change Confirmation

Zero production changes were made. The production function `pick_balanced_questions_50(uuid)`, scoring engine, active question corpus, selector, database, Vercel deployment, V1/V2 public behavior, Traveler, and historical attempts/results were not modified. The new implementation and outputs live only in repository research paths.

## Caveats and Assumptions

- Source population: the repository's preserved 151-question active snapshot plus the final OWNER-approved states of Cohorts 01–03 as of commit `80ed003c222477be97efae34fc5651a445d83070`.
- Simulation volume: 5,000 attempts per scenario; overlap pairs are adjacent attempts within each deterministic run.
- “Expected” means empirical mean in these seeded simulations, not a confidence-bound claim about future test takers.
- The assembler tests composition and exposure mechanics. It cannot establish reliability, validity, item discrimination, or outcome comparability without response data.
