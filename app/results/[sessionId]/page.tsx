'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Color = 'red' | 'blue' | 'yellow' | 'green';

type ResultsPayload = {
  attempt_id: string;
  winner_color: Color;
  results: { color: Color; total_score: number }[];
};

const colorText: Record<Color, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
  green: 'text-green-400',
};

const DESCRIPTIONS: Record<Color, { definition: string; industry: string }> = {
  red: {
    definition:
      'Reds are driven by progress, challenge, and outcomes. They’re energized by goals, competition, and forward motion. They tend to decide quickly and prefer environments where results are visible and rewarded.',
    industry:
      'Reds push momentum. They respond well to targets and scoreboards. Their unlock is developing others without steamrolling them.',
  },
  blue: {
    definition:
      'Blues are energized by experiences, people, and variety. They enjoy social environments, spontaneity, and opportunities to connect.',
    industry:
      'Blues excel at creating buzz and relationships quickly. They do best with simple systems that keep them consistent.',
  },
  yellow: {
    definition:
      'Yellows are people-centered, values-driven, and loyal. They care about fairness, honesty, and the well-being of others.',
    industry:
      'Yellows build trust and retention. Their growth accelerates when they lean into direct conversations instead of avoiding conflict.',
  },
  green: {
    definition:
      'Greens are analytical, cautious, and structured. They prefer logic over impulse and feel most comfortable with clear expectations.',
    industry:
      'Greens strengthen systems and training. Their growth accelerates when they allow action before every variable feels certain.',
  },
};

export default function ResultsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const attemptId = params.get('attempt_id');

  const [data, setData] = useState<ResultsPayload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!data) return [];
    return [...data.results].sort((a, b) => b.total_score - a.total_score);
  }, [data]);

  useEffect(() => {
    if (!attemptId) {
      setErr('Missing attempt_id');
      return;
    }

    (async () => {
      try {
        setErr(null);
        const res = await fetch(`/api/results?attempt_id=${encodeURIComponent(attemptId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'Failed to load results');
        setData(json);
      } catch (e: any) {
        setErr(e?.message ?? String(e));
      }
    })();
  }, [attemptId]);

  if (err) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="text-red-300">{err}</div>
          <button
            className="mt-4 rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black hover:bg-lime-300 transition"
            onClick={() => router.push('/quiz')}
          >
            Back to Quiz
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-zinc-400">Loading results…</div>
      </main>
    );
  }

  const winner = data.winner_color;

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-xl">
        <div className="mb-4 text-lime-400 font-semibold tracking-wide">VIAGO • Results</div>

        <h1 className="text-2xl font-semibold mb-3">
          Your Primary Color:{' '}
          <span className={colorText[winner]}>{winner.toUpperCase()}</span>
        </h1>

        <div className="grid gap-2 mb-6">
          {sorted.map((r) => (
            <div key={r.color} className="flex justify-between text-sm">
              <span className={`font-semibold ${colorText[r.color]}`}>{r.color.toUpperCase()}</span>
              <span className={`font-semibold ${colorText[r.color]}`}>{r.total_score}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <div className={`font-semibold ${colorText[winner]}`}>Definition</div>
          <div className="mt-2 text-sm text-zinc-300">{DESCRIPTIONS[winner].definition}</div>

          <div className={`mt-4 font-semibold ${colorText[winner]}`}>As it relates to this industry</div>
          <div className="mt-2 text-sm text-zinc-400">{DESCRIPTIONS[winner].industry}</div>
        </div>

        <button
          className="mt-6 rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black hover:bg-lime-300 transition"
          onClick={() => router.push('/quiz')}
        >
          Take Again
        </button>

        <div className="mt-3 text-xs text-zinc-500">Attempt: {data.attempt_id.slice(0, 8)}…</div>
      </div>
    </main>
  );
}