# V2 Admin Architecture

## Goal

Provide a discreet authenticated administration area for analytics and governed content maintenance without requiring source edits or Codex for routine question/answer changes.

## Admin entry

Public landing page may expose a small settings/admin affordance. It routes to `/v2/admin/login`.

The link itself is not a security boundary. All `/v2/admin/*` routes and write APIs must enforce server-side authentication and authorization.

## Authentication

Use the existing Supabase project only. Do not create a second auth provider or database.

Recommended V2 model:
- Supabase Auth for administrator identity.
- Explicit admin allowlist/role table in the canonical project.
- Server-side session verification for every admin route and write operation.
- No privileged database credential in browser JavaScript.

Exact identity enrollment and roles require OWNER review before production enablement.

## Content source of truth

Do not let the editor update active `questions` / `question_options` rows directly.

Introduce a versioned content layer:

```text
assessment_content_revisions
  id
  status: DRAFT | REVIEW_REQUIRED | APPROVED | PUBLISHED | SUPERSEDED
  created_by
  created_at
  approved_by
  approved_at
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
  scoring metadata / construct metadata

assessment_option_revisions
  revision_id
  canonical_option_id
  canonical_question_id
  label_en
  label_es
  sort/scoring metadata

assessment_content_audit
  actor
  action
  revision_id
  timestamp
  deterministic diff / metadata
```

Publishing is an explicit transaction that validates the revision and then updates the canonical live corpus. Draft saves never change a live attempt.

## Validation before publish

At minimum:
- question/option identity validity;
- English authority present;
- Spanish coverage if the question is publishable bilingually;
- qtype-specific requirements;
- no duplicate positions/IDs;
- scoring/color totals within approved rules;
- construct/dimension coverage;
- 50-question composition simulator/regression checks;
- known-defect checks;
- deterministic diff against current published revision.

## Analytics

Analytics are query/service projections over canonical quiz data, not manually maintained counters.

Public metric:
- completed assessments = attempts with a valid completed result state.

Admin metrics can include:
- attempts started;
- completed assessments;
- completion rate;
- activity by day/week/month;
- English/Spanish usage;
- primary result distribution;
- primary + secondary combinations;
- score margins and tie rates;
- per-question selection distributions;
- item discrimination/health indicators once statistically justified;
- abandonment position.

Do not surface pseudo-scientific validation claims. Statistical quality metrics should be labeled for what they actually measure.

## Authorization boundaries

Initial roles should stay simple:
- OWNER: all administration + publish authority.
- EDITOR: draft/edit content, no publication.
- ANALYST: read analytics only.

Avoid implementing a broad role system until there is a real use case.
