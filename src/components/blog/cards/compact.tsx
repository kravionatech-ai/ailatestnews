"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { NewsCardBaseProps } from "./types";

export function CompactNewsCard({
  post,
  showBadges = true,
  showReadingTime = true,
  showViewsCount = true,
  showDate = true,
  className,
}: NewsCardBaseProps) {
  const dateVal = post.publishedAt || post.createdAt;
  const showViews = showViewsCount && typeof post.views === "number" && post.views >= 10;

  return (
    <article
      className={cn(
        "group relative flex items-start gap-3 p-3 sm:p-3.5",
        "bg-[var(--color-card-background)] border border-[var(--color-border)] rounded-[var(--radius-card)]",
        "hover:bg-[var(--color-secondary-surface)] hover:border-[var(--color-primary-accent)] transition-colors",
        className
      )}
    >
      {/* Optional Mini Thumbnail */}
      {post.coverImage && (
        <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-secondary-surface)]">
          <Image
            src={post.coverImage}
            alt={post.coverImageAlt || post.title}
            fill
            sizes="64px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      {/* Text Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[var(--color-muted-text)] mb-1">
          {showBadges && post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="relative z-10 font-bold text-[var(--color-primary-accent)] hover:underline truncate max-w-[100px]"
            >
              {post.category.name}
            </Link>
          )}
          {showDate && dateVal && <span>· {formatRelativeTime(dateVal)}</span>}
        </div>

        <h4 className="text-xs sm:text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary-accent)] transition-colors line-clamp-2 leading-tight">
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
