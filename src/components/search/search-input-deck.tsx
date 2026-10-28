"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Sparkles, ArrowRight, SlidersHorizontal } from "lucide-react";

const SUGGESTED_TOPICS = [
  "DeepSeek-R1",
  "Sarvam AI",
  "IndiaAI 10,000 GPUs",
  "Claude 3.5 Sonnet",
  "Llama 3.3",
  "Cursor AI",
  "Enterprise RAG",
  "Ollama local",
];

interface SearchInputDeckProps {
  initialQuery?: string;
  initialSort?: string;
  initialCategory?: string;
}

export function SearchInputDeck({
  initialQuery = "",
  initialSort = "latest",
  initialCategory = "",
}: SearchInputDeckProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (newQuery: string, newSort = initialSort, newCategory = initialCategory) => {
    const params = new URLSearchParams();
    const cleanQ = newQuery.trim();
    if (cleanQ) params.set("q", cleanQ);
    if (newCategory) params.set("category", newCategory);
    if (newSort && newSort !== "latest") params.set("sort", newSort);

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  const handleTopicClick = (topic: string) => {
    setQuery(topic);
    handleSearch(topic);
  };

  const handleClear = () => {
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    startTransition(() => {
      router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
    });
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Search Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-600 transition-transform group-focus-within:scale-110" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AI models, tools, IndiaAI, comparisons, benchmarks..."
            className="w-full rounded-2xl border-2 border-slate-200 bg-white pl-12 sm:pl-13 pr-12 py-3.5 sm:py-4 text-sm sm:text-base font-medium text-[var(--foreground)] placeholder:text-slate-400 outline-none transition-all shadow-sm focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100/60"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              aria-label="Clear query"
            >
              <div className="rounded-full p-1 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </div>
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="ml-2.5 sm:ml-3 rounded-2xl bg-indigo-600 px-5 sm:px-7 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 active:scale-98 transition-all shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isPending ? (
            <Sparkles className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Search</span>
              <ArrowRight className="hidden sm:inline-block h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Suggested Topic Chips */}
      <div className="mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          Trending:
        </span>
        {SUGGESTED_TOPICS.map((topic) => {
          const isActive = query.toLowerCase() === topic.toLowerCase();
          return (
            <button
              key={topic}
              type="button"
              onClick={() => handleTopicClick(topic)}
              className={`rounded-xl px-2.5 sm:px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent"
              }`}
            >
              {topic}
            </button>
          );
        })}
      </div>
    </div>
  );
}
