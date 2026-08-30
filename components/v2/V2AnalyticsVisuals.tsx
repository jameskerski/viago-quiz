import type { V2ActivityPoint } from '@/lib/v2/analytics';

const COLORS: Record<string,string> = { red:'#ff3d57',blue:'#35a8ff',yellow:'#ffc928',green:'#69d34d' };
export function MetricCard({ label, value, note, color }: { label:string; value:string; note?:string; color?:string }) { return <article className="v2-panel rounded-2xl p-5"><div className="text-xs font-bold uppercase tracking-[.15em] text-white/35">{label}</div><div className="mt-3 text-3xl font-semibold tracking-tight" style={{color}}>{value}</div>{note&&<p className="mt-2 text-xs leading-5 text-white/32">{note}</p>}</article>; }

export function ActivityChart({ points }: { points:V2ActivityPoint[] }) {
  const recent=points.slice(-14); const max=Math.max(1,...recent.map(p=>p.starts));
  return <div className="mt-6 flex h-52 items-end gap-2" aria-label="14-day assessment activity">{recent.length?recent.map(p=><div key={p.day} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><div className="relative flex h-40 w-full items-end justify-center rounded-t-lg bg-white/[.025]"><div className="w-full rounded-t-lg bg-gradient-to-t from-violet-600 to-fuchsia-400/80 transition group-hover:brightness-125" style={{height:`${Math.max(4,p.starts/max*100)}%`}}/><div className="absolute bottom-1 text-[10px] font-bold text-white/65">{p.starts}</div></div><span className="text-[9px] text-white/28">{p.day.slice(5)}</span></div>):<p className="self-center text-sm text-white/35">No activity in this window.</p>}</div>;
}

export function ColorDistribution({ values, known }: { values:Record<string,number>; known:number }) {
  return <div className="space-y-5">{Object.keys(COLORS).map(color=>{const count=values[color]||0;return <div key={color}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold capitalize" style={{color:COLORS[color]}}>{color}</span><span className="text-white/45">{known?`${count} · ${(count/known*100).toFixed(1)}%`:'Unavailable'}</span></div><div className="h-2 rounded-full bg-white/[.06]"><div className="h-full rounded-full" style={{width:known?`${count/known*100}%`:'0%',background:COLORS[color]}}/></div></div>})}</div>;
}

export function CombinationList({ rows }: { rows:{primary:string;secondary:string;count:number}[] }) {
  return <div className="mt-5 space-y-2">{rows.length?rows.slice(0,8).map(row=><div key={`${row.primary}-${row.secondary}`} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-black/15 px-4 py-3"><div className="flex items-center gap-2 text-sm"><span className="font-semibold capitalize" style={{color:COLORS[row.primary]}}>{row.primary}</span><span className="text-white/25">→</span><span className="capitalize" style={{color:COLORS[row.secondary]}}>{row.secondary}</span></div><strong>{row.count}</strong></div>):<p className="text-sm leading-6 text-white/35">Unavailable until V2 completion metadata captures both ranked scores.</p>}</div>;
}
