import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const attempt_id = searchParams.get("attempt_id");

    // language: default to English unless explicitly "es"
    const lang = searchParams.get("lang") === "es" ? "es" : "en";

    if (!attempt_id) {
      return NextResponse.json({ error: "Missing attempt_id" }, { status: 400 });
    }

    // 1) Get the picked questions for this attempt (in position order)
    const { data: aqRows, error: aqErr } = await supabase
      .from("quiz_attempt_questions")
      .select("position, qtype, question_id")
      .eq("attempt_id", attempt_id)
      .order("position", { ascending: true });

    if (aqErr) throw aqErr;

    const questionIds = (aqRows ?? []).map((r) => r.question_id);
    if (!questionIds.length) {
      return NextResponse.json({ attempt_id, questions: [] });
    }

    // 2) Load question prompts (include Spanish column)
    const { data: qRows, error: qErr } = await supabase
      .from("questions")
      .select("id, prompt, prompt_es, likert_color")
      .in("id", questionIds);

    if (qErr) throw qErr;

    const qById = new Map<string, any>();
    (qRows ?? []).forEach((q) => qById.set(q.id, q));

    // 3) For SINGLE questions, load all options + the per-attempt randomized ordering
    const singleQuestionIds = (aqRows ?? [])
      .filter((r) => r.qtype === "single")
      .map((r) => r.question_id);

    let optionsByQuestionId = new Map<string, any[]>();

    if (singleQuestionIds.length) {
      // 3a) All options for those questions (include Spanish label column)
      const { data: optRows, error: optErr } = await supabase
        .from("question_options")
        .select("id, question_id, label, label_es, red, blue, yellow, green")
        .in("question_id", singleQuestionIds);

      if (optErr) throw optErr;

      const optById = new Map<string, any>();
      (optRows ?? []).forEach((o) => optById.set(o.id, o));

      // 3b) Attempt-specific ordering table
      // IMPORTANT: this table uses sort_order (NOT position)
      const { data: orderRows, error: orderErr } = await supabase
        .from("quiz_attempt_option_order")
        .select("question_id, option_id, sort_order")
        .eq("attempt_id", attempt_id)
        .in("question_id", singleQuestionIds)
        .order("sort_order", { ascending: true });

      if (orderErr) throw orderErr;

      // Build ordered option arrays
      const grouped = new Map<string, any[]>();
      (orderRows ?? []).forEach((r) => {
        const opt = optById.get(r.option_id);
        if (!opt) return;

        const arr = grouped.get(r.question_id) ?? [];
        arr.push({
          id: opt.id,
          label: lang === "es" ? (opt.label_es ?? opt.label) : opt.label,
          red: opt.red,
          blue: opt.blue,
          yellow: opt.yellow,
          green: opt.green,
          sort_order: r.sort_order ?? 0,
        });
        grouped.set(r.question_id, arr);
      });

      // Fallback: if any question somehow has no order rows, use raw options in original order
      for (const qid of singleQuestionIds) {
        if (!grouped.has(qid)) {
          const fallback = (optRows ?? [])
            .filter((o) => o.question_id === qid)
            .map((o, idx) => ({
              id: o.id,
              label: lang === "es" ? (o.label_es ?? o.label) : o.label,
              red: o.red,
              blue: o.blue,
              yellow: o.yellow,
              green: o.green,
              sort_order: idx + 1,
            }));
          grouped.set(qid, fallback);
        }
      }

      optionsByQuestionId = grouped;
    }

    // 4) Shape response exactly how your UI expects it
    const questions = (aqRows ?? []).map((r) => {
      const q = qById.get(r.question_id);
      const prompt =
        lang === "es" ? (q?.prompt_es ?? q?.prompt ?? "") : (q?.prompt ?? "");

      return {
        position: r.position,
        qtype: r.qtype,
        id: r.question_id,
        prompt,
        likert_color: q?.likert_color ?? null,
        options:
          r.qtype === "single"
            ? optionsByQuestionId.get(r.question_id) ?? []
            : [],
      };
    });

    return NextResponse.json({ attempt_id, questions });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
