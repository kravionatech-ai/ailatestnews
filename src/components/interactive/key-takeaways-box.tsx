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
    <div className="my-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5 shadow-2xs">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-white font-bold">
            <Sparkles className="h-3 w-3" />
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
            Executive Summary &amp; Core Findings
          </span>
        </div>

        {hasCustomPoints && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            aria-label="Toggle executive summary"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>

      <div className="pt-3 space-y-2.5">
        <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
          {excerpt}
        </p>

        {hasCustomPoints && isExpanded && (
          <div className="space-y-2 pt-2 border-t border-slate-200/60">
            {points.map((point, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-slate-800 leading-relaxed">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
