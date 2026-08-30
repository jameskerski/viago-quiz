'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { V2Error, V2Shell } from '@/components/v2/V2Shell';
import { LIKERT_COPY, V2_COPY, type V2Lang } from '@/lib/v2/publicContent';

type Option = { id: string; label: string; sort_order: number };
type Question = { position: number; qtype: 'likert' | 'single'; id: string; prompt: string; options: Option[] };
type AnswerState = Record<string, number | string>;

export default function V2QuizClient() {
  const router = useRouter();
  const params = useSearchParams();
  const lang: V2Lang = params.get('lang') === 'es' ? 'es' : 'en';
  const t = V2_COPY[lang];
  const started = useRef(false);
  const [attemptId, setAttemptId] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'saving'>('loading');
  const [error, setError] = useState('');

  const storageKey = `viago:v2:${lang}`;

  const loadAttempt = useCallback(async (id: string) => {
    const response = await fetch(`/api/attempt?attempt_id=${encodeURIComponent(id)}&lang=${lang}`, { cache: 'no-store' });
    const payload = await response.json();
    if (!response.ok || !Array.isArray(payload.questions)) throw new Error(payload.error || 'Unable to load this assessment.');
    const ordered = (payload.questions as Question[]).slice().sort((a, b) => a.position - b.position);
    if (ordered.length !== 50) throw new Error(`Expected 50 questions, received ${ordered.length}.`);
    setAttemptId(id); setQuestions(ordered); setPhase('ready');
    return ordered;
  }, [lang]);

  const begin = useCallback(async () => {
    setError(''); setPhase('loading');
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null') as { attemptId?: string; index?: number; answers?: AnswerState } | null;
      if (saved?.attemptId) {
        try {
          await loadAttempt(saved.attemptId);
          setAnswers(saved.answers || {}); setIndex(Math.min(saved.index || 0, 49));
          return;
        } catch { localStorage.removeItem(storageKey); }
      }
      const response = await fetch('/api/start', { method: 'POST' });
      const payload = await response.json();
      if (!response.ok || !payload.attempt_id) throw new Error(payload.error || 'Unable to start the assessment.');
      await loadAttempt(payload.attempt_id);
      await fetch('/api/v2/attempt-metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempt_id: payload.attempt_id, language: lang, phase: 'start' }) });
      localStorage.setItem(storageKey, JSON.stringify({ attemptId: payload.attempt_id, index: 0, answers: {} }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause)); setPhase('ready');
    }
  }, [lang, loadAttempt, storageKey]);

  useEffect(() => { if (!started.current) { started.current = true; void begin(); } }, [begin]);
  useEffect(() => { if (attemptId) localStorage.setItem(storageKey, JSON.stringify({ attemptId, index, answers })); }, [answers, attemptId, index, storageKey]);

  const current = questions[index];
  const selected = current ? answers[current.id] : undefined;
  const progress = questions.length ? ((index + 1) / questions.length) * 100 : 0;

  async function continueForward() {
    if (!current || selected === undefined || !attemptId) return;
    setPhase('saving'); setError('');
    try {
      const body = current.qtype === 'likert'
        ? { attempt_id: attemptId, question_id: current.id, qtype: 'likert', likert_value: selected }
        : { attempt_id: attemptId, question_id: current.id, qtype: 'single', option_id: selected };
      const response = await fetch('/api/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Your answer could not be saved.');
      if (index < questions.length - 1) { setIndex((value) => value + 1); setPhase('ready'); return; }
      const finish = await fetch('/api/finish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempt_id: attemptId }) });
      const result = await finish.json().catch(() => ({}));
      if (!finish.ok) throw new Error(result.error || 'Your result could not be calculated.');
      await fetch('/api/v2/attempt-metadata', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ attempt_id: attemptId, language: lang, phase: 'complete' }) });
      localStorage.removeItem(storageKey);
      router.push(`/v2/results/${encodeURIComponent(attemptId)}?lang=${lang}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause)); setPhase('ready');
    }
  }

  const choices = useMemo(() => current?.qtype === 'likert' ? LIKERT_COPY[lang].map((label, value) => ({ id: String(value), label, value })) : (current?.options || []).map((option) => ({ id: option.id, label: option.label, value: option.id })), [current, lang]);

  return (
    <V2Shell compactHeader action={<button onClick={() => router.push('/v2')} className="text-xs font-semibold uppercase tracking-[.16em] text-white/38 hover:text-white/75">Exit</button>}>
      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-8 sm:py-12">
        {phase === 'loading' && !current ? <Loading label={t.loading} /> : error && !current ? <V2Error message={error} onRetry={() => void begin()} /> : current && (
          <div key={current.id} className="v2-enter">
            <div className="mb-5 flex items-end justify-between gap-5">
              <div><div className="text-xs font-bold uppercase tracking-[.2em] text-violet-300/80">{t.question} {index + 1} {t.of} {questions.length}</div><div className="mt-1 text-sm text-white/38">{current.qtype === 'likert' ? t.likertHint : t.singleHint}</div></div>
              <div className="text-sm font-semibold text-white/55">{Math.round(progress)}%</div>
            </div>
            <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-white/[0.07]" aria-label={`${Math.round(progress)}% complete`}><div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-400 transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="v2-panel rounded-[26px] p-5 sm:p-8 lg:p-10">
              <h1 className="mx-auto max-w-4xl text-center text-[clamp(1.65rem,3.3vw,2.8rem)] font-semibold leading-[1.16] tracking-[-.035em]">{current.prompt}</h1>
              <div className={`mx-auto mt-8 grid max-w-3xl gap-3 ${current.qtype === 'likert' ? 'sm:grid-cols-5' : ''}`} role="radiogroup" aria-label={current.prompt}>
                {choices.map((choice, choiceIndex) => {
                  const active = selected === choice.value;
                  return <button key={choice.id} role="radio" aria-checked={active} onClick={() => setAnswers((value) => ({ ...value, [current.id]: choice.value }))} className={`group min-h-[62px] rounded-2xl border px-4 py-3 text-left text-sm leading-5 transition sm:text-base ${current.qtype === 'likert' ? 'sm:min-h-32 sm:text-center' : ''} ${active ? 'border-violet-300/75 bg-violet-500/16 shadow-[0_0_35px_rgba(124,58,237,.16)]' : 'border-white/10 bg-white/[0.035] text-white/72 hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06]'}`}>
                    <span className={`mb-2 inline-grid h-7 w-7 place-items-center rounded-full text-xs font-black ${active ? 'bg-violet-400 text-white' : 'bg-white/[0.07] text-white/50'}`}>{current.qtype === 'single' ? String.fromCharCode(65 + choiceIndex) : choiceIndex + 1}</span>
                    <span className="block">{choice.label}</span>
                  </button>;
                })}
              </div>
              {error && <div className="mx-auto mt-6 max-w-3xl"><V2Error message={error} /></div>}
              <div className="mx-auto mt-8 flex max-w-3xl items-center justify-between gap-4">
                <button disabled={index === 0 || phase === 'saving'} onClick={() => setIndex((value) => Math.max(0, value - 1))} className="min-h-[48px] rounded-xl border border-white/12 px-5 font-semibold text-white/65 transition hover:border-white/25 hover:text-white disabled:opacity-30">← {t.back}</button>
                <button disabled={selected === undefined || phase === 'saving'} onClick={() => void continueForward()} className="v2-primary-button min-w-32">{phase === 'saving' ? t.saving : index === questions.length - 1 ? t.finish : `${t.next} →`}</button>
              </div>
            </div>
          </div>
        )}
      </section>
    </V2Shell>
  );
}

function Loading({ label }: { label: string }) { return <div className="v2-panel mx-auto w-full max-w-xl rounded-3xl p-10 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" /><div className="mt-5 text-sm text-white/50">{label}</div></div>; }
