"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import { cn } from "@/lib/utils";

export interface HeadlineItem {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string | Date;
  createdAt?: string | Date;
}

export interface BreakingNewsProps {
  config?: HomepageSectionConfig;
  posts?: NewsCardPost[];
  headlines?: HeadlineItem[];
  kicker?: string;
  limit?: number;
  className?: string;
}

export function BreakingNewsSection({
  config,
  posts,
  headlines: headlinesProp,
  kicker: kickerProp,
  limit: limitProp,
  className,
}: BreakingNewsProps) {
  // Normalize items from either headlines prop or posts prop
  const items: HeadlineItem[] =
    headlinesProp ||
    (posts || [])
      .filter((p) => (p.isBreaking ? true : true))
      .sort((a, b) => (b.isBreaking ? 1 : 0) - (a.isBreaking ? 1 : 0))
      .slice(0, config?.limit || limitProp || 5)
      .map((p) => ({
        _id: p._id || p.slug,
        title: p.title,
        slug: p.slug,
        publishedAt: p.publishedAt,
        createdAt: p.createdAt,
      }));

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!items || items.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items, isPaused]);

  if (!items || items.length === 0) return null;

  const current = items[currentIndex] || items[0];
  if (!current) return null;
  const dateValue = current.publishedAt || current.createdAt;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const badgeText = config?.kicker || kickerProp || "Developing";

  return (
    <div
      className={cn(
        "border-b border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)] py-2.5 transition-colors",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Breaking AI Dispatches"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1280px)] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Breaking Kicker Pill */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center gap-1.5 rounded-sm bg-[var(--color-breaking-news,#EF4444)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-2xs">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>{badgeText}</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[11px] font-semibold text-[var(--color-muted-text,#64748B)]">
              {currentIndex + 1} of {items.length}
            </span>
          </div>

          {/* Current Headline */}
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <Link
              href={`/blog/${current.slug}`}
              className="text-xs sm:text-sm font-bold text-[var(--color-heading,#0F172A)] hover:text-[var(--color-primary-accent,#10B981)] truncate transition-colors"
            >
              {current.title}
            </Link>
            {dateValue && (
              <span className="hidden md:inline shrink-0 font-mono text-[11px] text-[var(--color-muted-text,#64748B)]">
                · {formatRelativeTime(dateValue)}
              </span>
            )}
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrev}
              className="flex h-6 w-6 items-center justify-center rounded border border-[var(--color-border,#E2E8F0)] text-[var(--color-muted-text,#64748B)] hover:bg-[var(--color-secondary-surface,#F1F5F9)] hover:text-[var(--color-heading,#0F172A)] transition-colors cursor-pointer"
              aria-label="Previous headline"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-6 w-6 items-center justify-center rounded border border-[var(--color-border,#E2E8F0)] text-[var(--color-muted-text,#64748B)] hover:bg-[var(--color-secondary-surface,#F1F5F9)] hover:text-[var(--color-heading,#0F172A)] transition-colors cursor-pointer"
              aria-label="Next headline"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Backward-compatibility alias
export { BreakingNewsSection as BreakingNewsStrip };
