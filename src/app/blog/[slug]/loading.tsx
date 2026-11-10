import {
  Skeleton,
  ArticleBodySkeleton,
  TableOfContentsSkeleton,
} from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-[var(--color-main-background)]" aria-busy="true" aria-label="Loading article">
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

      {/* ── Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--color-card-background)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[var(--max-content-width,1320px)] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 sm:w-56" />
              <div className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            </div>
            <Skeleton className="h-2.5 w-32" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-36 sm:w-56 rounded-lg" />
            <Skeleton className="hidden sm:block h-9 w-28 rounded-lg" />
          </div>
        </div>
      </header>

      {/* ── Article Content Skeleton ── */}
      <main className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-3 w-12" />
          <span className="text-[var(--color-muted-text)]">/</span>
          <Skeleton className="h-3 w-16" />
          <span className="text-[var(--color-muted-text)]">/</span>
          <Skeleton className="h-3 w-28" />
        </div>

        <div className="mb-4">
          <Skeleton className="h-5 w-24 rounded bg-[var(--accent)]/20" />
        </div>

        <div className="space-y-3 mb-6 max-w-4xl">
          <Skeleton className="h-9 sm:h-12 w-full" />
          <Skeleton className="h-9 sm:h-12 w-11/12" />
          <Skeleton className="h-9 sm:h-12 w-3/4" />
        </div>

        <div className="space-y-2 mb-8 max-w-3xl">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-[var(--border)] mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <span className="text-[var(--color-muted-text)]">·</span>
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>

        <div className="mb-10 max-w-5xl">
          <Skeleton className="aspect-16/9 w-full rounded-2xl" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            <ArticleBodySkeleton />

            <div className="pt-8 border-t border-[var(--border)] flex items-center gap-2">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <TableOfContentsSkeleton />

            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 space-y-3">
              <Skeleton className="h-3.5 w-36" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-3 w-28 pt-2" />
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 space-y-4">
              <Skeleton className="h-3.5 w-40" />
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
