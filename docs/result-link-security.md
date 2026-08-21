# Result-link security options

Current production behavior treats an attempt UUID in `?attempt_id=` as a bearer capability. Anyone possessing it can retrieve the recomputed result. UUID entropy prevents practical enumeration but forwarding, analytics leakage, screenshots, or browser-history synchronization can disclose a link.

The database design is policy-neutral: results remain deterministic from attempt/answer rows and no table is made public. Both options use the same `viago_quiz` tables and server API.

## Option A — preserve shareable historical links

Keep legacy UUID links readable through `/api/results`. For newly shared links, preferably issue an HMAC-signed token containing attempt ID, purpose, and optional expiry. The server validates the signature before using service-role authority. Existing unsigned historical links can remain supported in a narrowly scoped legacy path, with rate limiting and no answer-write authority.

## Option B — require attempt authorization

Set a high-entropy `QUIZ_ATTEMPT_TOKEN_SECRET` and `QUIZ_REQUIRE_ATTEMPT_TOKEN=true`. `/api/start` already issues a signed HttpOnly, SameSite=Lax cookie bound to one attempt; attempt, answer, progress, finish, and results endpoints validate it. A result URL opened in a different browser will return 403 unless a separate signed share token is introduced.

The switch is configuration/policy work, not a database redesign. Until the owner decides, enforcement remains off and current result URLs keep working.
