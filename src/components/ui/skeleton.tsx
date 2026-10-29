import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/80 animate-pulse",
        shimmer &&
          "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer-slide_1.8s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/50 after:to-transparent",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Editorial Lead Story Skeleton (Used on Frontpage Hero)
 */
export function LeadStorySkeleton() {
  return (
    <div className="space-y-4">
      {/* 16:9 Featured Cover Image Placeholder */}
      <Skeleton className="aspect-16/9 w-full rounded-2xl" />

      {/* Editorial Kicker & Date */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3.5 w-24" />
        <span className="text-slate-300">·</span>
        <Skeleton className="h-3.5 w-28" />
        <span className="text-slate-300">·</span>
        <Skeleton className="h-3.5 w-16" />
      </div>

      {/* Main Headline (2 lines) */}
      <div className="space-y-2 pt-1">
        <Skeleton className="h-8 sm:h-10 w-full" />
        <Skeleton className="h-8 sm:h-10 w-4/5" />
      </div>

      {/* Lead Paragraph Excerpt (3 lines) */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Author Byline Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-7 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

/**
 * Editorial Developing Wire Item Skeleton
 */
export function WireItemSkeleton() {
  return (
    <div className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
      <Skeleton className="h-7 w-7 shrink-0 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-2.5 w-24" />
      </div>
    </div>
  );
}

/**
 * Standard 3-Column Editorial Article Card Skeleton
 */
export function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col space-y-3">
      {/* 16:9 Thumbnail Image */}
      <Skeleton className="aspect-16/9 w-full rounded-xl" />

      {/* Category Pill + Date */}
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* Headline (2 lines) */}
      <div className="space-y-1.5">
        <Skeleton className="h-4.5 w-full" />
        <Skeleton className="h-4.5 w-5/6" />
      </div>

      {/* Excerpt snippet */}
      <div className="space-y-1 pt-1">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Footer / Read time */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/**
 * Realistic Article Body Skeleton (Article Detail Pages)
 */
export function ArticleBodySkeleton() {
  return (
    <div className="space-y-6">
      {/* Fact-check banner placeholder */}
      <Skeleton className="h-16 w-full rounded-xl" />

      {/* Paragraph 1 */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      {/* Paragraph 2 */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>

      {/* Section H2 Heading */}
      <Skeleton className="h-7 w-2/3 mt-8 mb-4" />

      {/* Blockquote / Callout Box */}
      <div className="border-l-4 border-slate-300 pl-4 py-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Paragraph 3 */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Section H3 Heading */}
      <Skeleton className="h-6 w-1/2 mt-6 mb-3" />

      {/* Paragraph 4 */}
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    </div>
  );
}

/**
 * Article Table of Contents Skeleton Card
 */
export function TableOfContentsSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
      <Skeleton className="h-3.5 w-32" />
      <div className="space-y-2 pt-2 border-t border-slate-200">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
    </div>
  );
}
