import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const attempt_id = body?.attempt_id;

    if (!attempt_id) {
      return NextResponse.json({ error: "attempt_id is required" }, { status: 400 });
    }

    // total questions in attempt
    const { count: total, error: totalErr } = await supabase
      .from("quiz_attempt_questions")
      .select("*", { count: "exact", head: true })
      .eq("attempt_id", attempt_id);

    if (totalErr) throw totalErr;

    // total answers in attempt
    const { count: answered, error: ansErr } = await supabase
      .from("quiz_attempt_answers")
      .select("*", { count: "exact", head: true })
      .eq("attempt_id", attempt_id);

    if (ansErr) throw ansErr;

    const totalNum = total ?? 0;
    const answeredNum = answered ?? 0;

    if (totalNum === 0) {
      return NextResponse.json(
        { error: "No questions assigned to this attempt." },
        { status: 400 }
      );
    }

    if (answeredNum < totalNum) {
      return NextResponse.json(
        {
          error: "Attempt not complete",
          attempt_id,
          total: totalNum,
          answered: answeredNum,
          remaining: totalNum - answeredNum,
          is_complete: false,
        },
        { status: 409 }
      );
    }

    // Call your DB function that returns { attempt_id, results, winner_color }
    const { data, error: rpcErr } = await supabase.rpc("results_for_attempt", {
      p_attempt_id: attempt_id,
    });

    if (rpcErr) throw rpcErr;

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}