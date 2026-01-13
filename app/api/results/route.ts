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
    return NextResponse.json(
      { error: "attempt_id is required" },
      { status: 400 }
    );
  }

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