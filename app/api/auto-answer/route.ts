import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const attempt_id = body?.attempt_id as string | undefined;

    if (!attempt_id) {
      return NextResponse.json({ error: "attempt_id is required" }, { status: 400 });
    }

    // 1) all questions on this attempt
    const { data: aqRows, error: aqErr } = await supabase
      .from("quiz_attempt_questions")
      .select("question_id,qtype,position")
      .eq("attempt_id", attempt_id)
      .order("position", { ascending: true });

    if (aqErr) throw aqErr;

    // 2) already answered
    const { data: answeredRows, error: ansErr } = await supabase
      .from("quiz_attempt_answers")
      .select("question_id")
      .eq("attempt_id", attempt_id);

    if (ansErr) throw ansErr;

    const answeredSet = new Set((answeredRows ?? []).map((r) => r.question_id));

    // 3) collect SINGLE question ids we still need to answer
    const pendingSingleQids = (aqRows ?? [])
      .filter((r) => r.qtype === "single" && !answeredSet.has(r.question_id))
      .map((r) => r.question_id);

    // 4) fetch options for those single questions (no relationship needed)
    let optionsByQuestion: Record<string, Array<{ id: string; sort_order: number }>> = {};
    if (pendingSingleQids.length) {
      const { data: optRows, error: optErr } = await supabase
        .from("question_options")
        .select("id,question_id,sort_order")
        .in("question_id", pendingSingleQids)
        .order("sort_order", { ascending: true });

      if (optErr) throw optErr;

      optionsByQuestion = (optRows ?? []).reduce((acc, row) => {
        (acc[row.question_id] ??= []).push({ id: row.id, sort_order: row.sort_order });
        return acc;
      }, {} as typeof optionsByQuestion);
    }

    // 5) build answer inserts for anything not answered yet
    const inserts: Array<{
      attempt_id: string;
      question_id: string;
      qtype: "likert" | "single";
      likert_value: number | null;
      option_id: string | null;
    }> = [];

    for (const row of aqRows ?? []) {
      const qid = row.question_id as string;
      if (answeredSet.has(qid)) continue;

      if (row.qtype === "likert") {
        inserts.push({
          attempt_id,
          question_id: qid,
          qtype: "likert",
          likert_value: randInt(0, 4),
          option_id: null,
        });
      } else if (row.qtype === "single") {
        const opts = optionsByQuestion[qid] ?? [];
        if (!opts.length) continue;

        const picked = opts[randInt(0, opts.length - 1)];
        inserts.push({
          attempt_id,
          question_id: qid,
          qtype: "single",
          option_id: picked.id,
          likert_value: null,
        });
      }
    }

    if (!inserts.length) {
      return NextResponse.json({ ok: true, inserted: 0, message: "Nothing to auto-answer." });
    }

    const { error: insErr } = await supabase.from("quiz_attempt_answers").insert(inserts);
    if (insErr) throw insErr;

    return NextResponse.json({ ok: true, inserted: inserts.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}