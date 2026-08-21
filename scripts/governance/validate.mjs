import fs from "node:fs";

const registry = fs.readFileSync("docs/platform/applications.yaml", "utf8");
for (const value of ["jameskerski/viago-quiz", "jameskerski/viago-escape-operations", "viago_quiz", "shared-viago-supabase"]) {
  if (!registry.includes(value)) throw new Error(`Application registry missing ${value}`);
}

const target = fs.readFileSync("supabase/migrations/20260821000200_viago_quiz_target.sql", "utf8");
const stripped = target.replace(/--.*$/gm, "").replace(/'[^']*'/g, "''");
const qualified = [...stripped.matchAll(/\b(?:create|alter|drop|grant|revoke|insert into|delete from)\s+(?:table\s+|schema\s+|view\s+|function\s+|all tables in schema\s+|all functions in schema\s+)?([a-z_][a-z0-9_]*)\./gi)].map(match => match[1]);
for (const schema of qualified) if (schema !== "viago_quiz") throw new Error(`Quiz target migration touches forbidden schema ${schema}`);
if (/\b(public\.(?:travelers|escapes|booking_groups|documents|evidence|flights|history_events|issues))\b/i.test(target)) {
  throw new Error("Quiz migration references a protected Traveler object");
}

const temporary = fs.readFileSync("docs/platform/temporary-resources.yaml", "utf8");
if (!temporary.includes("resources: []")) throw new Error("Temporary resource entries require schema validation before use");
console.log("Application ownership and schema-boundary governance checks pass.");
