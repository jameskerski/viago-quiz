# VIAGO shared database governance

Each application owns one repository and one schema. A migration may create or alter objects only in the schema declared for that application in `applications.yaml`. The existing Traveler domain in `public` is protected; quiz migrations own only `viago_quiz`.

Shared-project changes move through one integration lane: application PR → schema ownership check → SQL/security review → disposable-project validation → approved shared-project migration → reconciliation evidence. No dashboard-only production edits are canonical. Emergency edits must be reconstructed immediately as a migration.

CI should reject SQL that contains a schema outside the application's allowlist, unqualified object names, grants to `anon`/`authenticated` without an explicit reviewed exception, `security definer` without a fixed empty `search_path`, or a temporary resource missing registry metadata.
