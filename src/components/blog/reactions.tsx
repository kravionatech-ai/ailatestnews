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
        colors: ["#D94F35", "#263B50", "#101820", "#E05A42"],
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
        className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all shadow-xs cursor-pointer ${
          hasLiked
            ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40"
            : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] active:scale-95"
        }`}
      >
        <Heart
          className={`h-4 w-4 transition-transform group-hover:scale-110 ${
            hasLiked ? "fill-[var(--accent)] text-[var(--accent)]" : ""
          }`}
        />
        <span>{likes} Applauds</span>
        {hasLiked && <Sparkles className="h-3.5 w-3.5 text-[var(--accent)] animate-spin" />}
      </button>
    </div>
  );
}
