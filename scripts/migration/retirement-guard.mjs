const authorization = process.env.VIAGO_ENABLE_ARCHIVED_MIGRATION_TOOLING;
const required = "OWNER_AUTHORIZED_ISOLATED_RECOVERY_ONLY";

export function assertArchivedMigrationAuthorized({ source = false, target = false } = {}) {
  if (authorization !== required) {
    throw new Error(
      "Archived VIAGO migration tooling is disabled. It may run only for an explicitly OWNER-authorized isolated recovery."
    );
  }

  if (source) {
    throw new Error(
      "The historical VIAGO source project was permanently retired. Use the immutable OWNER archive only in a separately authorized isolated recovery."
    );
  }

  if (target) {
    const targetUrl = process.env.QUIZ_TARGET_URL || "";
    if (!targetUrl || targetUrl.includes("xombtulaktoprxxtkbcy.supabase.co")) {
      throw new Error("Archived migration tooling must never target canonical production; use an isolated recovery project.");
    }
  }
}
