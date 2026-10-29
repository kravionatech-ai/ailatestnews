import {
  Skeleton,
  ArticleBodySkeleton,
  TableOfContentsSkeleton,
} from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-white" aria-busy="true" aria-label="Loading article">
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

      {/* ── Header Skeleton ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-48 sm:w-56" />
              <div className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
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
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs Skeleton */}
        <div className="flex items-center gap-2 mb-6">
          <Skeleton className="h-3 w-12" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-3 w-16" />
          <span className="text-slate-300">/</span>
          <Skeleton className="h-3 w-28" />
        </div>

        {/* Category Pill Skeleton */}
        <div className="mb-4">
          <Skeleton className="h-5 w-24 rounded bg-rose-100/70" />
        </div>

        {/* Main Article Headline (3 lines) */}
        <div className="space-y-3 mb-6 max-w-4xl">
          <Skeleton className="h-9 sm:h-12 w-full" />
          <Skeleton className="h-9 sm:h-12 w-11/12" />
          <Skeleton className="h-9 sm:h-12 w-3/4" />
        </div>

        {/* Subtitle / Excerpt Skeleton */}
        <div className="space-y-2 mb-8 max-w-3xl">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>

        {/* Author Byline & Social Actions Bar Skeleton */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-200 mb-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-16 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-28" />
                <span className="text-slate-300">·</span>
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

        {/* Featured Cover Image Placeholder */}
        <div className="mb-10 max-w-5xl">
          <Skeleton className="aspect-16/9 w-full rounded-2xl" />
          <div className="flex justify-between items-center pt-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* ── 2-Column Article Body & Sidebar Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Article Column (8/12) */}
          <div className="lg:col-span-8 space-y-8">
            <ArticleBodySkeleton />

            {/* Topics Pill Row Skeleton */}
            <div className="pt-8 border-t border-slate-200 flex items-center gap-2">
              <Skeleton className="h-3.5 w-14" />
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
            </div>

            {/* Author Bio Box Skeleton */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-6 flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-3.5 w-4/5" />
              </div>
            </div>
          </div>

          {/* Sticky Sidebar Column (4/12) */}
          <aside className="lg:col-span-4 space-y-6">
            <TableOfContentsSkeleton />

            {/* Editorial Standards Card Skeleton */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
              <Skeleton className="h-3.5 w-36" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              <Skeleton className="h-3 w-28 pt-2" />
            </div>

            {/* Trending Wire in Sidebar */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <Skeleton className="h-3.5 w-40" />
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-200">
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
