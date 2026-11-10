"use client";

import { useState } from "react";
import { Heart, Bookmark, Share2, ArrowUp, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

interface FloatingDockProps {
  postId: string;
  slug: string;
  title: string;
  className?: string;
}

export function FloatingEngagementDock({
  postId,
  slug,
  title,
  className = "",
}: FloatingDockProps) {
  const [likes, setLikes] = useState(12);
  const [hasLiked, setHasLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleLike = () => {
    if (hasLiked) return;
    setLikes((l) => l + 1);
    setHasLiked(true);
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.85 } });
    } catch {}
    fetch(`/api/posts/${postId}/like`, { method: "POST" }).catch(() => {});
  };

  const handleSave = () => {
    try {
      const savedQueue = JSON.parse(localStorage.getItem("ai_reading_queue") || "[]");
      if (!isSaved) {
        savedQueue.push({ postId, slug, title, savedAt: new Date().toISOString() });
        localStorage.setItem("ai_reading_queue", JSON.stringify(savedQueue));
        setIsSaved(true);
      }
    } catch {}
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <aside
      aria-label="Floating engagement dock"
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[var(--color-primary-dark)]/95 backdrop-blur-md text-white rounded-full px-5 py-2.5 shadow-2xl border border-white/20 flex items-center gap-4 text-xs font-mono transition-transform hover:scale-102",
        className
      )}
    >
      {/* Applaud */}
      <button
        onClick={handleLike}
        className="flex items-center gap-1.5 hover:text-rose-400 transition-colors cursor-pointer"
        title="Applaud dispatch"
      >
        <Heart className={cn("h-4 w-4", hasLiked ? "fill-rose-500 text-rose-500" : "")} />
        <span>{likes}</span>
      </button>

      <span className="opacity-40">|</span>

      {/* Bookmark */}
      <button
        onClick={handleSave}
        className="flex items-center gap-1 hover:text-[var(--color-secondary-accent)] transition-colors cursor-pointer"
        title={isSaved ? "Saved" : "Save to queue"}
      >
        {isSaved ? <Check className="h-4 w-4 text-[var(--color-secondary-accent)]" /> : <Bookmark className="h-4 w-4" />}
        <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
      </button>

      <span className="opacity-40">|</span>

      {/* Share */}
      <button
        onClick={() => {
          if (navigator.share) {
            navigator.share({ title, url: window.location.href }).catch(() => {});
          } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied!");
          }
        }}
        className="flex items-center gap-1 hover:text-sky-300 transition-colors cursor-pointer"
        title="Share dispatch"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">Share</span>
      </button>

      <span className="opacity-40">|</span>

      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className="p-1 hover:text-slate-200 transition-colors cursor-pointer"
        title="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </aside>
  );
}

export default FloatingEngagementDock;
