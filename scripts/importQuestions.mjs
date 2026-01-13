import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Env ===
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in .env.local");
if (!SERVICE_ROLE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");

// IMPORTANT: service role ONLY (for imports)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// === CSV format we expect ===
// prompt,is_active,red_answer,blue_answer,yellow_answer,green_answer
// NOTE: use quotes if your text includes commas.
function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  const rows = [];
  for (const line of lines) {
    // basic CSV parser supporting quotes
    const out = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      const next = line[i + 1];

      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
        continue;
      }
      if (ch === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (ch === "," && !inQuotes) {
        out.push(cur.trim());
        cur = "";
        continue;
      }
      cur += ch;
    }
    out.push(cur.trim());
    rows.push(out);
  }
  return rows;
}

function toBool(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "true" || s === "1" || s === "yes" || s === "y";
}

function weightsFor(color) {
  // 2 points to chosen color, 0 to others (matches your current data)
  const w = { weight_red: 0, weight_blue: 0, weight_yellow: 0, weight_green: 0 };
  if (color === "red") w.weight_red = 2;
  if (color === "blue") w.weight_blue = 2;
  if (color === "yellow") w.weight_yellow = 2;
  if (color === "green") w.weight_green = 2;
  return w;
}

async function upsertQuestionByPrompt(prompt, isActive) {
  // Try find existing question by prompt
  const { data: existing, error: findErr } = await supabase
    .from("questions")
    .select("id")
    .eq("prompt", prompt)
    .maybeSingle();

  if (findErr) throw findErr;

  if (existing?.id) {
    // keep it updated
    const { error: updErr } = await supabase
      .from("questions")
      .update({ is_active: isActive })
      .eq("id", existing.id);

    if (updErr) throw updErr;
    return existing.id;
  }

  const { data: inserted, error: insErr } = await supabase
    .from("questions")
    .insert({ prompt, is_active: isActive })
    .select("id")
    .single();

  if (insErr) throw insErr;
  return inserted.id;
}

async function replaceAnswers(questionId, answersInOrder) {
  // delete old answers for that question, then insert new
  const { error: delErr } = await supabase.from("answers").delete().eq("question_id", questionId);
  if (delErr) throw delErr;

  const rows = answersInOrder.map((a, idx) => ({
    question_id: questionId,
    answer_text: a.text,
    sort_order: idx + 1,
    ...weightsFor(a.color),
  }));

  const { error: insErr } = await supabase.from("answers").insert(rows);
  if (insErr) throw insErr;
}

async function main() {
  // default CSV location at project root
  const csvPath = path.join(process.cwd(), "questions.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`questions.csv not found at: ${csvPath}`);
  }

  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(raw);

  // allow header row
  const first = rows[0]?.map((s) => s.toLowerCase()) || [];
  const hasHeader =
    first.includes("prompt") &&
    (first.includes("is_active") || first.includes("active")) &&
    first.join(",").includes("red_answer");

  const dataRows = hasHeader ? rows.slice(1) : rows;

  let imported = 0;

  for (const r of dataRows) {
    const [prompt, isActiveRaw, redA, blueA, yellowA, greenA] = r;

    if (!prompt) continue;

    // If someone forgot answer columns, fail loudly (so you don’t “think” it worked)
    if (!redA || !blueA || !yellowA || !greenA) {
      throw new Error(
        `Row is missing one or more answers. Expected 6 columns: prompt,is_active,red,blue,yellow,green\nPrompt: ${prompt}`
      );
    }

    const isActive = toBool(isActiveRaw);

    const qid = await upsertQuestionByPrompt(prompt, isActive);

    await replaceAnswers(qid, [
      { color: "red", text: redA },
      { color: "blue", text: blueA },
      { color: "yellow", text: yellowA },
      { color: "green", text: greenA },
    ]);

    imported++;
    console.log(`✅ Imported: ${prompt}`);
  }

  console.log(`\n✅ Import complete. Questions imported: ${imported}`);
}

main().catch((e) => {
  console.error("\n❌ Import failed:", e?.message || e);
  process.exit(1);
});