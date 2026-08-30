import { NextResponse } from 'next/server';
import { authorizeAttempt } from '@/lib/attemptCapability';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdminClient';
import { quizWritesFrozen } from '@/lib/writeFreeze';

export const runtime = 'nodejs';

type ScoreRow = { color: string; total_score: number };

export async function POST(request: Request) {
  if (quizWritesFrozen()) return NextResponse.json({ error: 'Quiz writes are temporarily paused.' }, { status: 503 });

  try {
    const body = await request.json().catch(() => ({}));
    const attemptId = typeof body.attempt_id === 'string' ? body.attempt_id : '';
    const language = body.language === 'es' ? 'es' : body.language === 'en' ? 'en' : null;
    const phase = body.phase === 'complete' ? 'complete' : body.phase === 'start' ? 'start' : null;
    if (!attemptId || !language || !phase) return NextResponse.json({ error: 'attempt_id, language, and phase are required' }, { status: 400 });
    if (!authorizeAttempt(request, attemptId)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (phase === 'start') {
      const { error } = await supabase.from('assessment_attempt_metadata').upsert(
        { attempt_id: attemptId, language, updated_at: new Date().toISOString() },
        { onConflict: 'attempt_id' },
      );
      if (error) throw error;
      return NextResponse.json({ ok: true, attempt_id: attemptId, phase });
    }

    const { count: assigned, error: assignedError } = await supabase
      .from('quiz_attempt_questions').select('*', { count: 'exact', head: true }).eq('attempt_id', attemptId);
    if (assignedError) throw assignedError;
    const { count: answered, error: answeredError } = await supabase
      .from('quiz_attempt_answers').select('*', { count: 'exact', head: true }).eq('attempt_id', attemptId);
    if (answeredError) throw answeredError;
    if (assigned !== 50 || answered !== 50) return NextResponse.json({ error: 'Attempt is not complete' }, { status: 409 });

    const { data, error: resultsError } = await supabase.rpc('results_for_attempt', { p_attempt_id: attemptId });
    if (resultsError) throw resultsError;
    const scores = Object.fromEntries(((data?.results || []) as ScoreRow[]).map((row) => [row.color, Number(row.total_score)]));
    if (!data?.winner_color || ['red', 'blue', 'yellow', 'green'].some((color) => !Number.isFinite(scores[color]))) {
      throw new Error('Canonical result payload is incomplete');
    }
    const now = new Date().toISOString();
    const { error } = await supabase.from('assessment_attempt_metadata').upsert({
      attempt_id: attemptId,
      language,
      completed_at: now,
      winner_color: data.winner_color,
      red_score: scores.red,
      blue_score: scores.blue,
      yellow_score: scores.yellow,
      green_score: scores.green,
      updated_at: now,
    }, { onConflict: 'attempt_id' });
    if (error) throw error;
    return NextResponse.json({ ok: true, attempt_id: attemptId, phase });
  } catch (cause) {
    return NextResponse.json({ error: cause instanceof Error ? cause.message : String(cause) }, { status: 500 });
  }
}
