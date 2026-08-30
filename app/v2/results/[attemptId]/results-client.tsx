'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ColorOrb, V2Error, V2Shell } from '@/components/v2/V2Shell';
import { COLOR_META, COLOR_ORDER, getProfile, V2_COPY, type V2Color, type V2Lang } from '@/lib/v2/publicContent';

type Score = { color: V2Color; total_score: number };
type Result = { attempt_id: string; winner_color: V2Color; results: Score[] };

export default function V2ResultsClient({ attemptId }: { attemptId: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const lang: V2Lang = params.get('lang') === 'es' ? 'es' : 'en';
  const t = V2_COPY[lang];
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`/api/results?attempt_id=${encodeURIComponent(attemptId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.winner_color || !Array.isArray(payload.results)) throw new Error(payload.error || 'Unable to load this result.');
        if (active) setResult(payload);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : String(cause)); });
    return () => { active = false; };
  }, [attemptId]);

  const ranked = useMemo(() => result?.results.slice().sort((a, b) => b.total_score - a.total_score || COLOR_ORDER.indexOf(a.color) - COLOR_ORDER.indexOf(b.color)) || [], [result]);
  const primary = result?.winner_color;
  const secondary = ranked.find((score) => score.color !== primary)?.color;
  const maxScore = Math.max(1, ...ranked.map((score) => score.total_score));

  async function share() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true); window.setTimeout(() => setCopied(false), 2200);
  }

  return <V2Shell compactHeader action={<button onClick={() => router.push(`/v2?lang=${lang}`)} className="text-xs font-semibold uppercase tracking-[.16em] text-white/45 hover:text-white">VIAGO V2</button>}>
    <main className="mx-auto w-full max-w-6xl py-8 sm:py-14">
      {!result && !error && <div className="v2-panel rounded-3xl p-12 text-center text-white/55">{t.loading}</div>}
      {error && <V2Error message={error} onRetry={() => window.location.reload()} />}
      {result && primary && secondary && (() => {
        const meta = COLOR_META[primary]; const profile = getProfile(primary, lang);
        return <div className="v2-enter space-y-6">
          <section className="v2-panel overflow-hidden rounded-[30px] p-6 sm:p-10 lg:p-14">
            <div className="grid items-center gap-10 lg:grid-cols-[1.12fr_.88fr]">
              <div>
                <p className="text-xs font-black uppercase tracking-[.22em]" style={{ color: meta.hex }}>{t.resultsEyebrow}</p>
                <h1 className="mt-3 text-[clamp(3.5rem,9vw,7.5rem)] font-black leading-none tracking-[-.075em]" style={{ color: meta.hex }}>{meta.name[lang]}</h1>
                <p className="mt-3 text-xl font-semibold text-white/75">{meta.role[lang]}</p>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">{profile.narrative}</p>
                <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[.04] px-4 py-2 text-sm text-white/60">
                  {t.secondary}: <strong style={{ color: COLOR_META[secondary].hex }}>{COLOR_META[secondary].name[lang]}</strong>
                </div>
              </div>
              <ColorOrb scores={Object.fromEntries(result.results.map((item) => [item.color, item.total_score]))} />
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-bold">{t.profile}</h2><div className="mt-6 space-y-5">{COLOR_ORDER.map((color) => {
              const score = result.results.find((item) => item.color === color)?.total_score || 0; const cm = COLOR_META[color];
              return <div key={color}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold" style={{ color: cm.hex }}>{cm.name[lang]}</span><span className="text-white/55">{score}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[.07]"><div className="h-full rounded-full" style={{ width: `${Math.max(3, score / maxScore * 100)}%`, background: cm.hex }} /></div></div>;
            })}</div></article>
            <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-bold">{t.guidance}</h2><p className="mt-5 leading-7 text-white/65">{profile.guidance}</p></article>
            <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-bold">{t.strengths}</h2><ul className="mt-5 space-y-3 text-white/68">{profile.strengths.map((item) => <li key={item} className="flex gap-3"><span style={{ color: meta.hex }}>✦</span>{item}</li>)}</ul></article>
            <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-bold">{t.challenges}</h2><ul className="mt-5 space-y-3 text-white/68">{profile.challenges.map((item) => <li key={item} className="flex gap-3"><span className="text-violet-300">↗</span>{item}</li>)}</ul></article>
          </section>
          <div className="flex flex-col justify-center gap-3 pb-8 sm:flex-row"><button onClick={() => void share()} className="v2-primary-button">{copied ? t.copied : t.share}</button><button onClick={() => router.push(`/v2?lang=${lang}`)} className="min-h-[52px] rounded-xl border border-white/12 px-6 font-semibold text-white/75 hover:border-white/30 hover:text-white">{t.retake}</button></div>
        </div>;
      })()}
    </main>
  </V2Shell>;
}
