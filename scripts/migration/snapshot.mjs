import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { TABLES, PK, hashRows, requireEnv } from "./lib.mjs";

requireEnv(["QUIZ_SOURCE_URL", "QUIZ_SOURCE_SERVICE_ROLE_KEY"]);
const out = path.resolve(process.argv[2] || "artifacts/quiz-snapshot");
const cutoff = process.env.QUIZ_SNAPSHOT_CUTOFF || new Date().toISOString();
const client = createClient(process.env.QUIZ_SOURCE_URL, process.env.QUIZ_SOURCE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
await fs.mkdir(out, { recursive: true });

async function allRows(table) {
  const rows = []; const pageSize = 1000; let from = 0;
  const order = PK[table];
  while (true) {
    let query = client.from(table).select("*").range(from, from + pageSize - 1);
    for (const column of order) query = query.order(column, { ascending: true });
    if (table === "quiz_attempts") query = query.lte("created_at", cutoff);
    const { data, error } = await query; if (error) throw error;
    rows.push(...data); if (data.length < pageSize) break; from += pageSize;
  }
  return rows;
}

const manifest = { version: 1, source_project: "zkmkenhziznafbgmcayp", cutoff, tables: {} };
const attempts = await allRows("quiz_attempts");
const attemptIds = new Set(attempts.map(row => row.id));
for (const table of TABLES) {
  let rows = table === "quiz_attempts" ? attempts : await allRows(table);
  if (table.startsWith("quiz_attempt_")) rows = rows.filter(row => attemptIds.has(row.attempt_id));
  await fs.writeFile(path.join(out, `${table}.ndjson`), rows.map(r => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
  manifest.tables[table] = { rows: rows.length, sha256: hashRows(rows), pk: PK[table] };
}
await fs.writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(JSON.stringify(manifest, null, 2));
