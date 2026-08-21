import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabaseAdminClient";
import { authorizeAttempt } from "@/lib/attemptCapability";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const attempt_id = searchParams.get("attempt_id");

  if (!attempt_id) {
    return NextResponse.json(
      { error: "attempt_id is required" },
      { status: 400 }
    );
  }
  if (!authorizeAttempt(req, attempt_id)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await supabase.rpc("results_for_attempt", {
    p_attempt_id: attempt_id,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
