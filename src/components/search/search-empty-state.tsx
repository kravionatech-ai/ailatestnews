"use client";

import Link from "next/link";
import { SearchX, Bot, ArrowRight, RotateCcw, Sparkles } from "lucide-react";

interface SearchEmptyStateProps {
  query: string;
  category?: string;
}

export function SearchEmptyState({ query, category }: SearchEmptyStateProps) {
  const handleOpenAIChat = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-ai-chat", {
          detail: { slug: "", title: query },
        })
      );
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-indigo-50/20 to-slate-50 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs mb-4">
        <SearchX className="h-8 w-8 text-indigo-600" />
      </div>

      <h3 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] tracking-tight">
        No dispatches found for &ldquo;{query}&rdquo;
      </h3>
      <p className="mt-2 text-sm text-[var(--foreground-muted)] leading-relaxed max-w-md mx-auto">
        We couldn&apos;t find an exact match in our published archives
        {category ? ` under this category` : ""}. Try adjusting your keywords or consult our real-time 3D AI Assistant.
      </p>

      {/* Suggested keywords */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-semibold text-slate-500">Try searching:</span>
        {["DeepSeek-R1", "Sarvam AI", "IndiaAI", "Claude 3.5", "GPU Clusters", "Llama 3.3"].map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
          >
            {term}
          </Link>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleOpenAIChat}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all cursor-pointer"
        >
          <Bot className="h-4 w-4" />
          <span>Ask 3D AI Assistant about &ldquo;{query}&rdquo;</span>
        </button>

        <Link
          href="/search"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset Search</span>
        </Link>
      </div>
    </div>
  );
}
