"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Clock, Eye } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import type { NewsCardBaseProps } from "./types";

export function ImageOverlayCard({
  post,
  showBadges = true,
  showReadingTime = true,
  showViewsCount = true,
  showExcerpt = true,
  showDate = true,
  priorityImage = false,
  className,
}: NewsCardBaseProps) {
  const [imageError, setImageError] = useState(false);
  const dateVal = post.publishedAt || post.createdAt;
  const showViews = showViewsCount && typeof post.views === "number" && post.views >= 10;

  return (
    <article
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden",
        "rounded-[var(--radius-card)] border border-[var(--color-border)]",
        "aspect-16/9 sm:aspect-4/3 min-h-[300px] sm:min-h-[360px] p-5 sm:p-7",
        "shadow-xs hover:shadow-lg transition-all duration-500",
        className
      )}
    >
      {/* Background Image */}
      {post.coverImage && !imageError ? (
        <Image
          src={post.coverImage}
          alt={post.coverImageAlt || post.title}
          fill
          priority={priorityImage}
          onError={() => setImageError(true)}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--color-primary-dark)]" />
      )}

      {/* Dark Multi-Stop Gradient Scrim (Protects Contrast) */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20 group-hover:via-black/50 transition-colors pointer-events-none"
        aria-hidden="true"
      />

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col justify-end text-white">
        {/* Badges & Meta */}
        <div className="flex items-center gap-2 mb-2.5">
          {showBadges && post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="rounded-md bg-[var(--color-primary-accent)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white shadow-xs hover:opacity-90 transition-opacity"
            >
              {post.category.name}
            </Link>
          )}
          {showDate && dateVal && (
            <span className="font-mono text-[10px] uppercase tracking-wider opacity-80">
              {formatRelativeTime(dateVal)}
            </span>
          )}
        </div>

        {/* High-Contrast Title */}
        <h3 className="font-sans font-black text-lg sm:text-xl md:text-2xl text-white group-hover:text-[var(--color-secondary-accent)] tracking-tight leading-snug drop-shadow-sm transition-colors line-clamp-2">
          <Link href={`/blog/${post.slug}`}>
            <span className="absolute inset-0 z-0" aria-hidden="true" />
            {post.title}
          </Link>
        </h3>

        {/* Excerpt */}
        {showExcerpt && post.excerpt && (
          <p className="mt-2 text-xs sm:text-sm text-white/90 line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        {/* Translucent Glass Pill Meta */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
          <span className="font-semibold text-white/95 text-xs">
            {post.author?.name || "Kraviona AI News"}
          </span>

          <div className="flex items-center gap-2 font-mono text-[10px]">
            {showReadingTime && post.readingTime && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-xs px-2 py-0.5 text-white">
                <Clock className="h-2.5 w-2.5" />
                {post.readingTime}m
              </span>
            )}
            {showViews && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-xs px-2 py-0.5 text-white">
                <Eye className="h-2.5 w-2.5" />
                {post.views!.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
