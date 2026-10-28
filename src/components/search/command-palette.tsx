"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Search,
  FileText,
  ArrowRight,
  X,
  Sparkles,
  TrendingUp,
  Layers,
  Clock,
  Calendar,
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
  { name: "AI News", slug: "ai-news", color: "#4f46e5" },
  { name: "Model Launches", slug: "model-launches", color: "#059669" },
  { name: "AI Tools", slug: "ai-tools", color: "#0284c7" },
  { name: "India AI", slug: "india-ai", color: "#d97706" },
  { name: "Guides", slug: "guides-and-comparisons", color: "#7c3aed" },
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd+K or Ctrl+K)
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

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 80);
      setSelectedIndex(0);
    }
  }, [open]);

  // Debounced live search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
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
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation through results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        onOpenChange(false);
        router.push(`/blog/${results[selectedIndex].slug}`);
      } else if (query.trim()) {
        onOpenChange(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-indigo-100 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[var(--border)] bg-gradient-to-r from-slate-50/70 via-white to-indigo-50/30">
          <Search className="h-5 w-5 text-indigo-600 flex-shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search AI models, tools, benchmarks, India compute... (Enter to view all)"
            className="w-full px-3 text-sm font-medium text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 font-mono ml-2">
            ESC
          </kbd>
        </div>

        {/* Results / Default State Container */}
        <div className="overflow-y-auto p-3 flex-1 divide-y divide-[var(--border)]">
          {/* Loading Indicator */}
          {loading && (
            <div className="p-8 text-center text-xs text-indigo-600 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Scanning AI models and dispatches...</span>
            </div>
          )}

          {/* Results List */}
          {!loading && results.length > 0 && (
            <div className="space-y-1.5 pb-2">
              <div className="px-2 pt-1 pb-2 flex items-center justify-between text-[11px] text-[var(--foreground-muted)] font-semibold">
                <span>Matching Articles ({results.length})</span>
                <span>Use ↑↓ to navigate, Enter to select</span>
              </div>
              {results.map((post, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <button
                    key={post.slug}
                    onClick={() => {
                      onOpenChange(false);
                      router.push(`/blog/${post.slug}`);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-start gap-3.5 p-3 text-left rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-50 border border-indigo-200/80 shadow-2xs"
                        : "hover:bg-[var(--background-secondary)] border border-transparent"
                    }`}
                  >
                    {/* Thumbnail / Icon */}
                    {post.coverImage ? (
                      <div className="relative h-12 w-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          unoptimized
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 flex-shrink-0">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {post.category && (
                          <span className="rounded-md bg-indigo-100/70 text-indigo-700 px-2 py-0.5 text-[10px] font-bold">
                            {post.category.name}
                          </span>
                        )}
                        {post.readingTime && (
                          <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {post.readingTime}m
                          </span>
                        )}
                        {post.publishedAt && (
                          <span className="text-[10px] text-slate-400">
                            {formatDate(post.publishedAt)}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-[var(--foreground)] truncate leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-[11px] text-[var(--foreground-muted)] line-clamp-1 mt-0.5">
                        {post.excerpt}
                      </p>
                    </div>

                    <ArrowRight className={`h-4 w-4 mt-3 flex-shrink-0 transition-opacity ${
                      isSelected ? "text-indigo-600 opacity-100" : "opacity-0"
                    }`} />
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results Fallback */}
          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-bold text-[var(--foreground)]">
                No matching stories found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto">
                Try searching for related models like <strong>DeepSeek</strong>, <strong>Claude</strong>, or <strong>IndiaAI Mission</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/search?q=${encodeURIComponent(query)}`);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                View Full Search Page <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Empty Query Default State (Popular Suggestions & Pillar Hubs) */}
          {!query && (
            <div className="p-4 space-y-4">
              {/* Popular Searches */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-indigo-600" /> Popular Inquiries
                </span>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_QUERIES.map((pq) => (
                    <button
                      key={pq}
                      type="button"
                      onClick={() => setQuery(pq)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 text-xs font-semibold text-[var(--foreground-secondary)] transition-all cursor-pointer"
                    >
                      {pq}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Pillar Hubs */}
              <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-emerald-600" /> Explore Pillars
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {QUICK_CATEGORIES.map((cat) => (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => {
                        onOpenChange(false);
                        router.push(`/category/${cat.slug}`);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-left transition-colors cursor-pointer"
                    >
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-xs font-semibold text-[var(--foreground)] truncate">
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Full Search Link */}
        {query && (
          <div className="p-3 border-t border-[var(--border)] bg-slate-50/80 flex items-center justify-between text-xs text-[var(--foreground-muted)]">
            <span>
              Press <strong>Enter</strong> to open full search for &ldquo;{query}&rdquo;
            </span>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                router.push(`/search?q=${encodeURIComponent(query)}`);
              }}
              className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
            >
              See all results <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
