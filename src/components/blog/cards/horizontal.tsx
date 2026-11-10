"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { CardImage } from "./card-image";
import type { NewsCardBaseProps } from "./types";

export function HorizontalCard({
  post,
  showBadges = true,
  showAuthorAvatar = true,
  showReadingTime = true,
  showViewsCount = true,
  showExcerpt = true,
  showDate = true,
  priorityImage = false,
  className,
}: NewsCardBaseProps) {
  const dateVal = post.publishedAt || post.createdAt;
  const showViews = showViewsCount && typeof post.views === "number" && post.views >= 10;

  return (
    <article
      className={cn(
        "group relative flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-5",
        "bg-[var(--color-card-background)] border border-[var(--color-border)] rounded-[var(--radius-card)]",
        "shadow-2xs transition-all duration-300 hover:border-[var(--color-primary-accent)] hover:shadow-sm",
        className
      )}
    >
      {/* Thumbnail Container: 100% on mobile, fixed width on desktop */}
      <div className="w-full sm:w-44 md:w-52 shrink-0">
        <CardImage
          post={post}
          aspectRatio="16:9"
          priority={priorityImage}
          showBadge={showBadges}
          className="rounded-lg border border-[var(--color-border)]"
        />
      </div>

      {/* Content Column */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {/* Category & Timestamp */}
          <div className="flex items-center gap-2.5 text-xs text-[var(--color-muted-text)] mb-2">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-accent)] hover:underline"
              >
                {post.category.name}
              </Link>
            )}
            {showDate && dateVal && (
              <>
                <span>·</span>
                <span className="text-[11px] font-mono">{formatRelativeTime(dateVal)}</span>
              </>
            )}
          </div>

          {/* Headline */}
          <h3 className="text-base sm:text-lg font-bold text-[var(--color-heading)] group-hover:text-[var(--color-primary-accent)] transition-colors line-clamp-2 leading-snug">
            <Link href={`/blog/${post.slug}`}>
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              {post.title}
            </Link>
          </h3>

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-body-text)] line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>

        {/* Footer Row */}
        <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-muted-text)]">
          <div className="flex items-center gap-2 relative z-10">
            {showAuthorAvatar && (
              post.author?.image ? (
                <div className="relative h-5 w-5 overflow-hidden rounded-full border border-[var(--color-border)]">
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    className="object-cover"
                    sizes="20px"
                  />
                </div>
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-secondary-surface)] font-bold text-[var(--color-heading)] text-[9px]">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )
            )}
            <span className="font-semibold text-[var(--color-heading)] text-[11px] truncate max-w-[120px]">
              {post.author?.name || "Editorial Desk"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {showReadingTime && post.readingTime && (
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="h-3 w-3" />
                {post.readingTime}m
              </span>
            )}
            {showViews && (
              <span className="flex items-center gap-1 text-[11px]">
                <Eye className="h-3 w-3" />
                {post.views!.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
