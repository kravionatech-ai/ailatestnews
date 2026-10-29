import { Skeleton, ArticleCardSkeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading category beat">
      {/* ── Top Newsroom Utility Strip Skeleton ── */}
      <div className="border-b border-slate-200/80 bg-slate-900 py-2 hidden md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-36 bg-slate-800" />
            <span className="text-slate-700">|</span>
            <Skeleton className="h-3 w-40 bg-slate-800" />
          </div>
          <Skeleton className="h-3 w-48 bg-slate-800" />
        </div>
      </div>

      {/* ── Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 sm:w-56" />
            <Skeleton className="h-2.5 w-32" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-36 sm:w-56 rounded-lg" />
            <Skeleton className="hidden sm:block h-9 w-28 rounded-lg" />
          </div>
        </div>
      </header>

      {/* ── Beat Desk Header Section Skeleton ── */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
          {/* Desk Tag */}
          <Skeleton className="h-4 w-32 rounded bg-indigo-100" />

          {/* Category Title */}
          <Skeleton className="h-10 sm:h-12 w-80 max-w-full" />

          {/* Intro Description */}
          <div className="space-y-2 max-w-3xl pt-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Subtopic Filters Strip */}
          <div className="pt-4 flex items-center gap-2 flex-wrap">
            <Skeleton className="h-7 w-16 rounded-md bg-slate-900" />
            {[80, 95, 110, 85, 105].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-md" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles Grid Skeleton ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>

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
