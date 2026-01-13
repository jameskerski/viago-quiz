import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ ok: false, error: "Missing sessionId" }, { status: 400 });
  }

  // Load session question order
  const { data: session, error: sErr } = await supabaseAdmin
    .from("quiz_sessions")
    .select("id, question_ids")
    .eq("id", sessionId)
    .single();

  if (sErr) return NextResponse.json({ ok: false, error: sErr.message }, { status: 500 });

  const total = session?.question_ids?.length || 0;
  if (!total) {
    return NextResponse.json({ ok: false, error: "Session has no questions" }, { status: 400 });
  }

  // Each answered question should produce 4 rows in quiz_rankings
  const { count: rankingCount, error: cErr } = await supabaseAdmin
    .from("quiz_rankings")
    .select("*", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (cErr) return NextResponse.json({ ok: false, error: cErr.message }, { status: 500 });

  const index = Math.floor((rankingCount || 0) / 4);

  if (index >= total) {
    return NextResponse.json({ ok: true, done: true, index, total });
  }

  const questionId = session.question_ids[index];

  const { data: q, error: qErr } = await supabaseAdmin
    .from("questions")
    .select("id, prompt")
    .eq("id", questionId)
    .single();

  if (qErr) return NextResponse.json({ ok: false, error: qErr.message }, { status: 500 });

  // Fetch answers (base set)
  const { data: rawAnswers, error: aErr } = await supabaseAdmin
    .from("answers")
    .select("id, answer_text, sort_order")
    .eq("question_id", questionId);

  if (aErr) return NextResponse.json({ ok: false, error: aErr.message }, { status: 500 });

  const answers = rawAnswers || [];
  if (answers.length !== 4) {
    return NextResponse.json(
      { ok: false, error: `Expected 4 answers for question ${questionId}, found ${answers.length}` },
      { status: 500 }
    );
  }

  // Check if we already locked a shuffled order for this session/question
  const { data: ord, error: oErr } = await supabaseAdmin
    .from("quiz_answer_orders")
    .select("answer_ids")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (oErr) return NextResponse.json({ ok: false, error: oErr.message }, { status: 500 });

  let orderedAnswers = answers;

  if (ord?.answer_ids?.length === 4) {
    const map = new Map(answers.map((a) => [a.id, a]));
    orderedAnswers = ord.answer_ids.map((id: string) => map.get(id)).filter(Boolean) as any;
  } else {
    const shuffled = shuffle(answers);
    const answerIds = shuffled.map((a) => a.id);

    const { error: insErr } = await supabaseAdmin
      .from("quiz_answer_orders")
      .upsert([{ session_id: sessionId, question_id: questionId, answer_ids: answerIds }], {
        onConflict: "session_id,question_id",
      });

    if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

    orderedAnswers = shuffled;
  }

  return NextResponse.json({
    ok: true,
    done: false,
    index,
    total,
    question: q,
    answers: orderedAnswers.map((a) => ({ id: a.id, answer_text: a.answer_text })),
  });
}