import { Skeleton, ArticleCardSkeleton } from "@/components/ui/skeleton";

export default function TagLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading tag archive">
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

      {/* ── Tag Header ── */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-3">
          <Skeleton className="h-4 w-28 rounded bg-rose-100" />
          <Skeleton className="h-10 sm:h-12 w-64" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
      </section>

      {/* ── Articles Grid ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </main>
    </div>
  );
}
