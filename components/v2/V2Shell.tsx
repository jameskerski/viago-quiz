import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';

export function V2OfficialLogo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return <Image src="/viago-logo-official-white.png" alt="VIAGO" width={849} height={298} priority className={`${compact ? 'h-10 sm:h-11' : 'h-11 sm:h-14'} w-auto object-contain ${className}`} />;
}

export function V2Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/v2" className="group inline-flex items-center" aria-label="VIAGO Personality home">
      <V2OfficialLogo compact={compact} />
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
