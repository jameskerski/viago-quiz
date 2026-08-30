import Link from 'next/link';

const personalityTeasers = [
  { label: 'RED', word: 'Drive', className: 'border-red-400/30 text-red-300' },
  { label: 'BLUE', word: 'Connect', className: 'border-blue-400/30 text-blue-300' },
  { label: 'YELLOW', word: 'Care', className: 'border-yellow-300/30 text-yellow-200' },
  { label: 'GREEN', word: 'Understand', className: 'border-green-400/30 text-green-300' },
];

export default function V2LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#050812] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(91,73,255,.2),transparent_30%),radial-gradient(circle_at_85%_20%,rgba(16,147,255,.13),transparent_26%),radial-gradient(circle_at_65%_85%,rgba(236,72,153,.09),transparent_30%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/viago-logo.svg" alt="VIAGO" className="h-8 w-auto" />
            <span className="hidden text-xs font-semibold uppercase tracking-[0.26em] text-white/55 sm:inline">
              Personality
            </span>
          </div>

          <Link
            href="/v2/admin/login"
            aria-label="Admin settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.035] text-white/40 transition hover:border-white/20 hover:text-white/80"
          >
            <span aria-hidden>⚙</span>
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-12 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/[0.07] px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-violet-200">
              VIAGO Personality Quiz · V2
            </div>

            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Discover how you&apos;re naturally wired.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/62 sm:text-xl">
              A practical personality experience built around how you make decisions, connect with people,
              handle change, and get things done.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/quiz"
                className="rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_60px_rgba(124,58,237,.35)] transition hover:bg-violet-500"
              >
                Start the quiz →
              </Link>
              <span className="text-sm text-white/45">50 questions · English / Español</span>
            </div>

            <div className="mt-10 flex items-center gap-3 text-sm text-white/45">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              <span>Completed assessment counter will be connected to canonical production analytics.</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-violet-500/10 via-transparent to-blue-500/10 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl backdrop-blur sm:p-7">
              <div className="grid grid-cols-2 gap-4">
                {personalityTeasers.map((item) => (
                  <div
                    key={item.label}
                    className={`min-h-40 rounded-2xl border bg-black/20 p-5 ${item.className}`}
                  >
                    <div className="text-xs font-bold tracking-[0.24em] opacity-70">{item.label}</div>
                    <div className="mt-12 text-2xl font-semibold tracking-tight">{item.word}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm leading-6 text-white/55">
                  No color is better than another. The goal is to understand the tendencies you naturally bring
                  into decisions, relationships, leadership, and everyday life.
                </p>
              </div>
            </div>
          </div>
        </section>

        <footer className="flex flex-col justify-between gap-3 border-t border-white/8 py-5 text-xs text-white/35 sm:flex-row">
          <span>VIAGO Personality Quiz</span>
          <span>V2 foundation · public experience remains isolated from current production until acceptance</span>
        </footer>
      </div>
    </main>
  );
}
