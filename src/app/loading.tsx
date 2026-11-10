import {
  Skeleton,
  LeadStorySkeleton,
  WireItemSkeleton,
  ArticleCardSkeleton,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[var(--color-main-background)]" aria-busy="true" aria-label="Loading content">
      {/* ── Top Newsroom Utility Strip Skeleton ── */}
      <div className="border-b border-white/10 bg-[#101820] py-2 hidden md:block">
        <div className="mx-auto flex max-w-[var(--max-content-width,1320px)] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-36 bg-white/10" />
            <span className="text-white/20">|</span>
            <Skeleton className="h-3 w-40 bg-white/10" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-48 bg-white/10" />
          </div>
        </div>
      </div>

      {/* ── Main Newsroom Masthead Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--color-card-background)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[var(--max-content-width,1320px)] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-44 sm:w-56" />
              <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            </div>
            <Skeleton className="h-2.5 w-32" />
          </div>

          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-36 sm:w-56 rounded-lg" />
            <Skeleton className="hidden sm:block h-9 w-28 rounded-lg" />
            <Skeleton className="hidden lg:block h-9 w-24 rounded-lg" />
          </div>
        </div>
      </header>

      {/* ── Main Content Loading Body ── */}
      <main className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Trending Topics Strip Skeleton */}
        <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
          <Skeleton className="h-4 w-20 rounded" />
          <div className="flex items-center gap-2 flex-wrap">
            {[100, 90, 80, 110, 120].map((w, i) => (
              <Skeleton key={i} className="h-6 rounded-full" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>

        {/* ── Editorial Hero 2-Column Section Skeleton ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-[var(--border)]">
          <div className="lg:col-span-7 xl:col-span-8">
            <LeadStorySkeleton />
          </div>

          <aside className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-3.5 w-20" />
            </div>

            <div className="space-y-4">
              <WireItemSkeleton />
              <WireItemSkeleton />
              <WireItemSkeleton />
            </div>
          </aside>
        </section>

        {/* ── Section Desks 3-Column Grid Skeleton ── */}
        <section className="space-y-6 pt-2">
          <div className="flex items-end justify-between border-b-2 border-[var(--color-heading)] pb-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-7 w-64" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
            <ArticleCardSkeleton />
          </div>
        </section>
      </main>
    </div>
  );
}
