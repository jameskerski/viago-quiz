# V2 Admin Architecture

## Goal

Provide a discreet authenticated administration area for analytics and governed content maintenance without requiring source edits or Codex for routine question/answer changes.

## Admin entry

The public V2 landing page exposes a small settings/admin affordance that routes to `/v2/admin/login`.

The link itself is not a security boundary. All `/v2/admin/*` routes and admin APIs enforce the server-side session.

## Authentication

V2 intentionally uses a simple shared-password model because the administration surface is operated by two trusted people.

Authoritative flow:

```text
discreet settings link
  -> /v2/admin/login
  -> shared password verified server-side
  -> signed HttpOnly admin session cookie
  -> analytics + content administration
```

Rules:
- Password source of truth is the server-only `VIAGO_ADMIN_PASSWORD` environment variable.
- Never commit the password value to Git, documentation, client JavaScript, database rows, or generated artifacts.
- Password comparison happens server-side.
- Successful login issues a signed HttpOnly, Secure-in-production, SameSite=Strict session cookie.
- Admin pages and admin APIs require a valid session.
- Logout invalidates the cookie.
- There is no Supabase Auth dependency, username/account system, role table, or third-party identity provider in V2 unless the operating model materially changes later.
- No privileged Supabase credential is exposed to browser JavaScript.

This deliberately keeps identity simple while keeping content publication safety strong.

## Content source of truth

The admin editor must not update active `questions` / `question_options` rows directly.

V2 introduces a versioned authoring layer:

```text
assessment_content_revisions
  id
  status: DRAFT | READY_TO_PUBLISH | PUBLISHED | SUPERSEDED
  created_at
  updated_at
  published_at
  source_revision_id
  notes

assessment_question_revisions
  revision_id
  canonical_question_id
  qtype
  category
  dimension
  prompt_en
  prompt_es
  active
  construct/scoring metadata

assessment_option_revisions
  revision_id
  canonical_option_id
  canonical_question_id
  label_en
  label_es
  active
  sort/scoring metadata

assessment_content_audit
  action
  revision_id
  occurred_at
  deterministic diff / metadata
```

Draft saves only alter authoring rows. Publishing is a separate guarded transaction that validates a complete revision before changing the canonical runtime corpus.

## Validation before publish

At minimum:
- canonical question/option identity validity;
- English authority present;
- Spanish coverage for bilingual publication;
- qtype-specific requirements;
- option membership and ordering validity;
- scoring/color metadata validity;
- construct/dimension coverage;
- 50-question composition simulation/regression checks;
- known-defect checks;
- deterministic diff against the currently published corpus.

Publication remains disabled/fail-closed until these checks and the publish transaction have production acceptance.

## Attempt/outcome metadata

V1 stores the durable attempt, assigned questions, answers, and option order, but not language or a persisted final score snapshot. V2 adds additive attempt metadata so analytics do not have to repeatedly reconstruct the entire corpus.

For V2-capable attempts capture, when known:
- language (`en` / `es`);
- completion timestamp;
- winner color;
- Red / Blue / Yellow / Green final score snapshot;
- published content revision identifier.

Historical V1 rows remain authoritative and are not fabricated. In particular, historical language remains unknown unless it was actually persisted elsewhere.

## Analytics

Analytics are deterministic projections over canonical `xombtulaktoprxxtkbcy.viago_quiz` data, never a separately maintained counter.

Public metric:
- completed assessments only, not attempts started.

Admin metrics:
- attempts started;
- completed assessments;
- completion rate;
- activity by day/week/month;
- known-language split;
- primary result distribution;
- score margins and tie rates;
- active question count and qtype composition;
- per-question selection distributions and item-health indicators when statistically justified.

Do not surface invented historical language data or pseudo-scientific validation claims. Statistical quality metrics must be labeled for what they actually measure.

## Operational boundary

The shared password makes access simple. Content safety remains deliberately stronger:

```text
LOGIN grants access.
DRAFT allows editing.
VALIDATE proves corpus rules.
READY_TO_PUBLISH means the revision is eligible.
PUBLISH is a separate guarded transaction.
```

This prevents a typo in the admin editor from silently changing the live assessment.