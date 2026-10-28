"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

interface HeadlineItem {
  _id: string;
  title: string;
  slug: string;
  publishedAt?: string | Date;
  createdAt?: string | Date;
}

export function BreakingNewsStrip({ headlines }: { headlines: HeadlineItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-advance ticker every 5 seconds if not paused
  useEffect(() => {
    if (!headlines || headlines.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [headlines, isPaused]);

  if (!headlines || headlines.length === 0) return null;

  const current = headlines[currentIndex] || headlines[0];
  if (!current) return null;
  const dateValue = current.publishedAt || current.createdAt;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + headlines.length) % headlines.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % headlines.length);
  };

  return (
    <div
      className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-sky-50/50 py-2"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 overflow-hidden">
          {/* Left: Breaking Badge */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-2xs">
              <Zap className="h-3 w-3 fill-current text-amber-300 animate-pulse" />
              <span>Breaking AI</span>
            </div>

            <span className="hidden md:inline-block font-mono text-[11px] text-[var(--foreground-muted)] font-semibold">
              {currentIndex + 1}/{headlines.length}
            </span>
          </div>

          {/* Center: Active Headline (smooth fade, zero scrollbars) */}
          <div className="flex-1 min-w-0 px-2 sm:px-4">
            <Link
              href={`/blog/${current.slug}`}
              className="group inline-flex items-center gap-2 max-w-full text-xs sm:text-sm font-semibold text-[var(--foreground)] hover:text-[var(--accent)] transition-colors"
            >
              <span className="text-indigo-600 font-bold group-hover:underline truncate">
                {current.title}
              </span>

              {dateValue && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-normal text-[var(--foreground-muted)] flex-shrink-0">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(dateValue)}
                </span>
              )}
            </Link>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={handlePrev}
              className="h-6 w-6 flex items-center justify-center rounded-md border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-indigo-300 transition-all cursor-pointer shadow-3xs"
              aria-label="Previous headline"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="h-6 w-6 flex items-center justify-center rounded-md border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-indigo-300 transition-all cursor-pointer shadow-3xs"
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
