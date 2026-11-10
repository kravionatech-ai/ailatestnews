"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, Loader2, ArrowRight, Flame } from "lucide-react";

const SUGGESTED_TOPICS = [
  "DeepSeek-R1",
  "Sarvam AI",
  "IndiaAI 10,000 GPUs",
  "Claude 3.5 Sonnet",
  "Llama 3.3",
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

  const handleSearch = (
    newQuery: string,
    newSort = initialSort,
    newCategory = initialCategory
  ) => {
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
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[var(--accent)]" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AI models, research papers, tools, startups..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] pl-11 pr-11 py-3.5 text-sm sm:text-base font-medium text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none transition-all shadow-xs focus:border-[var(--accent)]"
          />

          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-3 flex items-center text-[var(--color-muted-text)] hover:text-[var(--color-heading)] transition-colors cursor-pointer"
              aria-label="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#101820] hover:bg-[#D94F35] dark:bg-[#E05A42] dark:hover:bg-[#D94F35] px-5 sm:px-7 py-3.5 text-sm sm:text-base font-bold text-white shadow-xs transition-all shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Search</span>
              <ArrowRight className="hidden sm:inline-block h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Suggested Topic Chips */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] flex items-center gap-1 mr-1">
          <Flame className="h-3.5 w-3.5 text-[var(--accent)]" />
          Trending:
        </span>
        {SUGGESTED_TOPICS.map((topic) => {
          const isActive = query.toLowerCase() === topic.toLowerCase();
          return (
            <button
              key={topic}
              type="button"
              onClick={() => handleTopicClick(topic)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[var(--accent)] text-white"
                  : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
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
