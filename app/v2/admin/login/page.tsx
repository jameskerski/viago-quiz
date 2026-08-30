'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { V2OfficialLogo } from '@/components/v2/V2Shell';

export default function V2AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch('/api/v2/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      setLoading(false);
      setError('That password was not accepted.');
      return;
    }

    router.replace('/v2/admin');
    router.refresh();
  }

  return (
    <main className="v2-page min-h-screen px-6 py-10 text-white"><div className="v2-ambient" aria-hidden /><div className="relative">
      <div className="mx-auto flex min-h-[80vh] max-w-lg items-center">
        <section className="w-full rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl sm:p-9">
          <div className="mb-8 flex items-center justify-between">
            <V2OfficialLogo className="!h-12" />
            <Link href="/v2" className="text-sm text-white/45 hover:text-white/80">← Back</Link>
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">Administration</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Admin Portal</h1>
          <p className="mt-3 text-sm leading-6 text-white/50">Enter the shared admin password to open analytics and content management.</p>

          <form onSubmit={submit} className="mt-7 space-y-4">
            <label className="block text-sm text-white/65">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-violet-400/60"
                required
              />
            </label>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold transition hover:bg-violet-500 disabled:opacity-50"
            >
              {loading ? 'Opening…' : 'Open admin'}
            </button>
          </form>
        </section>
      </div>
    </div></main>
  );
}
