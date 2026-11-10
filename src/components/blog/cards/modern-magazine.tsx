"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, Eye, Sparkles } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { CardImage } from "./card-image";
import type { NewsCardBaseProps } from "./types";

export function ModernMagazineCard({
  post,
  aspectRatio = "16:9",
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
        "group relative flex flex-col justify-between overflow-hidden",
        "bg-[var(--color-card-background)] border border-[var(--color-border)] rounded-[var(--radius-card)]",
        "shadow-2xs transition-all duration-300 hover:shadow-md hover:border-[var(--color-primary-accent)] hover:-translate-y-0.5",
        className
      )}
    >
      <div>
        <div className="relative">
          <CardImage
            post={post}
            aspectRatio={aspectRatio}
            priority={priorityImage}
            showBadge={showBadges}
          />
        </div>

        <div className="p-5 sm:p-6">
          {/* Category & Time Kicker */}
          <div className="flex items-center justify-between text-xs mb-2.5">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="relative z-10 inline-flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-primary-accent)] hover:opacity-80 transition-opacity"
              >
                <Sparkles className="h-3 w-3" />
                <span>{post.category.name}</span>
              </Link>
            )}
            {showDate && dateVal && (
              <span className="font-mono text-[10px] uppercase text-[var(--color-muted-text)]">
                {formatRelativeTime(dateVal)}
              </span>
            )}
          </div>

          {/* Punchy Modern Sans Headline */}
          <h3 className="font-sans font-extrabold tracking-tight text-lg sm:text-xl text-[var(--color-heading)] group-hover:text-[var(--color-primary-accent)] transition-colors leading-snug">
            <Link href={`/blog/${post.slug}`}>
              <span className="absolute inset-0 z-0" aria-hidden="true" />
              {post.title}
            </Link>
          </h3>

          {/* Excerpt */}
          {showExcerpt && post.excerpt && (
            <p className="mt-2 text-xs sm:text-sm text-[var(--color-body-text)] line-clamp-2 leading-relaxed">
              {post.excerpt}
            </p>
          )}
        </div>
      </div>

      {/* Meta Footer */}
      <div className="px-5 pb-5 sm:px-6 sm:pb-6 pt-3 flex items-center justify-between text-xs text-[var(--color-muted-text)] border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2 relative z-10">
          {showAuthorAvatar && (
            post.author?.image ? (
              <div className="relative h-6 w-6 overflow-hidden rounded-full border border-[var(--color-border)]">
                <Image
                  src={post.author.image}
                  alt={post.author.name || "Author"}
                  fill
                  className="object-cover"
                  sizes="24px"
                />
              </div>
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-secondary-surface)] font-bold text-[var(--color-heading)] text-[10px]">
                {post.author?.name?.charAt(0) || "A"}
              </div>
            )
          )}
          <span className="font-semibold text-[var(--color-heading)] truncate max-w-[120px]">
            {post.author?.name || "AI Editorial"}
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
    </article>
  );
}
