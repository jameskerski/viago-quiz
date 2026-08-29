const authorization = process.env.VIAGO_ENABLE_ARCHIVED_MIGRATION_TOOLING;
const required = "OWNER_AUTHORIZED_ISOLATED_RECOVERY_ONLY";

export function assertArchivedMigrationAuthorized({ source = false, target = false } = {}) {
  if (authorization !== required) {
    throw new Error(
      "Archived VIAGO migration tooling is disabled. It may run only for an explicitly OWNER-authorized isolated recovery."
    );
  }

  if (source) {
    const sourceUrl = process.env.QUIZ_SOURCE_URL || "";
    if (!sourceUrl.includes("zkmkenhziznafbgmcayp.supabase.co")) {
      throw new Error("Archived source must be the historical rollback project zkmkenhziznafbgmcayp.");
    }
  }

  if (target) {
    const targetUrl = process.env.QUIZ_TARGET_URL || "";
    if (!targetUrl || targetUrl.includes("xombtulaktoprxxtkbcy.supabase.co")) {
      throw new Error("Archived migration tooling must never target canonical production; use an isolated recovery project.");
    }
  }
}
