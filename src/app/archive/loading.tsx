import { Skeleton } from "@/components/ui/skeleton";

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading archive">
      {/* ── Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 sm:w-56" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <Skeleton className="h-9 w-36 sm:w-56 rounded-lg" />
        </div>
      </header>

      {/* ── Archive Header ── */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 space-y-3">
          <Skeleton className="h-4 w-32 rounded bg-indigo-100" />
          <Skeleton className="h-10 sm:h-12 w-72" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
      </section>

      {/* ── Archive Timeline List ── */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-10">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-4">
            <Skeleton className="h-6 w-40 border-b-2 border-slate-900 pb-2" />
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white overflow-hidden">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
