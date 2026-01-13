import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const attempt_id = searchParams.get("attempt_id");

  if (!attempt_id) {
    return NextResponse.json({ error: "attempt_id is required" }, { status: 400 });
  }

  // total questions assigned to this attempt
  const { count: total, error: totalErr } = await supabase
    .from("quiz_attempt_questions")
    .select("*", { count: "exact", head: true })
    .eq("attempt_id", attempt_id);

  if (totalErr) {
    return NextResponse.json({ error: totalErr.message }, { status: 500 });
  }

  // total answers submitted (1 row per answered question)
  const { count: answered, error: ansErr } = await supabase
    .from("quiz_attempt_answers")
    .select("*", { count: "exact", head: true })
    .eq("attempt_id", attempt_id);

  if (ansErr) {
    return NextResponse.json({ error: ansErr.message }, { status: 500 });
  }

  const totalNum = total ?? 0;
  const answeredNum = answered ?? 0;

  return NextResponse.json({
    attempt_id,
    total: totalNum,
    answered: answeredNum,
    remaining: Math.max(0, totalNum - answeredNum),
    is_complete: totalNum > 0 && answeredNum >= totalNum,
  });
}