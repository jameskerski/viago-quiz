'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { V2OfficialLogo } from '@/components/v2/V2Shell';

export function V2AdminShell({ active, children }: { active: 'analytics' | 'questions' | 'validation'; children: ReactNode }) {
  const router = useRouter();
  async function logout() {
    await fetch('/api/v2/admin/logout', { method: 'POST' });
    router.replace('/v2/admin/login'); router.refresh();
  }
  const item = (href: string, key: typeof active, label: string) => <Link href={href} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${active === key ? 'bg-violet-500/18 text-violet-100 ring-1 ring-violet-300/25' : 'text-white/48 hover:bg-white/[.05] hover:text-white'}`}>{label}</Link>;
  return <main className="v2-page min-h-screen text-white"><div className="v2-ambient" aria-hidden /><div className="relative mx-auto min-h-screen w-full max-w-[1500px] px-4 pb-14 sm:px-7 lg:px-12">
    <header className="flex flex-col gap-5 border-b border-white/[.08] py-5 md:flex-row md:items-center md:justify-between">
      <Link href="/v2/admin" aria-label="VIAGO administration home"><V2OfficialLogo className="!h-12" /></Link>
      <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-white/[.08] bg-black/20 p-1.5" aria-label="Admin navigation">
        {item('/v2/admin','analytics','Analytics')}{item('/v2/admin/questions','questions','Questions & Content')}{item('/v2/admin/validation','validation','Validation')}
        <button onClick={() => void logout()} className="rounded-xl px-4 py-2 text-sm font-semibold text-white/38 transition hover:bg-white/[.05] hover:text-white">Logout</button>
      </nav>
    </header>{children}
  </div></main>;
}
