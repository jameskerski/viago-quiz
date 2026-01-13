'use client';

import { useMemo, useState } from 'react';

type Color = 'red' | 'blue' | 'yellow' | 'green';

type Option = {
  id: string;
  label: string;
  sort_order: number;
  red: number;
  blue: number;
  yellow: number;
  green: number;
};

type AttemptQuestion = {
  position: number;
  qtype: 'likert' | 'single';
  id: string;
  prompt: string;
  options: Option[];
};

type FinishPayload = {
  attempt_id: string;
  results: Array<{ color: Color; total_score: number }>;
  winner_color: Color;
};

const colorText: Record<Color, string> = {
  red: 'text-red-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
  green: 'text-green-400',
};

const colorBorder: Record<Color, string> = {
  red: 'border-red-400/40',
  blue: 'border-blue-400/40',
  yellow: 'border-yellow-400/40',
  green: 'border-green-400/40',
};

const colorLabel: Record<Color, string> = {
  red: 'RED',
  blue: 'BLUE',
  yellow: 'YELLOW',
  green: 'GREEN',
};

const LIKERT_LABELS: Record<number, string> = {
  0: 'Not like me at all',
  1: 'Slightly like me',
  2: 'Somewhat like me',
  3: 'Very like me',
  4: 'Exactly like me',
};

const DESCRIPTIONS: Record<Color, { definition: string; industry: string }> = {
  red: {
    definition: `🔴 RED — The Driver / Achiever

Core Drive

Reds are fueled by progress, competition, and outcomes. They care about winning, advancing, and being seen as competent or successful. Momentum matters more to them than comfort.

How Reds Show Up

Reds move fast. They decide quickly, take charge instinctively, and step into pressure without flinching. You’ll often find them leading meetings, pushing deadlines, negotiating deals, or chasing the next milestone. They’re drawn to environments where success is visible — titles, numbers, status, rankings.

They often surround themselves with other high performers and “top-tier” people. Not always because they enjoy it — but because approval and validation quietly matter more than they admit.

Strengths (Pros)
	•	Decisive under pressure — they don’t freeze when stakes are high
	•	Highly driven — they raise standards and expectations
	•	Comfortable with responsibility — they’ll take the heat if things go wrong
	•	Results-oriented — they keep teams focused on outcomes, not excuses

Weaknesses (Cons)
	•	Impatient with people — especially slower thinkers or emotional processors
	•	Poor listeners when they’ve already made up their mind
	•	Can appear arrogant or dismissive, even when unintentional
	•	Team friction — collaboration often takes a back seat to speed

Real-World Example

A Red project lead will push a team to hit a deadline even if morale suffers — and may genuinely believe that “winning fixes everything.” When it works, they look brilliant. When it doesn’t, people feel steamrolled.

⸻`,
    industry:
      'Reds push momentum. They respond well to targets, scoreboards, and clear standards. Their biggest unlock is developing other people without steamrolling them.',
  },

  yellow: {
    definition: `🟡 YELLOW — The Stabilizer / Loyalist

Core Drive

Yellows are motivated by values, fairness, and relationships. They want people to feel safe, supported, and treated ethically. Harmony isn’t a bonus — it’s the goal.

How Yellows Show Up

Yellows are the emotional glue in groups. They notice who feels left out, who’s uncomfortable, and when something “feels off.” They don’t crave authority, but they deeply care about who is leading and how they lead.

They’re loyal to a fault — once they commit to people, causes, or teams, they stick around long after others would walk away.

Strengths (Pros)
	•	Excellent team players — dependable, supportive, consistent
	•	High integrity — honesty and fairness matter more than convenience
	•	Emotionally intuitive — they read rooms well
	•	Values-driven — they anchor groups during ethical or interpersonal tension

Weaknesses (Cons)
	•	Conflict avoidance — problems can fester because they delay hard conversations
	•	Reluctance to lead — even when they’re the most qualified
	•	Can enable bad behavior by over-prioritizing peace
	•	Emotionally drained by aggressive or selfish personalities

Real-World Example

A Yellow employee may quietly carry extra workload to keep the team functioning — while resenting leadership for not stepping up. They’ll stay loyal, but burnout is the hidden cost.

⸻`,
    industry:
      'Yellows build trust and retention. They’re strong at culture and long-term relationships. Their growth accelerates when they learn to have direct conversations instead of avoiding conflict.',
  },

  blue: {
    definition: `🔵 BLUE — The Energizer / Explorer

Core Drive

Blues are driven by experience, connection, and stimulation. They want life to feel alive — fun, meaningful, and socially rich.

How Blues Show Up

Blues bring energy into rooms. They’re spontaneous, expressive, and optimistic. They thrive on interaction, novelty, and freedom. Routine suffocates them. They’ll happily follow leadership — as long as it’s kind, engaging, and doesn’t micromanage them.

They decide based on excitement and trust, not spreadsheets.

Strengths (Pros)
	•	Socially magnetic — they lift morale and engagement
	•	Adaptable — change excites them instead of stressing them out
	•	Creative thinkers — they bring fresh ideas and enthusiasm
	•	Relationship builders — they connect easily across groups

Weaknesses (Cons)
	•	Poor follow-through on long, repetitive tasks
	•	Time blindness — punctuality and planning aren’t natural strengths
	•	Impulsive decisions, especially with money or commitments
	•	Easily distracted when novelty fades

Real-World Example

A Blue team member will generate excitement for a new initiative — but may lose interest once the work becomes repetitive. They’re fantastic starters, unreliable finishers unless supported.

⸻`,
    industry:
      'Blues excel at creating connection and momentum. They do best with simple systems and strong structure that helps them stay consistent after the initial excitement wears off.',
  },

  green: {
    definition: `🟢 GREEN — The Analyst / Planner

Core Drive

Greens seek clarity, logic, and predictability. They feel safest when systems are defined, expectations are clear, and decisions are based on evidence — not emotion or impulse.

How Greens Show Up

Greens slow things down — intentionally. They research, analyze, and question assumptions. They prefer structure, guidelines, and plans. Ambiguity stresses them. Emotional decision-making irritates them.

They’re often skeptical of people’s motives, not because they’re cold — but because they trust data over intuition.

Strengths (Pros)
	•	Thorough and precise — mistakes are less likely under their watch
	•	Excellent planners — systems, processes, documentation
	•	Calm in chaos — as long as there’s logic to apply
	•	Risk-aware — they spot problems others miss

Weaknesses (Cons)
	•	Analysis paralysis — decisions can stall indefinitely
	•	Emotionally detached — can seem cold or overly critical
	•	Rigid under pressure — flexibility doesn’t come easily
	•	Prejudging people based on incomplete data

Real-World Example

A Green manager will design an airtight process — but may struggle when a fast, imperfect decision is required. They protect organizations from chaos, but sometimes slow momentum.`,
    industry:
      'Greens strengthen systems. They ask smart questions, refine processes, and improve training. Their growth accelerates when they allow action before every variable feels fully certain.',
  },
};

export default function QuizPage() {
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [index, setIndex] = useState(0);

  const [likertAnswers, setLikertAnswers] = useState<Record<string, number>>({});
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState<FinishPayload | null>(null);

  // Results dropdown state
  const [open, setOpen] = useState<Record<Color, boolean>>({
    red: false,
    blue: false,
    yellow: false,
    green: false,
  });

  const current = questions[index];
  const total = questions.length;

  const progress = useMemo(
    () => (total ? Math.round(((index + 1) / total) * 100) : 0),
    [index, total]
  );

  const borderColor: Color = finished?.winner_color ?? 'green';

  async function start() {
    setLoading(true);
    setError(null);
    setFinished(null);

    try {
      const res = await fetch('/api/start', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Start failed');
      if (!json?.attempt_id) throw new Error('Missing attempt_id from /api/start');

      setAttemptId(json.attempt_id);

      const qRes = await fetch(`/api/attempt?attempt_id=${encodeURIComponent(json.attempt_id)}`);
      const qJson = await qRes.json();
      if (!qRes.ok) throw new Error(qJson?.error || 'Attempt fetch failed');

      const qs = (qJson.questions as AttemptQuestion[]).slice().sort((a, b) => a.position - b.position);
      setQuestions(qs);
      setIndex(0);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  function isCurrentAnswered() {
    if (!current) return false;
    if (current.qtype === 'likert') return likertAnswers[current.id] !== undefined;
    if (current.qtype === 'single') return !!singleAnswers[current.id];
    return false;
  }

  async function submitAnswerAndAdvance() {
    if (!attemptId || !current) return;

    setSaving(true);
    setError(null);

    try {
      if (current.qtype === 'likert') {
        const v = likertAnswers[current.id];
        if (v === undefined) throw new Error('Select an option');

        const res = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId,
            question_id: current.id,
            qtype: 'likert',
            likert_value: v,
          }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || 'Failed to save answer');
      }

      if (current.qtype === 'single') {
        const optId = singleAnswers[current.id];
        if (!optId) throw new Error('Select an option');

        const res = await fetch('/api/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: attemptId,
            question_id: current.id,
            qtype: 'single',
            option_id: optId,
          }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || 'Failed to save answer');
      }

      // last question => finish
      if (index === total - 1) {
        const res = await fetch('/api/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt_id: attemptId }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || 'Finish failed');

        const fin = j as FinishPayload;
        setFinished(fin);

        // primary open by default, others collapsed
        const primary = fin.winner_color;
        setOpen({ red: false, blue: false, yellow: false, green: false, [primary]: true } as Record<Color, boolean>);
        return;
      }

      setIndex((i) => i + 1);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  // keep single-choice options in the order the API returns (already randomized per attempt)
const singleOptions = useMemo(() => {
  if (!current || current.qtype !== 'single') return [];
  return (current.options || []).slice(); // DO NOT sort, or you undo the randomization
}, [current]);

  const sortedResults = useMemo(() => {
    if (!finished?.results?.length) return [];
    return finished.results.slice().sort((a, b) => b.total_score - a.total_score);
  }, [finished]);

  function toggleColor(c: Color) {
    // don't allow collapsing the primary (keeps it “main one expanded”)
    if (finished?.winner_color === c) return;
    setOpen((prev) => ({ ...prev, [c]: !prev[c] }));
  }

  function ResultCard({ c }: { c: Color }) {
    const primary = finished?.winner_color;
    const expanded = open[c];
    const isPrimary = primary === c;

    return (
      <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className={`${colorText[c]} font-semibold`}>{colorLabel[c]}</div>

          {isPrimary ? (
            <div className="text-xs text-zinc-500">Primary</div>
          ) : (
            <button
              onClick={() => toggleColor(c)}
              className="text-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 hover:border-lime-400/60 transition"
            >
              {expanded ? 'Hide' : 'Show'}
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            <div className="text-sm text-zinc-300 whitespace-pre-wrap">
              <span className="font-semibold text-zinc-100">Definition:</span>
              {'\n'}
              {DESCRIPTIONS[c].definition}
            </div>
            <div className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">As it relates to this industry:</span> {DESCRIPTIONS[c].industry}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className={`w-full max-w-2xl rounded-2xl border ${colorBorder[borderColor]} bg-zinc-950 p-6`}>

        <div className="mb-4 text-lime-400 font-semibold tracking-wide">
          VIAGO • Personality Quiz
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {!attemptId && !finished && (
          <button
            onClick={start}
            disabled={loading}
            className="rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black hover:bg-lime-300 transition disabled:opacity-50"
          >
            {loading ? 'Starting…' : 'Start'}
          </button>
        )}

        {attemptId && !finished && current && (
          <>
            <div className="text-xs text-zinc-400 mb-2">
              Question {index + 1} of {total}
            </div>

            <div className="h-2 bg-zinc-800 rounded-full mb-6 overflow-hidden">
              <div className="h-full bg-lime-400" style={{ width: `${progress}%` }} />
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-xl font-semibold mb-5">{current.prompt}</h2>

              {/* LIKERT */}
              {current.qtype === 'likert' && (
                <div className="grid gap-3">
                  {[0, 1, 2, 3, 4].map((v) => (
                    <button
                      key={v}
                      onClick={() => setLikertAnswers((a) => ({ ...a, [current.id]: v }))}
                      className={`rounded-xl border px-4 py-3 text-left transition
                        ${likertAnswers[current.id] === v ? 'border-lime-400/70 bg-zinc-950' : 'border-zinc-700 hover:border-lime-400/40'}`}
                    >
                      {LIKERT_LABELS[v]}
                    </button>
                  ))}
                </div>
              )}

              {/* SINGLE-CHOICE */}
              {current.qtype === 'single' && (
                <div className="grid gap-3">
                  {singleOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setSingleAnswers((a) => ({ ...a, [current.id]: opt.id }))}
                      className={`rounded-xl border px-4 py-3 text-left transition
                        ${singleAnswers[current.id] === opt.id ? 'border-lime-400/70 bg-zinc-950' : 'border-zinc-700 hover:border-lime-400/40'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <button
                  disabled={index === 0}
                  onClick={() => setIndex((i) => Math.max(0, i - 1))}
                  className="rounded-xl border border-zinc-700 bg-zinc-950 px-5 py-3 font-semibold text-zinc-200 disabled:opacity-40"
                >
                  Back
                </button>

                <button
                  onClick={submitAnswerAndAdvance}
                  disabled={saving || !isCurrentAnswered()}
                  className="rounded-xl bg-lime-400 px-6 py-3 font-semibold text-black hover:bg-lime-300 transition disabled:opacity-50"
                >
                  {saving ? 'Saving…' : index === total - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* RESULTS */}
        {finished && (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-sm text-zinc-400 mb-1">Winner</div>
              <div className={`text-3xl font-extrabold mb-6 ${colorText[finished.winner_color]}`}>
                {colorLabel[finished.winner_color]}
              </div>

              <div className="space-y-3 mb-6">
                {sortedResults.map((r) => (
                  <div key={r.color} className="flex items-center justify-between">
                    <div className={`font-semibold ${colorText[r.color]}`}>{colorLabel[r.color]}</div>
                    <div className={`font-semibold ${colorText[r.color]}`}>{r.total_score}</div>
                  </div>
                ))}
              </div>

              {/* Primary expanded, other three dropdowns */}
              <div className="grid gap-4">
                <ResultCard c={finished.winner_color} />
                {(['red', 'blue', 'yellow', 'green'] as const)
                  .filter((c) => c !== finished.winner_color)
                  .map((c) => (
                    <ResultCard key={c} c={c} />
                  ))}
              </div>
            </div>

            <button
              className="mt-6 rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black hover:bg-lime-300 transition"
              onClick={() => window.location.reload()}
            >
              Take Again
            </button>
          </>
        )}
      </div>
    </main>
  );
}