import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdminClient";
import { ATTEMPT_COOKIE, attemptCookieOptions, issueAttemptCapability } from "@/lib/attemptCapability";
import { quizWritesFrozen } from "@/lib/writeFreeze";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Helpful so GET doesn't look "broken" if you visit it in browser
export async function GET() {
  return NextResponse.json({ error: "Use POST /api/start" }, { status: 405 });
}

export async function POST() {
  if (quizWritesFrozen()) {
    return NextResponse.json(
      { error: "Quiz maintenance is in progress. Please try again shortly." },
      { status: 503, headers: { "Retry-After": "60" } }
    );
  }

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

    const response = NextResponse.json({ attempt_id: attempt.id });
    if (process.env.QUIZ_ATTEMPT_TOKEN_SECRET) {
      response.cookies.set(ATTEMPT_COOKIE, issueAttemptCapability(attempt.id), attemptCookieOptions);
    }
    return response;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
