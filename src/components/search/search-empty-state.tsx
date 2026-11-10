"use client";

import Link from "next/link";
import { SearchX, RotateCcw, ArrowRight } from "lucide-react";

interface SearchEmptyStateProps {
  query: string;
  category?: string;
}

export function SearchEmptyState({ query, category }: SearchEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-xs">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
        <SearchX className="h-7 w-7" />
      </div>

      <h3 className="font-display text-xl sm:text-2xl font-black text-[var(--color-heading)] tracking-tight">
        No intelligence reports matched &ldquo;{query}&rdquo;
      </h3>
      <p className="mt-2 text-sm text-[var(--color-muted-text)] leading-relaxed max-w-md mx-auto">
        We found zero exact matches in our archive
        {category ? ` within the ${category.replace(/-/g, " ")} desk` : ""}. Try broadening your search or jumping into a trending query below.
      </p>

      {/* Suggested keywords */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
          Try:
        </span>
        {["DeepSeek-R1", "Sarvam AI", "IndiaAI", "Claude 3.5", "GPU Clusters", "Llama 3.3"].map(
          (term) => (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className="rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              {term}
            </Link>
          )
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/archive"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#101820] hover:bg-[#D94F35] dark:bg-[#E05A42] dark:hover:bg-[#D94F35] px-6 py-3 text-xs sm:text-sm font-bold text-white transition-all"
        >
          <span>Browse Full Archive</span>
          <ArrowRight className="h-4 w-4" />
        </Link>

        <Link
          href="/search"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-5 py-3 text-xs sm:text-sm font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset Search</span>
        </Link>
      </div>
    </div>
  );
}
