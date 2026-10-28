"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Radio } from "lucide-react";
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

  useEffect(() => {
    if (!headlines || headlines.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length);
    }, 5000);
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
      className="border-b border-slate-200 bg-white py-2.5 transition-colors"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Breaking AI Dispatches"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Breaking Kicker */}
          <div className="flex items-center gap-2.5 shrink-0">
            <span className="flex items-center gap-1.5 rounded-sm bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>Developing</span>
            </span>
            <span className="hidden sm:inline-block font-mono text-[11px] font-semibold text-slate-400">
              {currentIndex + 1} of {headlines.length}
            </span>
          </div>

          {/* Current Headline */}
          <div className="min-w-0 flex-1 flex items-center gap-3">
            <Link
              href={`/blog/${current.slug}`}
              className="text-xs sm:text-sm font-bold text-slate-900 hover:text-indigo-600 truncate transition-colors"
            >
              {current.title}
            </Link>
            {dateValue && (
              <span className="hidden md:inline shrink-0 font-mono text-[11px] text-slate-400">
                · {formatRelativeTime(dateValue)}
              </span>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handlePrev}
              className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              aria-label="Previous headline"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="flex h-6 w-6 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
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
