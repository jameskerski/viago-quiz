# Archived rollback-migration tooling

These utilities are historical recovery evidence from the 2026 VIAGO hosted migration. They are not a production deployment path.

- Canonical production is `xombtulaktoprxxtkbcy.viago_quiz`.
- `zkmkenhziznafbgmcayp.public` is historical and retirement-pending.
- Data from the historical project must not be merged into canonical production.
- Executable migration utilities fail closed unless an OWNER explicitly authorizes an isolated recovery and sets `VIAGO_ENABLE_ARCHIVED_MIGRATION_TOOLING=OWNER_AUTHORIZED_ISOLATED_RECOVERY_ONLY`.
- Write-capable tooling additionally refuses `xombtulaktoprxxtkbcy` as its target.

The structural artifact validator and shared result-contract helpers remain usable because they do not connect to either hosted database.
