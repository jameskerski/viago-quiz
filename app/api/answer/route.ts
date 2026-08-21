// app/api/answer/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdminClient";
import { authorizeAttempt } from "@/lib/attemptCapability";
import { quizWritesFrozen } from "@/lib/writeFreeze";

type Body =
  | { attempt_id: string; question_id: string; qtype: "likert"; likert_value: number }
  | { attempt_id: string; question_id: string; qtype: "single"; option_id: string };

export async function POST(req: Request) {
  if (quizWritesFrozen()) {
    return NextResponse.json(
      { error: "Quiz maintenance is in progress. Please try again shortly." },
      { status: 503, headers: { "Retry-After": "60" } }
    );
  }

  try {
    const body = (await req.json()) as Body;

    if (!body?.attempt_id || !body?.question_id || !body?.qtype) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!authorizeAttempt(req, body.attempt_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: assignment, error: assignmentError } = await supabase
      .from("quiz_attempt_questions")
      .select("qtype")
      .eq("attempt_id", body.attempt_id)
      .eq("question_id", body.question_id)
      .maybeSingle();
    if (assignmentError) throw assignmentError;
    if (!assignment || assignment.qtype !== body.qtype) {
      return NextResponse.json({ error: "Question is not assigned to this attempt" }, { status: 400 });
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

    const { data: option, error: optionError } = await supabase
      .from("question_options")
      .select("id")
      .eq("id", body.option_id)
      .eq("question_id", body.question_id)
      .eq("is_active", true)
      .maybeSingle();
    if (optionError) throw optionError;
    if (!option) return NextResponse.json({ error: "Option does not belong to this question" }, { status: 400 });

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
