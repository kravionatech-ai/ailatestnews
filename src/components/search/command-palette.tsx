"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  FileText,
  ArrowRight,
  X,
  Loader2,
  TrendingUp,
  Layers,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SearchResult {
  title: string;
  slug: string;
  excerpt: string;
  coverImage?: string;
  category?: { name: string; slug: string };
  readingTime?: number;
  publishedAt?: string | Date;
}

const POPULAR_QUERIES = [
  "DeepSeek-R1",
  "Sarvam AI",
  "IndiaAI 10,000 GPUs",
  "Claude 3.5 Sonnet",
  "Llama 3.3",
  "Enterprise RAG",
];

const QUICK_CATEGORIES = [
  { name: "All", slug: "" },
  { name: "AI News", slug: "ai-news" },
  { name: "AI Models", slug: "model-launches" },
  { name: "AI Tools", slug: "ai-tools" },
  { name: "Startups", slug: "india-ai" },
  { name: "Guides", slug: "guides-and-comparisons" },
  { name: "Enterprise", slug: "enterprise-ai" },
];

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim() && !activeCategory) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (activeCategory) params.set("category", activeCategory);
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = await res.json();
        if (data.posts) {
          setResults(data.posts);
          setSelectedIndex(0);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 160);

    return () => clearTimeout(timer);
  }, [query, activeCategory]);

  const navigateToFullSearch = () => {
    onOpenChange(false);
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (activeCategory) params.set("category", activeCategory);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length > 0 ? (prev - 1 + results.length) % results.length : 0
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        onOpenChange(false);
        router.push(`/blog/${results[selectedIndex].slug}`);
      } else if (query.trim() || activeCategory) {
        navigateToFullSearch();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-4 bg-[#101820]/65 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Search Kraviona AI News"
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[var(--color-card-background)] shadow-2xl border border-[var(--border)] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[82vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border)] bg-[var(--color-main-background)]">
          <Search className="h-5 w-5 text-[var(--accent)] flex-shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search AI models, research, tools, startups..."
            className="w-full px-3 text-sm font-medium text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none bg-transparent"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 text-[var(--color-muted-text)] hover:text-[var(--color-heading)] transition-colors cursor-pointer"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="hidden sm:inline-block rounded-md border border-[var(--border)] bg-[var(--color-card-background)] px-2 py-0.5 text-[10px] text-[var(--color-muted-text)] font-mono ml-2 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Chips Strip */}
        <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--color-card-background)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] mr-1 shrink-0">
            Filter:
          </span>
          {QUICK_CATEGORIES.map((cat) => {
            const selected = activeCategory === cat.slug;
            return (
              <button
                key={cat.slug || "all"}
                type="button"
                onClick={() => setActiveCategory(cat.slug)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-mono font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  selected
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--color-main-background)] text-[var(--color-heading)] hover:text-[var(--accent)] border border-[var(--border)]"
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Results / Discovery Container */}
        <div className="overflow-y-auto p-3 flex-1 divide-y divide-[var(--border)]">
          {loading && (
            <div className="p-8 text-center text-xs font-mono text-[var(--accent)] flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching Kraviona Intelligence Archive...</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1.5 pb-2">
              <div className="px-2 pt-1 pb-2 flex items-center justify-between text-[11px] font-mono text-[var(--color-muted-text)]">
                <span>Matching Articles ({results.length})</span>
                <span className="hidden sm:inline">Use ↑↓ to navigate · Enter to read</span>
              </div>
              {results.map((post, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={post.slug}
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/blog/${post.slug}`);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-start gap-3.5 p-3 text-left rounded-xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--color-main-background)] border border-[var(--accent)]/60"
                        : "hover:bg-[var(--color-main-background)] border border-transparent"
                    }`}
                  >
                    {post.coverImage ? (
                      <div className="relative h-12 w-16 rounded-lg overflow-hidden bg-[var(--color-secondary-surface)] flex-shrink-0 border border-[var(--border)]">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex-shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 font-mono text-[10px]">
                        {post.category && (
                          <span className="font-bold uppercase tracking-wider text-[var(--accent)]">
                            {post.category.name}
                          </span>
                        )}
                        {post.readingTime && (
                          <span className="text-[var(--color-muted-text)] flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {post.readingTime}m
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="text-[var(--color-muted-text)] hidden sm:inline">
                            {formatDate(post.publishedAt, { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>

                      <h4 className="font-display text-xs sm:text-sm font-bold text-[var(--color-heading)] truncate leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-[11px] text-[var(--color-muted-text)] line-clamp-1 mt-0.5">
                        {post.excerpt}
                      </p>
                    </div>

                    <ArrowRight
                      className={`h-4 w-4 mt-3 flex-shrink-0 transition-opacity ${
                        isSelected ? "text-[var(--accent)] opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty Search State */}
          {!loading && (query || activeCategory) && results.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <p className="font-display text-sm font-bold text-[var(--color-heading)]">
                No matching articles found{query ? ` for “${query}”` : ""}
              </p>
              <p className="text-xs text-[var(--color-muted-text)] max-w-sm mx-auto">
                Try broader terms like <strong>DeepSeek</strong>, <strong>Claude</strong>, <strong>Sarvam</strong>, or switch category filters.
              </p>
              <button
                type="button"
                onClick={navigateToFullSearch}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer"
              >
                Open Full Search Page <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Initial Discovery State */}
          {!query && !activeCategory && (
            <div className="p-4 space-y-5">
              <div className="space-y-2.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" /> Trending Inquiries
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_QUERIES.map((pq) => (
                    <button
                      key={pq}
                      type="button"
                      onClick={() => setQuery(pq)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-xs font-semibold text-[var(--color-heading)] transition-all cursor-pointer"
                    >
                      {pq}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[var(--border)]">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[var(--accent)]" /> Intelligence Desks
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_CATEGORIES.filter((c) => c.slug).map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        router.push(`/category/${cat.slug}`);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] text-left transition-colors cursor-pointer group"
                    >
                      <span className="text-xs font-semibold text-[var(--color-heading)] group-hover:text-[var(--accent)] truncate">
                        {cat.name}
                      </span>
                      <ArrowRight className="h-3 w-3 text-[var(--color-muted-text)] group-hover:text-[var(--accent)] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Overlay Footer */}
        {(query || activeCategory) && (
          <div className="p-3 border-t border-[var(--border)] bg-[var(--color-main-background)] flex items-center justify-between text-xs text-[var(--color-muted-text)]">
            <span className="font-mono text-[11px]">
              Press <strong className="text-[var(--color-heading)]">Enter</strong> for full results
            </span>
            <button
              type="button"
              onClick={navigateToFullSearch}
              className="font-mono text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              See all results <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
