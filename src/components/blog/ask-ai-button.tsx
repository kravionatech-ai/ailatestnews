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
      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-all shadow-2xs group"
      title="Ask the AI research assistant specific questions about this article"
    >
      <Bot className="h-3.5 w-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
      <span>Ask AI about this article</span>
    </button>
  );
}
