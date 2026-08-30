# Archived rollback-migration tooling

These utilities are historical recovery evidence from the 2026 VIAGO hosted migration. They are not a production deployment path.

- Canonical production is `xombtulaktoprxxtkbcy.viago_quiz`.
- `zkmkenhziznafbgmcayp.public` is historical and was permanently retired on 2026-08-29.
- Data from the historical project must not be merged into canonical production.
- Executable source migration utilities fail closed because the hosted source no longer exists. The immutable OWNER archive is the only recovery input.
- Any archive restoration requires separate OWNER authorization and an isolated recovery project.
- Write-capable tooling additionally refuses `xombtulaktoprxxtkbcy` as its target.

The structural artifact validator and shared result-contract helpers remain usable because they do not connect to either hosted database.
