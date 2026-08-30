import Link from 'next/link';
import { requireAdminSession } from '@/lib/v2/adminAuth';
import { getV2Analytics } from '@/lib/v2/analytics';

const resultOrder = ['red', 'blue', 'yellow', 'green'] as const;

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export default async function V2AdminDashboardPage() {
  await requireAdminSession();

  let analytics: Awaited<ReturnType<typeof getV2Analytics>> | null = null;
  let analyticsError: string | null = null;

  try {
    analytics = await getV2Analytics();
  } catch (error) {
    analyticsError = error instanceof Error ? error.message : 'Unable to load analytics.';
  }

  const knownLanguages = analytics ? analytics.known_languages.en + analytics.known_languages.es : 0;
  const spanishShare = analytics && knownLanguages > 0 ? (analytics.known_languages.es / knownLanguages) * 100 : null;
  const winnerEntries = analytics
    ? resultOrder.map((color) => [color, analytics.winner_distribution[color] ?? 0] as const)
    : [];
  const mostCommon = winnerEntries.length
    ? winnerEntries.reduce((best, current) => (current[1] > best[1] ? current : best), winnerEntries[0])
    : null;

  const cards = analytics
    ? [
        ['Completed assessments', analytics.completed.toLocaleString()],
        ['Completion rate', formatPercent(analytics.completion_rate)],
        ['Most common persisted result', mostCommon && mostCommon[1] > 0 ? mostCommon[0].toUpperCase() : 'Not yet captured'],
        ['Known Spanish usage', spanishShare === null ? 'Not yet captured' : formatPercent(spanishShare)],
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#050812] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">VIAGO V2 Admin</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-2 text-white/45">Deterministic metrics derived from the canonical VIAGO quiz data.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/v2" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/60">
              Public home
            </Link>
            <Link href="/v2/admin/questions" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
              Questions & content
            </Link>
          </div>
        </div>

        {analyticsError ? (
          <section className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-5 text-sm leading-6 text-amber-100/80">
            Analytics foundation is not active in the database yet. The V2 migration must be applied before this dashboard can read its deterministic projection.
            <div className="mt-2 text-xs text-amber-100/45">{analyticsError}</div>
          </section>
        ) : null}

        {analytics ? (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
                  <div className="text-sm text-white/45">{label}</div>
                  <div className="mt-4 text-3xl font-semibold">{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">Assessment activity</h2>
                    <p className="mt-2 text-sm text-white/40">Starts and completed assessments over the last 30 UTC days.</p>
                  </div>
                  <div className="text-right text-xs text-white/35">{analytics.starts.toLocaleString()} total starts</div>
                </div>
                <div className="mt-6 space-y-2">
                  {analytics.activity_30d.length === 0 ? (
                    <p className="text-sm text-white/35">No recent activity.</p>
                  ) : (
                    analytics.activity_30d.slice(-14).map((point) => (
                      <div key={point.day} className="grid grid-cols-[110px_1fr_auto_auto] items-center gap-3 text-sm">
                        <span className="text-white/40">{point.day}</span>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-violet-400/70"
                            style={{ width: `${Math.min(100, Math.max(5, point.starts * 4))}%` }}
                          />
                        </div>
                        <span className="w-16 text-right text-white/55">{point.starts} start</span>
                        <span className="w-20 text-right text-emerald-300/70">{point.completed} done</span>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
                <h2 className="font-semibold">Canonical corpus</h2>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/8 pb-3">
                    <span className="text-sm text-white/45">Active questions</span>
                    <span className="text-xl font-semibold">{analytics.corpus.active_questions}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/8 pb-3">
                    <span className="text-sm text-white/45">Likert</span>
                    <span>{analytics.corpus.active_likert}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/8 pb-3">
                    <span className="text-sm text-white/45">Single-select</span>
                    <span>{analytics.corpus.active_single}</span>
                  </div>
                  <div className="pt-1 text-xs leading-5 text-white/30">
                    Result and language analytics intentionally show only values actually persisted by V2. Historical V1 language is never guessed.
                  </div>
                </div>
              </section>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
