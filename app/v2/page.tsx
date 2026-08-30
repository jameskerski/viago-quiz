import Link from 'next/link';
import { ColorOrb, V2Shell } from '@/components/v2/V2Shell';
import { getCompletedAssessmentCount } from '@/lib/v2/analytics';

export const dynamic = 'force-dynamic';

export default async function V2LandingPage() {
  const completedCount = await getCompletedAssessmentCount().catch(() => null);

  return (
    <V2Shell action={<Link href="/v2/admin/login" aria-label="Admin settings" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.035] text-white/40 transition hover:border-white/25 hover:text-white/80">⚙</Link>}>
      <section className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.08fr_.92fr] lg:py-16">
        <div className="v2-enter">
          <div className="mb-6 inline-flex items-center rounded-full border border-violet-300/20 bg-violet-400/[0.07] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200">A clearer way to understand yourself</div>
          <h1 className="max-w-4xl text-[clamp(2.85rem,6.2vw,5.9rem)] font-semibold leading-[.98] tracking-[-.055em]">
            Discover your natural personality. <span className="bg-gradient-to-r from-white via-white to-violet-300 bg-clip-text text-transparent">Unlock your potential.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-base leading-7 text-white/58 sm:text-xl sm:leading-8">This is not a test of right or wrong. It is a practical look at how you decide, connect, adapt, and move through the world.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/v2/quiz?lang=en" className="v2-primary-button">Start in English <span className="ml-3">→</span></Link>
            <Link href="/v2/quiz?lang=es" className="inline-flex min-h-[52px] items-center justify-center rounded-[14px] border border-white/12 bg-white/[0.045] px-6 font-semibold text-white/78 transition hover:border-white/25 hover:bg-white/[0.075]">Comenzar en Español</Link>
          </div>
          <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat value="50" label="thoughtfully selected questions" />
            <Stat value="2" label="languages available" />
            <Stat value={completedCount === null ? '—' : completedCount.toLocaleString()} label="completed assessments" wide />
          </div>
        </div>
        <div className="v2-enter relative mx-auto flex w-full max-w-xl items-center justify-center py-5 lg:justify-end">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(125,72,255,.22),transparent_61%)] blur-2xl" />
          <ColorOrb labels={{ red: 'Drive', blue: 'Connect', yellow: 'Care', green: 'Understand' }} />
        </div>
      </section>
      <footer className="flex flex-col justify-between gap-2 border-t border-white/[0.07] py-5 text-xs text-white/32 sm:flex-row"><span>VIAGO Personality Quiz</span><span>Private V2 preview · English / Español</span></footer>
    </V2Shell>
  );
}

function Stat({ value, label, wide = false }: { value: string; label: string; wide?: boolean }) {
  return <div className={`rounded-2xl border border-white/[0.09] bg-white/[0.035] px-4 py-4 ${wide ? 'col-span-2 sm:col-span-1' : ''}`}><strong className="block text-xl text-white/90">{value}</strong><span className="mt-1 block text-[11px] leading-4 text-white/40">{label}</span></div>;
}
