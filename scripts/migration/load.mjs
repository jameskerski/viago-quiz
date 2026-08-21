import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { TABLES, requireEnv } from "./lib.mjs";

const dir = path.resolve(process.argv[2] || "artifacts/quiz-snapshot");
const apply = process.argv.includes("--apply");
if (apply) requireEnv(["QUIZ_TARGET_URL", "QUIZ_TARGET_SERVICE_ROLE_KEY"]);
const client = apply ? createClient(process.env.QUIZ_TARGET_URL, process.env.QUIZ_TARGET_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }, db: { schema: "viago_quiz" },
}) : null;
const manifest = JSON.parse(await fs.readFile(path.join(dir, "manifest.json"), "utf8"));
const included = TABLES.filter(table => manifest.tables[table]);
for (const table of included) {
  const raw = await fs.readFile(path.join(dir, `${table}.ndjson`), "utf8");
  const rows = raw.trim() ? raw.trim().split("\n").map(JSON.parse) : [];
  console.log(`${apply ? "loading" : "would load"} ${table}: ${rows.length}`);
  if (!apply) continue;
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await client.from(table).upsert(rows.slice(i, i + 500), { onConflict: manifest.tables[table].pk.join(",") });
    if (error) throw error;
  }
}
if (!apply) console.log("Dry run only. Re-run with --apply after target deployment authorization.");
