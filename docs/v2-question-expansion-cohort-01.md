# VIAGO V2 question expansion — cohort 01

> **OWNER REVIEW ONLY.** None of these proposals is an active question, production UUID, scoring change, selector change, or migration. The runtime does not read this proposal bank.

## What this cohort is testing

This small cohort tests whether the proposed writing philosophy sounds like VIAGO before expansion scales: concrete behavior, ordinary situations, one main idea, defensible color meaning, and less obvious personality-test signaling. It deliberately targets the coverage and repetition weaknesses found in the forensic audit.

## Review summary

- **24 proposals:** 16 Likert and 8 situational single-select.
- **Likert colors:** Red 5, Blue 5, Yellow 3, Green 3.
- **Single-select option mappings:** Red 8, Blue 8, Yellow 8, Green 8; every prompt contains one option per color.
- **Recommendations:** ADD_CANDIDATE 19, EXPERIMENTAL 4, REVISE_BEFORE_CONSIDERATION 1.

### Behavioral-domain matrix

| Domain | Proposals |
| --- | ---: |
| communication | 2 |
| conflict | 3 |
| cooperation-support | 1 |
| decision-making | 2 |
| detail-accuracy | 3 |
| independence-follow-through | 2 |
| leadership-influence | 3 |
| problem-solving-learning | 3 |
| risk-change | 4 |
| social-interaction | 1 |

### Context matrix

| Context | Proposals |
| --- | ---: |
| communication | 1 |
| conflict | 1 |
| personal-preference | 2 |
| pressure | 6 |
| social | 1 |
| team | 5 |
| unfamiliar-situation | 4 |
| work-business | 4 |

### Semantic families

| Family | Proposals | What parallel evidence it demonstrates |
| --- | ---: | --- |
| adaptive-curiosity | 1 | Opportunity-focused response to unexpected change. |
| deadline-quality-tradeoff | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |
| decisive-action | 4 | Action under incomplete information, team indecision, pressure, and changing plans. |
| evidence-before-action | 3 | Accuracy and evidence checking in work, pressure, and conflict. |
| expressive-connection | 3 | Communication through explanation, unfamiliar social entry, and group energy. |
| expressive-precision | 1 | Whether detail can serve vivid communication without becoming procedural accuracy. |
| hidden-disagreement | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |
| learning-entry | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |
| plan-disruption | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |
| pressure-first-response | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |
| principled-boundaries | 2 | Relationship-preserving directness and limits. |
| principled-inclusion | 1 | Advocacy for people affected by a decision. |
| recovery-after-setback | 2 | Action and orientation after a visible mistake. |
| social-decision | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |
| unfamiliar-entry | 1 | One situational family retained for future parallel variants and same-attempt exclusion. |

## How to review

For each item, first read only the question, color, measurement goal, and reason. Ask: “Would an ordinary person recognize this situation, and could they answer without decoding the color?” Then inspect the technical notes. `EXPERIMENTAL` and `REVISE_BEFORE_CONSIDERATION` items are included to calibrate boundaries, not to seek automatic approval.

## Likert proposals

### C01-L-R-01 — Red

> **When a group keeps circling the same decision, I’m willing to name a direction so everyone can react to something concrete.**

**What we’re trying to measure:** Stronger endorsement indicates willingness to create forward motion without waiting for perfect consensus.

**Why this question exists:** Adds explicit leadership evidence without asking whether the respondent likes being the leader.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: red
- Domain: leadership-influence
- Context: team
- Intensity: moderate
- Semantic family: decisive-action
- Closest active question IDs: 29efc415-38e9-408a-aa7b-4d46f6996c20, 89df63e5-ffa9-4e7a-a228-f1651750ac20
- Difference: Measures making a concrete proposal during circular discussion rather than feeling generally responsible for momentum.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-R-02 — Red

> **If a decision can be changed later, I’d rather choose a workable option now than wait for every detail.**

**What we’re trying to measure:** Stronger endorsement indicates bias toward reversible action under incomplete information.

**Why this question exists:** Separates reversible-decision speed from broad risk appetite.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: red
- Domain: decision-making
- Context: work-business
- Intensity: moderate
- Semantic family: decisive-action
- Closest active question IDs: a4a2deed-c11e-43bd-abff-1a6055c64d83
- Difference: Defines a reversible decision and a workable threshold, reducing the ambiguity of not having all information.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-R-03 — Red

> **When time is short and people are unsure what to do, I state the next step clearly.**

**What we’re trying to measure:** Stronger endorsement indicates directive clarity under time pressure.

**Why this question exists:** Adds pressure-context leadership, which is thin in the current bank.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: red
- Domain: leadership-influence
- Context: pressure
- Intensity: strong
- Semantic family: decisive-action
- Closest active question IDs: 29efc415-38e9-408a-aa7b-4d46f6996c20
- Difference: Focuses on communicating a next step under time pressure rather than a general internal sense of responsibility.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-R-04 — Red

> **If a plan is clearly failing, I’m comfortable changing course before everyone agrees on the replacement.**

**What we’re trying to measure:** Stronger endorsement indicates willingness to act during disagreement when the current course is failing.

**Why this question exists:** Measures decisive adaptation rather than generic comfort with chaos or risk.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: red
- Domain: risk-change
- Context: team
- Intensity: strong
- Semantic family: decisive-action
- Closest active question IDs: 24c90a2c-32e9-4a0d-8518-7c0e659e3f65, b4fdbbe6-d483-41a2-8033-25ede709c182
- Difference: Creates a specific failing-plan and incomplete-consensus tradeoff.
- Color-assignment confidence: MODERATE
- Ambiguity risk: MODERATE
- Social-desirability risk: LOW
- Recommendation: **EXPERIMENTAL**

</details>

### C01-L-R-05 — Red

> **After I own a mistake, my attention moves quickly to the decision that will get things back on track.**

**What we’re trying to measure:** Stronger endorsement indicates accountability followed by rapid recovery action.

**Why this question exists:** Adds action-oriented accountability without treating admission of fault itself as a color signal.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: red
- Domain: independence-follow-through
- Context: work-business
- Intensity: moderate
- Semantic family: recovery-after-setback
- Closest active question IDs: d60128b7-cef9-42f3-8841-3b4d024cb71b
- Difference: Measures what happens after ownership rather than forcing one generic reaction to a mistake.
- Color-assignment confidence: MODERATE
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-B-01 — Blue

> **When an idea is hard to explain, I look for a story or example that will make it click for people.**

**What we’re trying to measure:** Stronger endorsement indicates expressive, audience-oriented communication.

**Why this question exists:** Adds concrete Blue communication behavior instead of general sociability.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: blue
- Domain: communication
- Context: work-business
- Intensity: moderate
- Semantic family: expressive-connection
- Closest active question IDs: 86f93908-6a45-42f7-bd7b-d2d7d3d13de6
- Difference: Measures spontaneous use of narrative/example rather than asking for a self-label of communication style.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-B-02 — Blue

> **In a room where I don’t know anyone, I usually find a natural way into the conversation without waiting to be introduced.**

**What we’re trying to measure:** Stronger endorsement indicates spontaneous social entry in an unfamiliar setting.

**Why this question exists:** Adds unfamiliar-context social initiative, not enjoyment of parties.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: blue
- Domain: social-interaction
- Context: unfamiliar-situation
- Intensity: moderate
- Semantic family: expressive-connection
- Closest active question IDs: 34202350-60a2-45e1-b4b8-bf0fa471d020
- Difference: Measures entering an unfamiliar conversation rather than preference for conversation depth.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-B-03 — Blue

> **When plans change at the last minute, I can usually spot something interesting in the new direction.**

**What we’re trying to measure:** Stronger endorsement indicates opportunity-focused adaptation to unexpected change.

**Why this question exists:** Adds Blue change orientation without equating spontaneity with recklessness.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: blue
- Domain: risk-change
- Context: unfamiliar-situation
- Intensity: moderate
- Semantic family: adaptive-curiosity
- Closest active question IDs: 16d86da0-614b-4c2f-a935-51e08ab09baa, 7d345f7b-6c63-429d-981c-857b2af2fb58
- Difference: Measures cognitive reframing after a real change rather than preference for spontaneous plans.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-B-04 — Blue

> **I notice small details more easily when they help me make an idea vivid for someone else.**

**What we’re trying to measure:** Stronger endorsement indicates selective attention to detail in service of expressive communication.

**Why this question exists:** Tests whether Blue detail can be measured as vivid communication rather than Green procedural accuracy.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: blue
- Domain: detail-accuracy
- Context: communication
- Intensity: mild
- Semantic family: expressive-precision
- Closest active question IDs: fe20ba22-9f49-472d-b284-8bfb7f0b91fa
- Difference: Measures purpose-driven detail use rather than rejecting advance detail planning.
- Color-assignment confidence: LOW
- Ambiguity risk: MODERATE
- Social-desirability risk: LOW
- Recommendation: **EXPERIMENTAL**

</details>

### C01-L-B-05 — Blue

> **When a quiet group loses energy, I’m often the person who gets people talking again.**

**What we’re trying to measure:** Stronger endorsement indicates socially energizing communication.

**Why this question exists:** Adds observable group-energy behavior without asking whether the respondent is outgoing.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: blue
- Domain: communication
- Context: team
- Intensity: moderate
- Semantic family: expressive-connection
- Closest active question IDs: a1fbe330-1e47-4251-9a07-ce5c2029f916
- Difference: Measures re-engaging a quiet group rather than suggesting social activities.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-Y-01 — Yellow

> **If I disagree with someone I care about, I’d rather name it kindly than let it build in the background.**

**What we’re trying to measure:** Stronger endorsement indicates relationship-preserving directness rather than conflict avoidance.

**Why this question exists:** Broadens Yellow beyond support and avoidance into constructive relational courage.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: yellow
- Domain: conflict
- Context: personal-preference
- Intensity: moderate
- Semantic family: principled-boundaries
- Closest active question IDs: 3dc580d8-8ac6-4af0-b4c4-7dc2559f9fed
- Difference: The motive and method are relationship-preserving; the existing difficult-conversation item is assigned Red and emphasizes honesty over avoidance.
- Color-assignment confidence: MODERATE
- Ambiguity risk: MODERATE
- Social-desirability risk: MODERATE
- Recommendation: **EXPERIMENTAL**

</details>

### C01-L-Y-02 — Yellow

> **When a group decision affects someone who isn’t in the room, I bring up what they may need from us.**

**What we’re trying to measure:** Stronger endorsement indicates advocacy for absent stakeholders during collective decisions.

**Why this question exists:** Turns inclusion into a concrete decision behavior rather than a general wish for everyone to feel comfortable.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: yellow
- Domain: cooperation-support
- Context: team
- Intensity: moderate
- Semantic family: principled-inclusion
- Closest active question IDs: 04cb4f9d-f1e1-476a-862c-b1c7c18faaaf, afc159a2-fc5e-4f09-aa25-2912ae7d0e1c
- Difference: Measures speaking for an absent stakeholder in a consequential decision.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-Y-03 — Yellow

> **Under pressure, I can set a clear boundary without withdrawing my support from the person involved.**

**What we’re trying to measure:** Stronger endorsement indicates maintaining care while setting limits.

**Why this question exists:** Tests a less stereotypical Yellow behavior: supportive firmness under pressure.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: yellow
- Domain: conflict
- Context: pressure
- Intensity: strong
- Semantic family: principled-boundaries
- Closest active question IDs: 63a771d2-a37a-4a48-b5fd-f5d316d26b0d
- Difference: Adds a boundary tradeoff; the existing item measures commitment to support without limits.
- Color-assignment confidence: MODERATE
- Ambiguity risk: MODERATE
- Social-desirability risk: HIGH
- Recommendation: **REVISE_BEFORE_CONSIDERATION**

</details>

### C01-L-G-01 — Green

> **When instructions are incomplete, I identify the missing detail before I begin.**

**What we’re trying to measure:** Stronger endorsement indicates resolving information gaps before execution.

**Why this question exists:** Adds concrete accuracy behavior rather than general discomfort with unclear situations.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: green
- Domain: detail-accuracy
- Context: work-business
- Intensity: moderate
- Semantic family: evidence-before-action
- Closest active question IDs: 1bac0735-73c1-43b1-86a8-41ec34adfd86
- Difference: Measures an observable response to incomplete instructions, not an emotional reaction to vagueness.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-G-02 — Green

> **If a quick fix could create a second problem, I pause long enough to check the likely consequences.**

**What we’re trying to measure:** Stronger endorsement indicates consequence checking before adopting a fast solution.

**Why this question exists:** Adds applied reasoning under pressure rather than generic risk avoidance.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: green
- Domain: problem-solving-learning
- Context: pressure
- Intensity: moderate
- Semantic family: evidence-before-action
- Closest active question IDs: c647a4f5-8b50-466f-9a65-c6a8f2d0fda2
- Difference: Defines a concrete second-order consequence instead of broad concern about complications.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-L-G-03 — Green

> **When people disagree about the facts, I separate what we know from what we’re assuming.**

**What we’re trying to measure:** Stronger endorsement indicates evidence sorting during disagreement.

**Why this question exists:** Adds Green conflict and communication breadth without relying on planning language.

<details>
<summary>Technical review metadata</summary>

- Type: LIKERT
- Intended color: green
- Domain: problem-solving-learning
- Context: conflict
- Intensity: moderate
- Semantic family: evidence-before-action
- Closest active question IDs: 3b9a1aa5-09ba-4bb9-b3c9-c8033791974c
- Difference: Measures fact/assumption separation during live disagreement rather than reviewing every option before change.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

## Situational single-select experiment

### C01-S-01 — Multi Color

> **A time-sensitive problem appears and no one clearly owns it yet. What are you most likely to do first?**

**What we’re trying to measure:** The first response differentiates ownership, social mobilization, stakeholder care, and evidence gathering.

**Why this question exists:** Adds a concrete pressure scenario to the small single-select pool.

**Proposed options and color mapping:**

- **Red:** Take ownership and choose the first action
- **Blue:** Get the right people talking so energy builds around a response
- **Yellow:** Check who is affected and what support they need immediately
- **Green:** Confirm the facts and identify the safest first step

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: leadership-influence
- Context: pressure
- Intensity: strong
- Semantic family: pressure-first-response
- Closest active question IDs: a3057e3d-142d-41af-b1fa-57d6bf0b0aa8
- Difference: Uses unclear ownership and time pressure rather than a generic group-project preference.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-02 — Multi Color

> **You join a new project and the goal is still vague. What helps you engage first?**

**What we’re trying to measure:** Differentiates direction setting, conversational exploration, relationship orientation, and requirement clarification.

**Why this question exists:** Expands single-select context beyond generic personal preference.

**Proposed options and color mapping:**

- **Red:** Propose a starting direction and adjust once we learn more
- **Blue:** Talk through possibilities until an exciting angle emerges
- **Yellow:** Learn what each person hopes the project will accomplish
- **Green:** Clarify the requirements and what success needs to include

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: risk-change
- Context: unfamiliar-situation
- Intensity: moderate
- Semantic family: unfamiliar-entry
- Closest active question IDs: 4ec48535-9510-4e86-9ee7-a6ea509af280
- Difference: Defines a new-project situation and four distinct engagement behaviors.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-03 — Multi Color

> **A plan you were counting on changes with little warning. What do you do first?**

**What we’re trying to measure:** Differentiates action redirection, novelty seeking, relationship checking, and plan reconstruction.

**Why this question exists:** Provides a recognizable non-work change scenario.

**Proposed options and color mapping:**

- **Red:** Pick the best available alternative and keep moving
- **Blue:** Look for something enjoyable in the unexpected change
- **Yellow:** Check how the change affects the other people involved
- **Green:** Rebuild the plan so I know what happens next

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: risk-change
- Context: personal-preference
- Intensity: moderate
- Semantic family: plan-disruption
- Closest active question IDs: 16d86da0-614b-4c2f-a935-51e08ab09baa
- Difference: Asks for the first observable response and makes all four interpretations explicit.
- Color-assignment confidence: HIGH
- Ambiguity risk: MODERATE
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-04 — Multi Color

> **You realize you made a mistake that other people will notice. What is your first instinct?**

**What we’re trying to measure:** Differentiates corrective action, conversational reset, relational repair, and causal analysis.

**Why this question exists:** Replaces a generic mistake prompt with observable first responses.

**Proposed options and color mapping:**

- **Red:** Correct what I can and explain the next step
- **Blue:** Talk it through openly so the situation does not become heavier
- **Yellow:** Reach out to anyone affected and repair the trust
- **Green:** Trace what caused it so the correction will hold

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: independence-follow-through
- Context: pressure
- Intensity: strong
- Semantic family: recovery-after-setback
- Closest active question IDs: d60128b7-cef9-42f3-8841-3b4d024cb71b
- Difference: Adds visibility and a first-instinct frame while avoiding morally loaded admission versus concealment options.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-05 — Multi Color

> **A meeting ends with polite agreement, but you sense that several people still disagree. What are you most likely to do?**

**What we’re trying to measure:** Differentiates direct resolution, informal conversation, inclusive checking, and issue clarification.

**Why this question exists:** Adds nuanced conflict evidence where the disagreement is indirect.

**Proposed options and color mapping:**

- **Red:** Bring the disagreement back into the open before we proceed
- **Blue:** Start an informal conversation where people may speak more freely
- **Yellow:** Check privately with the quieter people so their concerns are heard
- **Green:** Identify which assumptions or details are still unresolved

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: conflict
- Context: team
- Intensity: moderate
- Semantic family: hidden-disagreement
- Closest active question IDs: 186c99bb-b666-4a64-a85e-955e84388dcb
- Difference: Uses a specific hidden-disagreement cue rather than asking for a generic conflict style.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: MODERATE
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-06 — Multi Color

> **You need to learn a new tool for something that matters. How do you naturally begin?**

**What we’re trying to measure:** Differentiates hands-on action, social exploration, guided support, and structured learning.

**Why this question exists:** Adds learning behavior, a thin domain in the current bank.

**Proposed options and color mapping:**

- **Red:** Try it on a real task and solve problems as they appear
- **Blue:** Explore it with someone and trade ideas about what it can do
- **Yellow:** Ask a patient person to walk through it with me
- **Green:** Learn the core steps before I use it on important work

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: problem-solving-learning
- Context: unfamiliar-situation
- Intensity: mild
- Semantic family: learning-entry
- Closest active question IDs: No close active item identified
- Difference: Introduces a domain with little direct current coverage.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-07 — Multi Color

> **Friends are choosing an activity, and the conversation has stalled. What contribution comes most naturally to you?**

**What we’re trying to measure:** Differentiates decision closure, energy generation, inclusion, and practical evaluation in a non-work context.

**Why this question exists:** Tests color behavior outside work without reducing Blue or Yellow to party preference.

**Proposed options and color mapping:**

- **Red:** Choose one of the workable ideas so we can get going
- **Blue:** Throw out a fresh idea that gets people excited
- **Yellow:** Find the option that nobody feels pushed out of
- **Green:** Compare time, cost, and logistics before recommending one

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: decision-making
- Context: social
- Intensity: mild
- Semantic family: social-decision
- Closest active question IDs: a1fbe330-1e47-4251-9a07-ce5c2029f916
- Difference: All colors contribute to a stalled social choice; the existing item only asks who suggests activities.
- Color-assignment confidence: HIGH
- Ambiguity risk: LOW
- Social-desirability risk: LOW
- Recommendation: **ADD_CANDIDATE**

</details>

### C01-S-08 — Multi Color

> **A deadline is close, and the work could still be improved. What guides your next move?**

**What we’re trying to measure:** Differentiates delivery, persuasive alignment, impact on others, and quality assurance.

**Why this question exists:** Adds a realistic pressure/quality tradeoff and tests whether options remain equally defensible.

**Proposed options and color mapping:**

- **Red:** Finish the essential work and deliver on time
- **Blue:** Focus on the part that will make the strongest impression
- **Yellow:** Check which unfinished part would create the most trouble for others
- **Green:** Protect the most important quality checks, even if something else is reduced

<details>
<summary>Technical review metadata</summary>

- Type: SINGLE_SELECT
- Intended color: multi-color
- Domain: detail-accuracy
- Context: pressure
- Intensity: strong
- Semantic family: deadline-quality-tradeoff
- Closest active question IDs: fe20ba22-9f49-472d-b284-8bfb7f0b91fa
- Difference: Presents an actual deadline decision instead of a general flexibility preference.
- Color-assignment confidence: MODERATE
- Ambiguity risk: MODERATE
- Social-desirability risk: MODERATE
- Recommendation: **EXPERIMENTAL**

</details>

## Existing active questions needing OWNER attention

These remain unchanged in production. They are shown to distinguish future cleanup from bank expansion.

### Existing 039de60f-9c76-45f4-9061-147a51745e0f

> **I’m comfortable being the one who takes the heat if a decision doesn’t work out.**

**Why it needs attention:** Exact duplicate under another UUID; idiom and accountability versus risk tolerance can compete.

**Possible future treatment:** Keep one immutable historical definition; review a concrete recovery-after-setback replacement.

### Existing 199f9df0-be56-402e-a98c-8b1b8e4518af

> **I’m comfortable being the one who takes the heat if a decision doesn’t work out.**

**Why it needs attention:** Exact duplicate of 039de60f-9c76-45f4-9061-147a51745e0f.

**Possible future treatment:** RETIRE_CANDIDATE after historical/version preservation review.

### Existing 29efc415-38e9-408a-aa7b-4d46f6996c20

> **I feel responsible for keeping things moving when others in the group hesitate.**

**Why it needs attention:** Near duplicate and could mean leadership, impatience, or duty.

**Possible future treatment:** Compare with C01-L-R-01 and C01-L-R-03.

### Existing 89df63e5-ffa9-4e7a-a228-f1651750ac20

> **I feel responsible for keeping things moving when others hesitate.**

**Why it needs attention:** Near-exact duplicate without a defined situation.

**Possible future treatment:** Retain history; prefer a context-specific behavior in a future revision.

### Existing 04cb4f9d-f1e1-476a-862c-b1c7c18faaaf

> **It is important to me that social settings always ensure everyone feels included and comfortable.**

**Why it needs attention:** Absolute 'always', awkward agency, and socially desirable answer.

**Possible future treatment:** Compare with the concrete absent-stakeholder behavior in C01-L-Y-02.

### Existing 1bac0735-73c1-43b1-86a8-41ec34adfd86

> **I get uncomfortable when things feel disorganized or unclear.**

**Why it needs attention:** Vague 'things' and measures discomfort rather than the respondent's behavior.

**Possible future treatment:** Compare with C01-L-G-01.

### Existing 36041a0f-a82d-4c66-96f1-973ea25a3daf

> **I get excited starting things, but I don’t always enjoy the follow-through.**

**Why it needs attention:** Combines initiation and follow-through; absolute framing may invite stereotype recognition.

**Possible future treatment:** Split initiation energy from persistence in a later reviewed cohort.

### Existing 4ec48535-9510-4e86-9ee7-a6ea509af280

> **Before starting something new, I prefer to…**

**Why it needs attention:** Context-free single prompt; the imagined situation can change the answer substantially.

**Possible future treatment:** Compare with C01-S-02's defined new-project context.

### Existing 186c99bb-b666-4a64-a85e-955e84388dcb

> **Your natural reaction to conflict is:**

**Why it needs attention:** Generic self-label without severity, relationship, or visibility context.

**Possible future treatment:** Keep current for comparison; test C01-S-05 as a complementary hidden-disagreement scenario.

### Existing d60128b7-cef9-42f3-8841-3b4d024cb71b

> **If I make a mistake, I…**

**Why it needs attention:** Too little context; private, public, minor, and consequential mistakes can produce different answers.

**Possible future treatment:** Compare with C01-S-04's visible-impact scenario.

## Specific OWNER decisions requested

1. Do the Red decisive-action variants feel behaviorally distinct rather than like leadership slogans?
2. Does Blue “expressive precision” (`C01-L-B-04`) feel legitimate, or does it actually measure Green detail orientation?
3. Can Yellow include direct boundaries and constructive conflict without losing its relationship-centered meaning?
4. Do the Green items measure evidence/accuracy behavior rather than anxiety about uncertainty?
5. Are the four single-select options equally plausible, or does any option read as the obviously responsible answer?
6. Which items feel too workplace-specific or too morally desirable?
7. Which semantic families should be used as same-attempt exclusion groups?

## Stop gate

No cohort 02, bulk generation, UUID assignment, migration, publishing, scoring change, or selector change follows from this document. OWNER feedback is required first.
