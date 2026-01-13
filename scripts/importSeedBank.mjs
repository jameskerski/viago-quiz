import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import dotenv from "dotenv";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
if (!SERVICE_KEY) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const DOWNLOADS = path.join(os.homedir(), "Downloads");

// ✅ Put the EXACT filenames you have in Downloads here:
const FILES = {
  likert: "likert_120_seed.csv",
  tf: "tf_add20_seed.csv",
  single: "single_choice_30_seed.csv",
};

function loadCsvFromDownloads(filename) {
  const full = path.join(DOWNLOADS, filename);
  if (!fs.existsSync(full)) throw new Error(`CSV not found in Downloads: ${full}`);
  const raw = fs.readFileSync(full, "utf8");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

function pointsForColor(color, pts = 4) {
  const c = String(color || "").toLowerCase().trim();
  return {
    red: c === "red" ? pts : 0,
    blue: c === "blue" ? pts : 0,
    yellow: c === "yellow" ? pts : 0,
    green: c === "green" ? pts : 0,
  };
}

async function insertQuestion(q) {
  const { data, error } = await supabase
    .from("questions")
    .insert([q])
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function insertOptions(rows) {
  const { error } = await supabase.from("question_options").insert(rows);
  if (error) throw error;
}

async function wipeSeeded() {
  console.log("🧹 Wiping existing seeded questions (likert/tf/single) + options...");

  // Grab ids first
  const { data: qs, error: qErr } = await supabase
    .from("questions")
    .select("id,qtype")
    .in("qtype", ["likert", "tf", "single"]);

  if (qErr) throw qErr;

  if (!qs || qs.length === 0) {
    console.log("✅ Nothing to wipe.");
    return;
  }

  const ids = qs.map((q) => q.id);

  // Delete options first (FK)
  const { error: oErr } = await supabase.from("question_options").delete().in("question_id", ids);
  if (oErr) throw oErr;

  // Delete questions
  const { error: dErr } = await supabase.from("questions").delete().in("id", ids);
  if (dErr) throw dErr;

  console.log(`✅ Wiped ${ids.length} questions (and their options).`);
}

async function importLikert() {
  console.log("➡️ Importing Likert...");
  const rows = loadCsvFromDownloads(FILES.likert);

  let qCount = 0;

  for (const r of rows) {
    const qtype = String(r.qtype || "").toLowerCase().trim();
    if (qtype !== "likert") throw new Error(`Bad qtype "${r.qtype}" — expected likert`);

    // IMPORTANT: your CSV uses: category, likert_color, prompt, qtype, is_active
    await insertQuestion({
      qtype: "likert",
      is_active: String(r.is_active).toLowerCase().trim() === "true",
      category: r.category || null,
      likert_color: (r.likert_color || "").toLowerCase().trim() || null,
      prompt: r.prompt,
    });

    qCount++;
  }

  console.log(`✅ Likert imported: ${qCount}`);
}

async function importTrueFalse() {
  console.log("➡️ Importing True/False...");
  const rows = loadCsvFromDownloads(FILES.tf);

  let qCount = 0;

  for (const r of rows) {
    const qtype = String(r.qtype || "").toLowerCase().trim();
    if (qtype !== "tf") throw new Error(`Bad qtype "${r.qtype}" — expected tf`);

    const qId = await insertQuestion({
      qtype: "tf",
      is_active: String(r.is_active).toLowerCase().trim() === "true",
      category: r.category || null,
      prompt: r.prompt,
    });

    // tf CSV format we’ve been using: true_label,true_color,false_label,false_color
    const opts = [
      { label: r.true_label || "True", color: r.true_color, sort_order: 1 },
      { label: r.false_label || "False", color: r.false_color, sort_order: 2 },
    ];

    const optionRows = opts.map((o) => ({
      question_id: qId,
      label: o.label,
      sort_order: o.sort_order,
      is_active: true,
      ...pointsForColor(o.color, 4),
    }));

    await insertOptions(optionRows);
    qCount++;
  }

  console.log(`✅ True/False imported: ${qCount}`);
}

async function importSingleChoice() {
  console.log("➡️ Importing Single-choice...");
  const rows = loadCsvFromDownloads(FILES.single);

  let qCount = 0;

  for (const r of rows) {
    const qtype = String(r.qtype || "").toLowerCase().trim();
    if (qtype !== "single") throw new Error(`Bad qtype "${r.qtype}" — expected single`);

    const qId = await insertQuestion({
      qtype: "single",
      is_active: String(r.is_active).toLowerCase().trim() === "true",
      category: r.category || null,
      prompt: r.prompt,
    });

    const opts = [
      { label: r.opt1_label, color: r.opt1_color, sort_order: 1 },
      { label: r.opt2_label, color: r.opt2_color, sort_order: 2 },
      { label: r.opt3_label, color: r.opt3_color, sort_order: 3 },
      { label: r.opt4_label, color: r.opt4_color, sort_order: 4 },
    ].filter((o) => o.label && o.label.trim().length);

    if (opts.length < 2) throw new Error(`Single-choice row has <2 options. Prompt: ${r.prompt}`);

    const optionRows = opts.map((o) => ({
      question_id: qId,
      label: o.label,
      sort_order: o.sort_order,
      is_active: true,
      ...pointsForColor(o.color, 4),
    }));

    await insertOptions(optionRows);
    qCount++;
  }

  console.log(`✅ Single-choice imported: ${qCount}`);
}

async function run() {
  await wipeSeeded();
  await importLikert();
  await importTrueFalse();
  await importSingleChoice();
  console.log("🎉 Done: wiped + reimported likert/tf/single from Downloads.");
}

run().catch((e) => {
  console.error("❌ Import failed:", e?.message || e);
  process.exit(1);
});