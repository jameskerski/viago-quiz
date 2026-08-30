import { requireAdminSession } from '@/lib/v2/adminAuth';

const exampleFields = [
  'Question type',
  'Category / dimension',
  'English prompt',
  'Spanish prompt',
  'Answer options',
  'Scoring metadata',
  'Publication status',
];

export default async function V2QuestionEditorPage() {
  await requireAdminSession();

  return (
    <main className="min-h-screen bg-[#050812] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">VIAGO V2 Admin</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Questions & content</h1>
            <p className="mt-2 max-w-3xl text-white/45">
              Routine content maintenance will live here. Live publication remains guarded by the versioned draft/review/publish model.
            </p>
          </div>
          <a href="/v2/admin" className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70">
            Analytics
          </a>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/35">
              Search questions…
            </div>
            <div className="mt-4 space-y-2">
              {['All questions', 'Drafts', 'Review required', 'Published', 'Inactive'].map((item) => (
                <div key={item} className="rounded-xl border border-white/8 px-4 py-3 text-sm text-white/55">
                  {item}
                </div>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Editor preview</div>
                <h2 className="mt-2 text-2xl font-semibold">Select a question</h2>
              </div>
              <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.06] px-3 py-1 text-xs text-amber-100/75">
                Writes locked
              </span>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {exampleFields.map((field) => (
                <div key={field} className="min-h-24 rounded-xl border border-white/8 bg-black/15 p-4">
                  <div className="text-xs uppercase tracking-[0.14em] text-white/30">{field}</div>
                  <div className="mt-3 text-sm text-white/45">Governed value appears here.</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl border border-violet-300/15 bg-violet-300/[0.05] p-4 text-sm leading-6 text-white/55">
              V2 rule: saving an edit creates or updates a draft revision. It never mutates the published quiz directly. Publication requires validation and explicit authority.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
