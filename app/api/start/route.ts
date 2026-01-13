import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Helpful so GET doesn't look "broken" if you visit it in browser
export async function GET() {
  return NextResponse.json({ error: "Use POST /api/start" }, { status: 405 });
}

export async function POST() {
  try {
    // 1) create attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from("quiz_attempts")
      .insert([{}])
      .select("id")
      .single();

    if (attemptErr) throw attemptErr;

    // 2) pick questions (NEW: 50 total)
    const { error: pickErr } = await supabase.rpc("pick_balanced_questions_50", {
      p_attempt_id: attempt.id,
    });

    if (pickErr) throw pickErr;

    // 3) verify we got all 50
    const { count, error: countErr } = await supabase
      .from("quiz_attempt_questions")
      .select("*", { count: "exact", head: true })
      .eq("attempt_id", attempt.id);

    if (countErr) throw countErr;
    if (count !== 50) throw new Error(`Expected 50 picked questions, got ${count}`);

    return NextResponse.json({ attempt_id: attempt.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}