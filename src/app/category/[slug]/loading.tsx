import { Skeleton, ArticleCardSkeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-main-background)]" aria-busy="true" aria-label="Loading category beat">
      {/* ── Top Newsroom Utility Strip Skeleton ── */}
      <div className="border-b border-white/10 bg-[#101820] py-2 hidden md:block">
        <div className="mx-auto flex max-w-[var(--max-content-width,1320px)] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-36 bg-white/10" />
            <span className="text-white/20">|</span>
            <Skeleton className="h-3 w-40 bg-white/10" />
          </div>
          <Skeleton className="h-3 w-48 bg-white/10" />
        </div>
      </div>

      {/* ── Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--color-card-background)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-[var(--max-content-width,1320px)] items-center justify-between px-4 sm:px-6 lg:px-8">
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
      <section className="border-b border-[var(--border)] bg-[var(--color-card-background)] py-10 sm:py-14">
        <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-4 w-32 rounded bg-[var(--accent)]/20" />
          <Skeleton className="h-10 sm:h-12 w-80 max-w-full" />
          <div className="space-y-2 max-w-3xl pt-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="pt-4 flex items-center gap-2 flex-wrap">
            <Skeleton className="h-7 w-16 rounded-md" />
            {[80, 95, 110, 85, 105].map((w, i) => (
              <Skeleton key={i} className="h-7 rounded-md" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Articles Grid Skeleton ── */}
      <main className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border)] mb-8">
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
