"use client";

import Link from "next/link";
import { Clock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsCardBaseProps } from "./types";

export interface MinimalListCardProps extends NewsCardBaseProps {
  rank?: number;
}

export function MinimalListCard({
  post,
  rank,
  showBadges = true,
  showReadingTime = true,
  showViewsCount = true,
  className,
}: MinimalListCardProps) {
  const showViews = showViewsCount && typeof post.views === "number" && post.views >= 10;
  const formattedRank = typeof rank === "number" ? String(rank).padStart(2, "0") : null;

  return (
    <article
      className={cn(
        "group relative flex items-start gap-4 py-3.5 border-b border-[var(--color-border)] last:border-b-0",
        "hover:bg-[var(--color-secondary-surface)]/30 px-3 -mx-3 rounded-lg transition-colors",
        className
      )}
    >
      {/* Rank Indicator */}
      {formattedRank && (
        <span className="font-mono text-2xl sm:text-3xl font-black text-[var(--color-muted-text)]/40 group-hover:text-[var(--color-primary-accent)] transition-colors w-8 sm:w-10 shrink-0 leading-none mt-0.5">
          {formattedRank}
        </span>
      )}

      {/* Story Details */}
      <div className="flex-1 min-w-0">
        {showBadges && post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="relative z-10 block font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-accent)] mb-1 hover:underline truncate"
          >
            {post.category.name}
          </Link>
        )}

        <h4 className="text-xs sm:text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary-accent)] transition-colors line-clamp-2 leading-snug">
          <Link href={`/blog/${post.slug}`}>
            <span className="absolute inset-0 z-0" aria-hidden="true" />
            {post.title}
          </Link>
        </h4>

        <div className="mt-2 flex items-center gap-3 text-[10px] text-[var(--color-muted-text)]">
          {showReadingTime && post.readingTime && (
            <span className="flex items-center gap-0.5">
              <Clock className="h-2.5 w-2.5" />
              {post.readingTime}m
            </span>
          )}
          {showViews && (
            <span className="flex items-center gap-0.5">
              <Eye className="h-2.5 w-2.5" />
              {post.views!.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
