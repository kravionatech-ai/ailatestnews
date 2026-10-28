"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Heart, Sparkles } from "lucide-react";

export function Reactions({ postId }: { postId: string }) {
  const [likes, setLikes] = useState(12);
  const [hasLiked, setHasLiked] = useState(false);

  const handleLike = () => {
    if (hasLiked) return;

    setLikes((prev) => prev + 1);
    setHasLiked(true);

    // Fire confetti celebration
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ["#4f46e5", "#38bdf8", "#818cf8", "#f43f5e"],
      });
    } catch {
      // safe fallback
    }

    // Persist reaction
    fetch(`/api/posts/${postId}/like`, { method: "POST" }).catch(() => {});
  };

  return (
    <div className="flex items-center gap-3 py-4">
      <button
        onClick={handleLike}
        disabled={hasLiked}
        className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-sm ${
          hasLiked
            ? "bg-rose-50 text-rose-600 border border-rose-200"
            : "border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-rose-300 hover:text-rose-600 active:scale-95"
        }`}
      >
        <Heart
          className={`h-4 w-4 transition-transform group-hover:scale-110 ${
            hasLiked ? "fill-rose-500 text-rose-500" : ""
          }`}
        />
        <span>{likes} Applauds</span>
        {hasLiked && <Sparkles className="h-3.5 w-3.5 text-rose-400 animate-spin" />}
      </button>
    </div>
  );
}
