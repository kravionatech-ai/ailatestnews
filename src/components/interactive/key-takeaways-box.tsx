"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, CheckCircle2 } from "lucide-react";

interface KeyTakeawaysProps {
  title: string;
  excerpt: string;
  points?: string[];
}

export function KeyTakeawaysBox({ title, excerpt, points }: KeyTakeawaysProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // If no explicit points provided, only render the authentic summary deck
  const hasCustomPoints = points && points.length > 0;

  if (!excerpt && !hasCustomPoints) return null;

  return (
    <div className="my-6 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-4 sm:p-5 shadow-xs border-l-4 border-l-[var(--accent)]">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--accent)] text-white font-bold">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-heading)]">
            Executive Summary &amp; Core Findings
          </span>
        </div>

        {hasCustomPoints && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-[var(--color-muted-text)] hover:text-[var(--color-heading)] transition-colors cursor-pointer"
            aria-label="Toggle executive summary"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="pt-3 space-y-2.5">
        <p className="text-xs sm:text-sm font-medium text-[var(--color-body-text)] leading-relaxed">
          {excerpt}
        </p>

        {hasCustomPoints && isExpanded && (
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            {points.map((point, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-[var(--color-body-text)] leading-relaxed">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)] shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
