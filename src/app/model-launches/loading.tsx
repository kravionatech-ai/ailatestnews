import { Skeleton, ArticleCardSkeleton } from "@/components/ui/skeleton";

export default function ModelLaunchesLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading model launches">
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

      {/* ── Model Launches Header ── */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-4 w-40 rounded bg-emerald-100" />
          <Skeleton className="h-10 sm:h-12 w-96 max-w-full" />
          <Skeleton className="h-4 w-full max-w-2xl" />

          {/* Model Class Filter Chips */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <Skeleton className="h-8 w-20 rounded-md bg-slate-900" />
            {[100, 120, 95, 110, 85].map((w, i) => (
              <Skeleton key={i} className="h-8 rounded-md" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Model Releases Grid ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </main>
    </div>
  );
}
