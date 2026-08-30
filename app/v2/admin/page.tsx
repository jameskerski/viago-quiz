import { requireAdminSession } from '@/lib/v2/adminAuth';
import { getV2Analytics } from '@/lib/v2/analytics';
import { V2AdminShell } from '@/components/v2/V2AdminShell';
import { ActivityChart, ColorDistribution, CombinationList, MetricCard } from '@/components/v2/V2AnalyticsVisuals';

export const dynamic = 'force-dynamic';

export default async function V2AdminDashboardPage() {
  await requireAdminSession();
  const analytics = await getV2Analytics();
  const knownLanguages = analytics.known_languages.en + analytics.known_languages.es;

  return (
    <V2AdminShell active="analytics">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="v2-eyebrow">Screen 4</p><h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Assessment analytics</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Truthful descriptive signals from canonical records. Missing historical metadata remains explicitly unavailable.</p></div>
        <div className="rounded-full border border-emerald-300/20 bg-emerald-300/[.06] px-4 py-2 text-xs text-emerald-100/70">Canonical · read only</div>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Completed assessments" value={analytics.completed.toLocaleString()} note="Canonical completed attempts" color="#69d34d" />
        <MetricCard label="Starts" value={analytics.starts.toLocaleString()} note="All canonical attempt starts" color="#35a8ff" />
        <MetricCard label="Completion rate" value={`${analytics.completion_rate.toFixed(1)}%`} note="Completed ÷ starts" color="#ffc928" />
        <MetricCard label="Captured V2 outcomes" value={analytics.known_result_count.toLocaleString()} note="No inference from uncaptured history" color="#ff3d57" />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.55fr]">
        <article className="v2-panel rounded-3xl p-6 sm:p-8"><div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold">Assessment activity</h2><p className="mt-2 text-sm text-white/40">Starts over the latest 14 days in the 30-day canonical window.</p></div><span className="text-xs text-white/25">UTC</span></div><ActivityChart points={analytics.activity_30d} /></article>
        <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-semibold">Active corpus</h2><div className="mt-7 space-y-5"><CorpusRow label="Questions" value={analytics.corpus.active_questions}/><CorpusRow label="Likert" value={analytics.corpus.active_likert}/><CorpusRow label="Single-select" value={analytics.corpus.active_single}/></div><p className="mt-7 text-xs leading-5 text-white/30">Published canonical content only. Drafts are isolated from these totals and public selection.</p></article>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-semibold">Personality-color distribution</h2><p className="mt-2 text-sm text-white/40">Primary results only where V2 metadata captured the result.</p><div className="mt-7"><ColorDistribution values={analytics.winner_distribution} known={analytics.known_result_count}/></div></article>
        <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-semibold">Known V2 language</h2><p className="mt-2 text-sm text-white/40">Language is reported only when recorded; historical language is never guessed.</p><div className="mt-8 grid grid-cols-2 gap-4"><MetricCard label="English" value={knownLanguages ? `${analytics.known_languages.en}` : 'Unavailable'} color="#35a8ff"/><MetricCard label="Spanish" value={knownLanguages ? `${analytics.known_languages.es}` : 'Unavailable'} color="#ffc928"/></div></article>
        <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-semibold">Primary / secondary combinations</h2><p className="mt-2 text-sm text-white/40">Ranked pairings from captured score metadata.</p><CombinationList rows={analytics.primary_secondary}/></article>
        <article className="v2-panel rounded-3xl p-6 sm:p-8"><h2 className="text-xl font-semibold">Score margins & ties</h2><p className="mt-2 text-sm text-white/40">Descriptive output only; this makes no scientific-validity claim.</p><div className="mt-7 grid grid-cols-2 gap-4"><MetricCard label="Known margins" value={analytics.score_margins.known ? analytics.score_margins.known.toLocaleString() : 'Unavailable'}/><MetricCard label="Ties" value={analytics.score_margins.known ? analytics.score_margins.ties.toLocaleString() : 'Unavailable'}/><MetricCard label="Average margin" value={analytics.score_margins.known ? analytics.score_margins.average.toFixed(2) : 'Unavailable'}/><MetricCard label="Range" value={analytics.score_margins.known ? `${analytics.score_margins.minimum}–${analytics.score_margins.maximum}` : 'Unavailable'}/></div></article>
      </section>
    </V2AdminShell>
  );
}

function CorpusRow({label,value}:{label:string;value:number}) { return <div className="flex items-center justify-between border-b border-white/[.07] pb-4"><span className="text-sm text-white/45">{label}</span><strong className="text-2xl">{value}</strong></div>; }
