"use client";

import { Bot } from "lucide-react";

export function AskAIButton({ title, slug }: { title: string; slug: string }) {
  const handleAskAI = () => {
    window.dispatchEvent(
      new CustomEvent("open-ai-chat", {
        detail: { slug, title },
      })
    );
  };

  return (
    <button
      onClick={handleAskAI}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-3.5 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)]/15 hover:border-[var(--accent)] transition-all shadow-xs group cursor-pointer"
      title="Ask the AI research assistant specific questions about this article"
    >
      <Bot className="h-3.5 w-3.5 text-[var(--accent)] group-hover:scale-110 transition-transform" />
      <span>Ask AI about this article</span>
    </button>
  );
}
