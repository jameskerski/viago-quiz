import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-lime-400/40 bg-zinc-950 p-6 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2">VIAGO Personality Quiz</h1>
        <p className="text-zinc-400 mb-6">
          Quick test build. Next step: full question flow, scoring, and results.
        </p>

        <Link
          href="/quiz"
          className="inline-block rounded-xl bg-lime-400 px-5 py-3 font-semibold text-black hover:bg-lime-300 transition"
        >
          Start Quiz
        </Link>
      </div>
    </main>
  );
}