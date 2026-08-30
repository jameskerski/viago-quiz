import Link from 'next/link';
import { requireAdminSession } from '@/lib/v2/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

type QuestionRow = {
  id: string;
  is_active: boolean;
  prompt: string;
  prompt_es: string | null;
  category: string | null;
  difficulty: number | null;
  qtype: string;
  primary_color: string | null;
  color: string | null;
  likert_color: string | null;
};

type OptionRow = {
  id: string;
  question_id: string;
  label: string;
  label_es: string | null;
  sort_order: number;
  is_active: boolean;
  red: number;
  blue: number;
  yellow: number;
  green: number;
};

type PageProps = {
  searchParams: Promise<{ question?: string }>;
};

function colorLabel(question: QuestionRow) {
  return question.likert_color ?? question.primary_color ?? question.color ?? 'mixed';
}

export default async function V2QuestionEditorPage({ searchParams }: PageProps) {
  await requireAdminSession();

  const [{ data: questionData, error: questionError }, { data: optionData, error: optionError }] = await Promise.all([
    supabaseAdmin
      .from('questions')
      .select('id,is_active,prompt,prompt_es,category,difficulty,qtype,primary_color,color,likert_color')
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('question_options')
      .select('id,question_id,label,label_es,sort_order,is_active,red,blue,yellow,green')
      .order('sort_order', { ascending: true }),
  ]);

  if (questionError) throw new Error(`Unable to load canonical questions: ${questionError.message}`);
  if (optionError) throw new Error(`Unable to load canonical options: ${optionError.message}`);

  const questions = (questionData ?? []) as QuestionRow[];
  const options = (optionData ?? []) as OptionRow[];
  const params = await searchParams;
  const selected = questions.find((question) => question.id === params.question) ?? questions[0] ?? null;
  const selectedOptions = selected ? options.filter((option) => option.question_id === selected.id) : [];

  const activeCount = questions.filter((question) => question.is_active).length;
  const likertCount = questions.filter((question) => question.is_active && question.qtype === 'likert').length;
  const singleCount = questions.filter((question) => question.is_active && question.qtype === 'single').length;

  return (
    <main className="min-h-screen bg-[#050812] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">VIAGO V2 Admin</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Questions & content</h1>
            <p className="mt-2 max-w-3xl text-white/45">
              Canonical corpus is readable here now. Draft authoring is being built separately so routine edits never mutate the live quiz directly.
            </p>
          </div>
          <Link href="/v2/admin" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
            Analytics
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-white/50">
          <span className="rounded-full border border-white/10 px-3 py-1.5">{questions.length} total</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">{activeCount} active</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">{likertCount} Likert</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">{singleCount} single-select</span>
          <span className="rounded-full border border-white/10 px-3 py-1.5">{options.length} options</span>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/30">Canonical questions</div>
            <div className="max-h-[72vh] space-y-2 overflow-y-auto pr-1">
              {questions.map((question, index) => {
                const isSelected = selected?.id === question.id;
                return (
                  <Link
                    key={question.id}
                    href={`/v2/admin/questions?question=${question.id}`}
                    className={`block rounded-xl border px-4 py-3 transition ${
                      isSelected ? 'border-violet-400/40 bg-violet-400/[0.08]' : 'border-white/8 bg-black/10 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.12em] text-white/30">
                      <span>#{index + 1} · {question.qtype}</span>
                      <span>{colorLabel(question)}</span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-sm leading-5 text-white/65">{question.prompt}</div>
                  </Link>
                );
              })}
            </div>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            {selected ? (
              <>
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Published canonical question</div>
                    <h2 className="mt-2 text-2xl font-semibold leading-9">{selected.prompt}</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-xs text-amber-100/75">
                    Publishing locked
                  </span>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/8 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/30">Type</div>
                    <div className="mt-2 text-sm text-white/70">{selected.qtype}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/30">Color construct</div>
                    <div className="mt-2 text-sm text-white/70">{colorLabel(selected)}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/30">Category</div>
                    <div className="mt-2 text-sm text-white/70">{selected.category ?? '—'}</div>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/15 p-4">
                    <div className="text-xs uppercase tracking-[0.12em] text-white/30">Status</div>
                    <div className="mt-2 text-sm text-white/70">{selected.is_active ? 'Active' : 'Inactive'}</div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-white/8 bg-black/15 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/30">English authority</div>
                    <p className="mt-3 text-sm leading-6 text-white/70">{selected.prompt}</p>
                  </div>
                  <div className="rounded-xl border border-white/8 bg-black/15 p-5">
                    <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/30">Spanish</div>
                    <p className="mt-3 text-sm leading-6 text-white/70">{selected.prompt_es ?? 'No Spanish text'}</p>
                  </div>
                </div>

                {selected.qtype === 'single' ? (
                  <div className="mt-6">
                    <div className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/30">Answer options & scoring</div>
                    <div className="space-y-3">
                      {selectedOptions.map((option) => (
                        <div key={option.id} className="rounded-xl border border-white/8 bg-black/15 p-4">
                          <div className="flex flex-col justify-between gap-3 sm:flex-row">
                            <div>
                              <div className="text-sm text-white/75">{option.label}</div>
                              <div className="mt-1 text-sm text-white/40">{option.label_es ?? 'No Spanish text'}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] text-white/45">
                              <span>R {option.red}</span><span>B {option.blue}</span><span>Y {option.yellow}</span><span>G {option.green}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-white/8 bg-black/15 p-5 text-sm leading-6 text-white/55">
                    Likert scoring color: <span className="font-semibold text-white/75">{selected.likert_color ?? '—'}</span>. The V2 editor will expose the same five response levels without revealing scoring to public test takers.
                  </div>
                )}

                <div className="mt-6 rounded-xl border border-violet-300/15 bg-violet-300/[0.05] p-4 text-sm leading-6 text-white/55">
                  Next editor step: “Edit” creates a draft copy of this canonical question. Save changes affect only the draft; Validate proves corpus rules; Publish remains disabled until the guarded publication workflow receives separate acceptance.
                </div>
              </>
            ) : (
              <p className="text-white/45">No canonical questions were returned.</p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
