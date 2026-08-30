import Link from 'next/link';

export default function V2AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#050812] px-6 py-10 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl sm:p-9">
          <div className="mb-8 flex items-center justify-between">
            <img src="/viago-logo.svg" alt="VIAGO" className="h-8 w-auto" />
            <Link href="/v2" className="text-sm text-white/45 hover:text-white/80">
              ← Back
            </Link>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Administration</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">VIAGO V2 Admin</h1>
          <p className="mt-4 leading-7 text-white/55">
            Analytics and content management will live here. Authentication is intentionally not enabled in the
            foundation scaffold yet; no administrative data or write controls are exposed until server-side auth
            and role enforcement are complete.
          </p>

          <div className="mt-7 rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] p-4 text-sm leading-6 text-amber-100/80">
            Foundation state: locked. The next implementation tranche will connect Supabase Auth and explicit
            OWNER / EDITOR / ANALYST authorization before this route can enter the admin application.
          </div>
        </section>
      </div>
    </main>
  );
}
