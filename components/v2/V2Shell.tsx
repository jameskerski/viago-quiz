import Link from 'next/link';
import type { ReactNode } from 'react';

export function V2Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/v2" className="group flex items-center gap-3" aria-label="VIAGO Personality home">
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-white/12 bg-white/[0.06] shadow-[0_10px_35px_rgba(109,74,255,.2)] sm:h-12 sm:w-12">
        <span className="v2-brand-mark" aria-hidden />
      </span>
      <span>
        <span className={`${compact ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} block font-black tracking-[0.14em] text-white`}>VIAGO</span>
        <span className="block text-[9px] font-semibold uppercase tracking-[0.26em] text-white/42">Personality</span>
      </span>
    </Link>
  );
}

export function V2Shell({ children, compactHeader = false, action }: { children: ReactNode; compactHeader?: boolean; action?: ReactNode }) {
  return (
    <main className="v2-page min-h-screen overflow-hidden text-white">
      <div className="v2-ambient" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-4 sm:px-7 lg:px-12">
        <header className="flex min-h-20 items-center justify-between border-b border-white/[0.07] py-4 sm:min-h-24">
          <V2Brand compact={compactHeader} />
          {action}
        </header>
        {children}
      </div>
    </main>
  );
}

export function ColorOrb({ scores, labels }: { scores?: Record<string, number>; labels?: Record<string, string> }) {
  const colors = [
    ['red', '#ff3d57', 'R'],
    ['blue', '#35a8ff', 'B'],
    ['yellow', '#ffc928', 'Y'],
    ['green', '#69d34d', 'G'],
  ] as const;
  return (
    <div className="v2-orb" aria-label="Four personality color profile">
      {colors.map(([color, hex, letter]) => (
        <div key={color} className={`v2-orb-${color}`} style={{ '--orb-color': hex } as React.CSSProperties}>
          <span className="text-2xl font-black sm:text-4xl">{letter}</span>
          {scores && <strong className="mt-1 text-sm sm:text-lg">{scores[color]}</strong>}
          {labels && <small>{labels[color]}</small>}
        </div>
      ))}
    </div>
  );
}

export function V2Error({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] p-4 text-sm text-rose-100">
      <div className="font-semibold">Something interrupted your experience.</div>
      <div className="mt-1 text-rose-100/65">{message}</div>
      {onRetry && <button className="mt-3 rounded-lg border border-rose-300/25 px-3 py-2 font-semibold hover:bg-white/[0.06]" onClick={onRetry}>Try again</button>}
    </div>
  );
}
