// app/api/answer/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

type Body =
  | { attempt_id: string; question_id: string; qtype: "likert"; likert_value: number }
  | { attempt_id: string; question_id: string; qtype: "single"; option_id: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    if (!body?.attempt_id || !body?.question_id || !body?.qtype) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (body.qtype === "likert") {
      const v = body.likert_value;
      if (typeof v !== "number" || v < 0 || v > 4) {
        return NextResponse.json({ error: "likert_value must be 0..4" }, { status: 400 });
      }

      const { error } = await supabase.from("quiz_attempt_answers").upsert(
        {
          attempt_id: body.attempt_id,
          question_id: body.question_id,
          qtype: "likert",
          likert_value: v,
          option_id: null,
        },
        { onConflict: "attempt_id,question_id" }
      );

      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    // single-choice
    if (!("option_id" in body) || !body.option_id) {
      return NextResponse.json({ error: "option_id is required for single" }, { status: 400 });
    }

    const { error } = await supabase.from("quiz_attempt_answers").upsert(
      {
        attempt_id: body.attempt_id,
        question_id: body.question_id,
        qtype: "single",
        option_id: body.option_id,
        likert_value: null,
      },
      { onConflict: "attempt_id,question_id" }
    );

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}