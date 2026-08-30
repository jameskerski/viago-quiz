const cards = [
  ['Completed assessments', '—'],
  ['Completion rate', '—'],
  ['Most common result', '—'],
  ['Spanish usage', '—'],
];

export default function V2AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-[#050812] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">VIAGO V2 Admin</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Analytics</h1>
            <p className="mt-2 text-white/45">Foundation shell only — canonical analytics queries are not connected yet.</p>
          </div>
          <a href="/v2/admin/questions" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
            Questions & content
          </a>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="text-sm text-white/45">{label}</div>
              <div className="mt-4 text-3xl font-semibold">{value}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
          <section className="min-h-80 rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <h2 className="font-semibold">Assessment activity</h2>
            <p className="mt-2 text-sm text-white/40">Future deterministic time-series view.</p>
          </section>
          <section className="min-h-80 rounded-2xl border border-white/10 bg-white/[0.035] p-6">
            <h2 className="font-semibold">Personality distribution</h2>
            <p className="mt-2 text-sm text-white/40">Future four-color result distribution.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
