# VIAGO Personality Quiz V2

Status: **V2 STARTED**

V2 evolves the proven VIAGO Personality Quiz scoring/persistence engine into a polished assessment platform while preserving deterministic scoring, bilingual support, historical-result compatibility, and canonical production data integrity.

## Owner-approved interface direction

The approved concept board defines these product surfaces:

1. **Home / landing experience** — approved panel 1.
2. **Assessment question experience** — approved panel 2.
3. **Results experience** — approved panel 3.
4. **Admin analytics dashboard** — approved panel 4.
5. **Admin question/content management** — based on the question-style/content-management direction in panel 5, implemented as a real editable administration surface rather than a static guideline panel.

The generated concept board from the V2 kickoff conversation is the visual reference for these surfaces. A repository asset copy is tracked as a required V2 design artifact; until the binary reference is committed, `docs/v2/UI_REFERENCE.md` records the approved visual contract so implementation does not depend on conversational memory.

## Core V2 principles

- Keep the existing deterministic scoring engine authoritative until an explicitly reviewed V2 scoring revision replaces it.
- Separate assessment content from presentation and administration.
- Make question edits a governed data workflow, not source-code edits.
- Preserve English/Spanish parity and the existing translation standard.
- Never allow the public application to hold privileged Supabase credentials.
- Analytics are derived from canonical attempt/assignment/answer/result data; do not create a second analytics source of truth.
- Public counters must count completed assessments, not merely starts.
- Admin authentication and authorization are mandatory before analytics or content editing is exposed.
- Content changes need auditability, validation, and publication state; editing a draft must not silently mutate a live quiz.

## Initial V2 route architecture

```text
app/
  v2/
    page.tsx                 # landing experience
    quiz/
      page.tsx               # V2 assessment runner
    results/
      [sessionId]/page.tsx   # V2 shareable result experience
    admin/
      login/page.tsx         # discreet admin entry/authentication
      page.tsx               # analytics dashboard
      questions/page.tsx     # question + answer editor
      content/page.tsx       # result narratives / future content controls

components/
  v2/
    public/                  # landing/quiz/results presentation
    admin/                   # admin dashboard/editor components
    shared/                  # shared V2 primitives

lib/
  v2/
    analytics/               # deterministic analytics queries/services
    assessment/              # assessment model + composition contracts
    auth/                    # admin authorization helpers
    content/                 # draft/review/publish content model

 docs/v2/
    README.md
    UI_REFERENCE.md
    CONTENT_MODEL.md
    ADMIN_ARCHITECTURE.md
```

## Build sequence

### Phase V2-A — Foundation
- Establish the V2 route/component/service boundaries.
- Preserve the current production quiz as V1 while V2 is developed.
- Define the content-management and publication model before enabling writes.
- Define admin authentication/authorization.

### Phase V2-B — Question corpus redesign
- Formalize color dimensions.
- Rewrite the corpus around natural scenarios and believable tradeoffs.
- Retain deterministic balance and trace every question to intended constructs.
- Review English first; derive reviewed Spanish from approved English authority.

### Phase V2-C — Public experience
- Build approved landing page.
- Build approved question/answer presentation.
- Build approved result visualization.
- Add completed-assessment public counter.

### Phase V2-D — Admin platform
- Authenticated analytics dashboard.
- Question/answer editor with draft/review/publish workflow.
- Result-description content management.
- Audit log for every content publication.

### Phase V2-E — Team layer
- Team/event links, cohort analytics, composition reporting, and facilitator views after the individual assessment is stable.

## Production boundary

V2 development must not silently replace the current production experience. The existing production routes and scoring/data contracts remain intact until an explicit V2 production acceptance and cutover authorization.
