'use client';

import { useMemo, useState } from 'react';
import Image from "next/image";
import { SPANISH_RESULT_DESCRIPTIONS } from '@/lib/spanishResultDescriptions';

type Color = 'red' | 'blue' | 'yellow' | 'green';
type Lang = 'en' | 'es';

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
  likert_color?: string | null;
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

const UI = {
  en: {
    brand: 'Personality Quiz',
    languageTitle: 'Choose your language',
    languageSub: 'This will apply to the entire quiz and results.',
    english: 'English',
    spanish: 'Español',
    startTitle: 'Personality Quiz',
    startSub: 'Discover how you think, lead, and grow in network marketing — the VIAGO way',
    startBtn: 'Start Quiz',
    questionXofY: (x: number, y: number) => `Question ${x} of ${y}`,
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    saving: 'Saving…',
    starting: 'Starting…',
    winner: 'Winner',
    definition: 'Definition:',
    industry: 'As it relates to this industry:',
    show: 'Show',
    hide: 'Hide',
    primary: 'Primary',
    takeAgain: 'Take Again',
    selectOption: 'Select an option',
    startFailed: 'Start failed',
    attemptFetchFailed: 'Attempt fetch failed',
    finishFailed: 'Finish failed',
    saveFailed: 'Failed to save answer',
  },
  es: {
    brand: 'Test de Personalidad',
    languageTitle: 'Elige tu idioma',
    languageSub: 'Se aplicará a todo el test y a tus resultados.',
    english: 'English',
    spanish: 'Español',
    startTitle: 'Test de Personalidad',
    startSub: 'Descubre cómo piensas, lideras y creces en el network marketing — a la manera VIAGO.',
    startBtn: 'Comenzar',
    questionXofY: (x: number, y: number) => `Pregunta ${x} de ${y}`,
    back: 'Atrás',
    next: 'Siguiente',
    finish: 'Finalizar',
    saving: 'Guardando…',
    starting: 'Iniciando…',
    winner: 'Resultado principal',
    definition: 'Definición:',
    industry: 'En esta industria:',
    show: 'Ver',
    hide: 'Ocultar',
    primary: 'Principal',
    takeAgain: 'Hacerlo de nuevo',
    selectOption: 'Elige una opción',
    startFailed: 'No se pudo iniciar',
    attemptFetchFailed: 'No se pudo cargar el intento',
    finishFailed: 'No se pudo finalizar',
    saveFailed: 'No se pudo guardar la respuesta',
  },
} as const;

const LIKERT_LABELS: Record<Lang, Record<number, string>> = {
  en: {
    0: 'Not like me at all',
    1: 'Slightly like me',
    2: 'Somewhat like me',
    3: 'Very like me',
    4: 'Exactly like me',
  },
  es: {
    0: 'Para nada como yo',
    1: 'Un poco como yo',
    2: 'Algo como yo',
    3: 'Muy como yo',
    4: 'Exactamente como yo',
  },
};

const ENGLISH_DESCRIPTIONS: Record<'en', Record<Color, { definition: string; industry: string }>> = {
  en: {
    red: {
      definition: `🔴 RED — The Driver / Achiever

Core Drive

Reds are fueled by progress, competition, and outcomes. They care about winning, advancing, and being seen as competent or successful. Momentum matters more to them than comfort.

How Reds Show Up

Reds move fast. They decide quickly, take charge instinctively, and step into pressure without flinching. You’ll often find them leading meetings, pushing deadlines, negotiating deals, or chasing the next milestone. They’re drawn to environments where success is visible — titles, numbers, status, rankings.

They often surround themselves with other high performers and “top-tier” people. Not always because they enjoy it — but because approval and validation quietly matter more than they admit.

Strengths (Pros)
• Decisive under pressure
• Highly driven
• Comfortable with responsibility
• Results-oriented

Weaknesses (Cons)
• Impatient with people
• Poor listeners once decided
• Can appear dismissive
• Team friction

Real-World Example

A Red lead will push a deadline even if morale suffers — believing “winning fixes everything.” When it works, they look brilliant. When it doesn’t, people feel steamrolled.`,
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
• Dependable and supportive
• High integrity
• Emotionally intuitive
• Values-driven

Weaknesses (Cons)
• Avoid conflict
• Reluctant to lead
• Can enable bad behavior
• Drained by aggressive personalities

Real-World Example

A Yellow may quietly carry extra workload to keep the team stable — while resentment builds. Loyalty is real, but burnout is the hidden cost.`,
      industry:
        'Yellows build trust and retention. They’re strong at culture and long-term relationships. Growth accelerates when they learn direct conversations instead of avoiding conflict.',
    },
    blue: {
      definition: `🔵 BLUE — The Energizer / Explorer

Core Drive

Blues are driven by experience, connection, and stimulation. They want life to feel alive — fun, meaningful, and socially rich.

How Blues Show Up

Blues bring energy into rooms. They’re spontaneous, expressive, and optimistic. They thrive on interaction, novelty, and freedom. Routine suffocates them. They’ll follow leadership — as long as it’s kind, engaging, and doesn’t micromanage.

Strengths (Pros)
• Socially magnetic
• Adaptable
• Creative
• Relationship builders

Weaknesses (Cons)
• Poor follow-through on repetitive tasks
• Time blindness
• Impulsive decisions
• Distracted when novelty fades

Real-World Example

A Blue will spark excitement for a new initiative — then lose interest when it becomes repetitive. Great starters, inconsistent finishers unless supported.`,
      industry:
        'Blues excel at creating connection and momentum. They do best with simple systems and structure that helps them stay consistent after the initial excitement.',
    },
    green: {
      definition: `🟢 GREEN — The Analyst / Planner

Core Drive

Greens seek clarity, logic, and predictability. They feel safest when systems are defined, expectations are clear, and decisions are based on evidence — not emotion or impulse.

How Greens Show Up

Greens slow things down — intentionally. They research, analyze, and question assumptions. They prefer structure, guidelines, and plans. Ambiguity stresses them.

Strengths (Pros)
• Thorough and precise
• Excellent planners
• Calm in chaos (with logic)
• Risk-aware

Weaknesses (Cons)
• Analysis paralysis
• Can seem cold/critical
• Rigid under pressure
• Prejudge with incomplete data

Real-World Example

A Green will design an airtight process — but may struggle when a fast, imperfect decision is required. They protect organizations from chaos, but can slow momentum.`,
      industry:
        'Greens strengthen systems. They refine processes and improve training. Growth accelerates when they allow action before every variable is fully certain.',
    },
  },
};

const DESCRIPTIONS: Record<Lang, Record<Color, { definition: string; industry: string }>> = {
  en: ENGLISH_DESCRIPTIONS.en,
  es: SPANISH_RESULT_DESCRIPTIONS,
};

export default function QuizPage() {
  // flow: language -> start -> quiz -> results
  const [step, setStep] = useState<'language' | 'start' | 'quiz' | 'results'>('language');
  const [language, setLanguage] = useState<Lang | null>(null);

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<AttemptQuestion[]>([]);
  const [index, setIndex] = useState(0);

  const [likertAnswers, setLikertAnswers] = useState<Record<string, number>>({});
  const [singleAnswers, setSingleAnswers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState<FinishPayload | null>(null);

  const t = language ? UI[language] : UI.en;

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

  function pickLanguage(l: Lang) {
    setLanguage(l);
    setError(null);
    setFinished(null);
    setAttemptId(null);
    setQuestions([]);
    setIndex(0);
    setLikertAnswers({});
    setSingleAnswers({});
    setStep('start');
  }

  async function start() {
    if (!language) return;

    setLoading(true);
    setError(null);
    setFinished(null);

    try {
      const res = await fetch('/api/start', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || t.startFailed);
      if (!json?.attempt_id) throw new Error('Missing attempt_id from /api/start');

      setAttemptId(json.attempt_id);

      const qRes = await fetch(
        `/api/attempt?attempt_id=${encodeURIComponent(json.attempt_id)}&lang=${language}`
      );
      const qJson = await qRes.json();
      if (!qRes.ok) throw new Error(qJson?.error || t.attemptFetchFailed);

      const qs = (qJson.questions as AttemptQuestion[])
        .slice()
        .sort((a, b) => a.position - b.position);

      setQuestions(qs);
      setIndex(0);
      setStep('quiz');
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
    if (!attemptId || !current || !language) return;

    setSaving(true);
    setError(null);

    try {
      if (current.qtype === 'likert') {
        const v = likertAnswers[current.id];
        if (v === undefined) throw new Error(t.selectOption);

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
        if (!res.ok) throw new Error(j?.error || t.saveFailed);
      }

      if (current.qtype === 'single') {
        const optId = singleAnswers[current.id];
        if (!optId) throw new Error(t.selectOption);

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
        if (!res.ok) throw new Error(j?.error || t.saveFailed);
      }

      // last question => finish
      if (index === total - 1) {
        const res = await fetch('/api/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attempt_id: attemptId }),
        });

        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j?.error || t.finishFailed);

        const fin = j as FinishPayload;
        setFinished(fin);

        const primary = fin.winner_color;
        setOpen({ red: false, blue: false, yellow: false, green: false, [primary]: true } as Record<Color, boolean>);

        setStep('results');
        return;
      }

      setIndex((i) => i + 1);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  // Single options are already randomized per attempt in the API response
  const singleOptions = useMemo(() => {
    if (!current || current.qtype !== 'single') return [];
    return (current.options || []).slice(); // DO NOT sort
  }, [current]);

  const sortedResults = useMemo(() => {
    if (!finished?.results?.length) return [];
    return finished.results.slice().sort((a, b) => b.total_score - a.total_score);
  }, [finished]);

  function toggleColor(c: Color) {
    if (finished?.winner_color === c) return;
    setOpen((prev) => ({ ...prev, [c]: !prev[c] }));
  }

  function ResultCard({ c }: { c: Color }) {
    const primary = finished?.winner_color;
    const expanded = open[c];
    const isPrimary = primary === c;

    const desc = DESCRIPTIONS[language ?? 'en'][c];

    return (
      <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className={`${colorText[c]} font-semibold`}>{colorLabel[c]}</div>

          {isPrimary ? (
            <div className="text-xs text-zinc-500">{t.primary}</div>
          ) : (
            <button
              onClick={() => toggleColor(c)}
              className="text-xs rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-1 hover:border-lime-400/60 transition"
            >
              {expanded ? t.hide : t.show}
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-3 space-y-3">
            <div className="text-sm text-zinc-300 whitespace-pre-wrap">
              <span className="font-semibold text-zinc-100">{t.definition}</span>
              {'\n'}
              {desc.definition}
            </div>
            <div className="text-sm text-zinc-400">
              <span className="font-semibold text-zinc-200">{t.industry}</span> {desc.industry}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className={`w-full max-w-2xl rounded-2xl border ${colorBorder[borderColor]} bg-zinc-950 p-6`}>
        <div className="mb-4 flex items-center gap-3">
  <img
  src="/viago-logo.svg"
  alt="VIAGO"
  className="w-32 h-auto"
/>
  <div className="text-lime-400 font-semibold tracking-wide">
    {t.brand}
  </div>
</div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* 1) LANGUAGE SCREEN */}
        {step === 'language' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-2xl font-bold mb-2">{UI.en.languageTitle}</div>
            <div className="text-zinc-400 mb-6">{UI.en.languageSub}</div>

            <div className="grid gap-3">
              <button
                onClick={() => pickLanguage('en')}
                className="rounded-2xl bg-lime-400 px-6 py-4 font-extrabold text-black hover:bg-lime-300 transition text-xl"
              >
                English
              </button>

              <button
                onClick={() => pickLanguage('es')}
                className="rounded-2xl bg-lime-400 px-6 py-4 font-extrabold text-black hover:bg-lime-300 transition text-xl"
              >
                Español
              </button>
            </div>
          </div>
        )}

        {/* 2) START SCREEN */}
        {step === 'start' && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-3xl font-extrabold mb-2">{t.startTitle}</div>
            <div className="text-zinc-400 mb-6">{t.startSub}</div>

            <button
              onClick={start}
              disabled={loading}
              className="rounded-xl bg-lime-400 px-6 py-3 font-semibold text-black hover:bg-lime-300 transition disabled:opacity-50"
            >
              {loading ? t.starting : t.startBtn}
            </button>
          </div>
        )}

        {/* 3) QUIZ SCREEN */}
        {step === 'quiz' && attemptId && current && (
          <>
            <div className="text-xs text-zinc-400 mb-2">
              {t.questionXofY(index + 1, total)}
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
                      {LIKERT_LABELS[language ?? 'en'][v]}
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
                  {t.back}
                </button>

                <button
                  onClick={submitAnswerAndAdvance}
                  disabled={saving || !isCurrentAnswered()}
                  className="rounded-xl bg-lime-400 px-6 py-3 font-semibold text-black hover:bg-lime-300 transition disabled:opacity-50"
                >
                  {saving ? t.saving : index === total - 1 ? t.finish : t.next}
                </button>
              </div>
            </div>
          </>
        )}

        {/* 4) RESULTS SCREEN */}
        {step === 'results' && finished && (
          <>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-sm text-zinc-400 mb-1">{t.winner}</div>
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

                            {/* Results descriptions */}
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
              {t.takeAgain}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
