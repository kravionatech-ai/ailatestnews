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
    window.addEventListener("readingQueueUpdated", loadQueue);
    return () => window.removeEventListener("readingQueueUpdated", loadQueue);
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

  if (queue.length === 0) return null;

  return (
    <>
      {/* Floating Pill Trigger (Bottom Left) */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 rounded-full border-2 border-slate-900 bg-white px-4 py-2.5 shadow-xl hover:bg-slate-50 transition-all cursor-pointer group"
        aria-label="Open saved reading list"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold">
          {queue.length}
        </span>
        <span className="font-mono text-xs font-bold text-slate-900">
          Reading Queue
        </span>
        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
          ({totalReadingTime}m left)
        </span>
      </button>

      {/* Drawer Overlay & Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-r border-slate-200 animate-in slide-in-from-left duration-300"
            role="dialog"
            aria-label="Saved Reading Queue"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>Personal Reading Queue</span>
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  {queue.length} Saved {queue.length === 1 ? "Article" : "Articles"}
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  ~{totalReadingTime} min total reading time
                </span>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                aria-label="Close reading queue"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {queue.map((item, index) => (
                <div
                  key={item.slug}
                  className="group relative rounded-xl border border-slate-200 bg-slate-50/70 p-4 hover:border-slate-400 hover:bg-white transition-all flex items-start justify-between gap-3"
                >
                  <Link
                    href={`/blog/${item.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="flex-1 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 font-mono text-[10px] text-slate-500">
                      <span>Story {index + 1}</span>
                      <span>·</span>
                      <span>{item.readingTime || 5} min read</span>
                    </div>
                    <h5 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h5>
                  </Link>

                  <button
                    onClick={(e) => removeItem(item.slug, e)}
                    className="text-slate-400 hover:text-rose-600 p-1.5 rounded transition-colors"
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
              <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-3">
                <Link
                  href={`/blog/${queue[0].slug}`}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white p-3 font-mono text-xs font-bold transition-all shadow-sm"
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
