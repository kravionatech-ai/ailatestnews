import { Skeleton } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading search">
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

      {/* ── Search Input & Controls Skeleton ── */}
      <div className="border-b border-slate-200 bg-slate-50/70 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
          <div className="space-y-1.5 text-center">
            <Skeleton className="h-8 w-64 mx-auto" />
            <Skeleton className="h-4 w-96 max-w-full mx-auto" />
          </div>

          {/* Big Search Input Box */}
          <Skeleton className="h-14 w-full rounded-2xl border border-slate-300" />

          {/* Filter Chips */}
          <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
            {[70, 85, 110, 80, 100, 95].map((w, i) => (
              <Skeleton key={i} className="h-8 rounded-full" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Search Results List Skeleton ── */}
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <Skeleton className="h-3.5 w-40" />
          <Skeleton className="h-3.5 w-24" />
        </div>

        {/* 5 Result Cards */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row gap-5 p-5 rounded-xl border border-slate-200 bg-white"
          >
            <Skeleton className="aspect-16/9 sm:w-48 sm:h-32 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-2.5">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-20" />
                <span className="text-slate-300">·</span>
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
              <div className="space-y-1 pt-1">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
