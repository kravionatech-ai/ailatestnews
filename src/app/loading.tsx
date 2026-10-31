import {
  Skeleton,
  LeadStorySkeleton,
  WireItemSkeleton,
  ArticleCardSkeleton,
} from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading content">
      {/* ── Top Newsroom Utility Strip Skeleton ── */}
      <div className="border-b border-slate-200/80 bg-slate-900 py-2 hidden md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-36 bg-slate-800" />
            <span className="text-slate-700">|</span>
            <Skeleton className="h-3 w-40 bg-slate-800" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-48 bg-slate-800" />
          </div>
        </div>
      </div>

      {/* ── Main Newsroom Masthead Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Masthead Logo Placeholder */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-44 sm:w-56" />
              <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
            </div>
            <Skeleton className="h-2.5 w-32" />
          </div>

          {/* Action Tools Placeholder */}
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-36 sm:w-56 rounded-lg" />
            <Skeleton className="hidden sm:block h-9 w-28 rounded-lg" />
            <Skeleton className="hidden lg:block h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Navigation Bar Strip Skeleton */}
        <div className="hidden lg:block border-t border-slate-100 bg-slate-50/70">
          <div className="mx-auto flex max-w-7xl items-center justify-start gap-3 px-4 sm:px-6 lg:px-8 py-2">
            {[80, 90, 110, 85, 80, 140, 100].map((w, i) => (
              <Skeleton key={i} className={`h-6 rounded-md`} style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
      </header>

      {/* ── Main Content Loading Body ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* Breaking News Strip Skeleton */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Skeleton className="h-5 w-24 rounded bg-rose-200/80" />
            <Skeleton className="h-4 flex-1 max-w-lg" />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Skeleton className="h-6 w-6 rounded" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>

        {/* Trending In-Focus Topics Row Skeleton */}
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Skeleton className="h-4 w-20 bg-rose-100/70 rounded" />
          <div className="flex items-center gap-2 flex-wrap">
            {[100, 90, 80, 110, 120].map((w, i) => (
              <Skeleton key={i} className="h-6 rounded-full" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>

        {/* ── Editorial Hero 2-Column Section Skeleton ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b border-slate-200">
          {/* Main Lead Story (Left Column - 7/12) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <LeadStorySkeleton />
          </div>

          {/* Developing Wire (Right Column - 5/12) */}
          <aside className="lg:col-span-5 xl:col-span-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
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
          {/* Desk Header */}
          <div className="flex items-end justify-between border-b-2 border-slate-900 pb-3">
            <div className="space-y-1">
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-7 w-64" />
            </div>
            <Skeleton className="h-4 w-24" />
          </div>

          {/* 3-Column Cards Grid */}
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
