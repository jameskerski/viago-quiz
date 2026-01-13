import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

// Rank points: 1st=3, 2nd=2, 3rd=1, 4th=0
const RANK_POINTS: Record<number, number> = { 1: 3, 2: 2, 3: 1, 4: 0 };

type RankedItem = {
  answer_id: string;
  rank: number; // 1..4
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const sessionId = body?.sessionId as string | undefined;
    const questionId = body?.questionId as string | undefined;
    const ranked = body?.ranked as RankedItem[] | undefined;

    if (!sessionId || !questionId) {
      return NextResponse.json(
        { ok: false, error: "Missing sessionId or questionId" },
        { status: 400 }
      );
    }

    if (!Array.isArray(ranked) || ranked.length !== 4) {
      return NextResponse.json(
        { ok: false, error: "ranked must be an array of 4 items" },
        { status: 400 }
      );
    }

    // Validate ranks are exactly 1,2,3,4 with no duplicates
    const ranks = ranked.map((r) => r.rank);
    const validRanks = [1, 2, 3, 4];
    const rankSet = new Set(ranks);

    if (
      rankSet.size !== 4 ||
      !validRanks.every((v) => rankSet.has(v)) ||
      ranked.some((r) => !r.answer_id)
    ) {
      return NextResponse.json(
        { ok: false, error: "Ranks must be 1,2,3,4 exactly and each item needs answer_id" },
        { status: 400 }
      );
    }

    // Upsert each (session_id, question_id, answer_id) with its rank
    const rows = ranked.map((r) => ({
      session_id: sessionId,
      question_id: questionId,
      answer_id: r.answer_id,
      rank: r.rank,
    }));

    const { error: upsertErr } = await supabaseAdmin
      .from("quiz_rankings")
      .upsert(rows, { onConflict: "session_id,question_id,answer_id" });

    if (upsertErr) {
      return NextResponse.json({ ok: false, error: upsertErr.message }, { status: 500 });
    }

    // Optional: return a quick scoring preview for this question
    // (Useful for debugging; safe to remove later)
    const { data: answers, error: ansErr } = await supabaseAdmin
      .from("answers")
      .select("id, weight_red, weight_blue, weight_yellow, weight_green")
      .in("id", ranked.map((r) => r.answer_id));

    if (ansErr) {
      return NextResponse.json({ ok: true, saved: true, debug: { warning: ansErr.message } });
    }

    const weightById = new Map<string, any>();
    (answers || []).forEach((a) => weightById.set(a.id, a));

    const totals = ranked.reduce(
      (acc, r) => {
        const pts = RANK_POINTS[r.rank] ?? 0;
        const a = weightById.get(r.answer_id);
        return {
          red: acc.red + pts * (a?.weight_red ?? 0),
          blue: acc.blue + pts * (a?.weight_blue ?? 0),
          yellow: acc.yellow + pts * (a?.weight_yellow ?? 0),
          green: acc.green + pts * (a?.weight_green ?? 0),
        };
      },
      { red: 0, blue: 0, yellow: 0, green: 0 }
    );

    return NextResponse.json({ ok: true, saved: true, debug: { totals } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}