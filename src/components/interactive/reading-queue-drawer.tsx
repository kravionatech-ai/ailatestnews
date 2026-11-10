"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, X, Trash2, ArrowRight, BookOpen } from "lucide-react";

interface QueueItem {
  postId: string;
  slug: string;
  title: string;
  readingTime?: number;
  savedAt: string;
}

export function ReadingQueueDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const loadQueue = () => {
    try {
      const items = JSON.parse(localStorage.getItem("ai_reading_queue") || "[]");
      setQueue(items);
    } catch {}
  };

  useEffect(() => {
    loadQueue();
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("readingQueueUpdated", loadQueue);
    window.addEventListener("openReadingQueue", handleOpen);
    return () => {
      window.removeEventListener("readingQueueUpdated", loadQueue);
      window.removeEventListener("openReadingQueue", handleOpen);
    };
  }, []);

  const removeItem = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = queue.filter((item) => item.slug !== slug);
      localStorage.setItem("ai_reading_queue", JSON.stringify(updated));
      setQueue(updated);
      window.dispatchEvent(new Event("readingQueueUpdated"));
    } catch {}
  };

  const totalReadingTime = queue.reduce((acc, item) => acc + (item.readingTime || 5), 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-[#101820]/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md h-full bg-[var(--color-card-background)] shadow-2xl flex flex-col border-r border-[var(--border)] animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-label="Saved Reading Queue"
          >
            {/* Header */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-1">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Personal Reading Queue</span>
                </div>
                <h3 className="font-editorial text-lg font-bold text-[var(--color-heading)]">
                  {queue.length} Saved {queue.length === 1 ? "Article" : "Articles"}
                </h3>
                <span className="text-xs text-[var(--color-muted-text)] font-mono">
                  ~{totalReadingTime} min total reading time
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-[var(--color-muted-text)] hover:text-[var(--color-heading)] rounded-lg hover:bg-[var(--color-secondary-surface)] transition-colors cursor-pointer"
                aria-label="Close reading queue"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[var(--color-main-background)]">
              {queue.map((item, index) => (
                <div
                  key={item.slug}
                  className="group relative rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-4 hover:border-[var(--accent)] transition-all flex items-start justify-between gap-3"
                >
                  <Link
                    href={`/blog/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-muted-text)]">
                      <span>Story {index + 1}</span>
                      <span>·</span>
                      <span>{item.readingTime || 5} min read</span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h5>
                  </Link>

                  <button
                    onClick={(e) => removeItem(item.slug, e)}
                    className="text-[var(--color-muted-text)] hover:text-[var(--accent)] p-1.5 rounded transition-colors cursor-pointer"
                    title="Remove from queue"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            {queue[0] && (
              <div className="p-6 border-t border-[var(--border)] bg-[var(--color-card-background)] space-y-3">
                <Link
                  href={`/blog/${queue[0].slug}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white p-3 font-mono text-xs font-bold transition-all shadow-sm"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Start Reading Queue ({totalReadingTime} min)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}
    </>
  );
}
