import { Skeleton, ArticleCardSkeleton } from "@/components/ui/skeleton";

export default function AuthorLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading author profile">
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

      {/* ── Author Profile Header ── */}
      <section className="border-b border-slate-200 bg-slate-50/70 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <Skeleton className="h-24 w-24 rounded-full shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="space-y-1">
              <Skeleton className="h-3.5 w-32 rounded mx-auto sm:mx-0" />
              <Skeleton className="h-8 w-60 mx-auto sm:mx-0" />
            </div>
            <div className="space-y-1.5 max-w-xl mx-auto sm:mx-0">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-4/5" />
            </div>
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Author Articles Grid ── */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
          <ArticleCardSkeleton />
        </div>
      </main>
    </div>
  );
}
