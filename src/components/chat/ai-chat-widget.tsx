"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  RotateCcw,
  BookOpen,
  Compass,
  Search,
  Check,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  feedbackGiven?: "up" | "down";
}

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [articleContext, setArticleContext] = useState<{
    slug: string;
    title: string;
  } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Welcome to the **AI Latest Newsroom Desk**. I can help you search our published reporting, cross-reference foundation model benchmarks, explain Indian AI policies (like the ₹10,372 Cr IndiaAI Mission), and break down architectural disclosures.",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  // Global event listener for "Ask AI about this article"
  useEffect(() => {
    const handleOpenWithArticle = (e: CustomEvent<{ slug: string; title: string }>) => {
      setArticleContext(e.detail);
      setIsOpen(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `context-${Date.now()}`,
          role: "assistant",
          content: `I've loaded our dispatch on **"${e.detail.title}"**. What technical questions or implications would you like to explore?`,
        },
      ]);
      setTimeout(() => inputRef.current?.focus(), 200);
    };

    window.addEventListener(
      "open-ai-chat" as unknown as keyof WindowEventMap,
      handleOpenWithArticle as EventListener
    );
    return () => {
      window.removeEventListener(
        "open-ai-chat" as unknown as keyof WindowEventMap,
        handleOpenWithArticle as EventListener
      );
    };
  }, []);

  // Keyboard shortcut (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = typeof customPrompt === "string" ? customPrompt : input;
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    const assistantMsgId = `asst-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          articleSlug: articleContext?.slug,
        }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(errorText || "Service temporarily unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        streamedText += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId ? { ...m, content: streamedText } : m
          )
        );
      }
    } catch (err: unknown) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  err instanceof Error
                    ? err.message
                    : "I couldn't reach the newsroom database right now. Please try again shortly.",
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleFeedback = async (msgId: string, rating: "up" | "down") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedbackGiven: rating } : m))
    );
    try {
      await fetch("/api/chat/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    } catch {
      // ignore
    }
  };

  // Helper to render markdown links like [Title](/blog/slug)
  const renderMessageContent = (text: string) => {
    const linkRegex = /\[(.*?)\]\((.*?)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const label = match[1] || "";
      const url = match[2] || "#";

      parts.push(
        <Link
          key={`${url}-${match.index}`}
          href={url}
          className="inline-flex items-center gap-1 font-semibold text-indigo-600 underline hover:text-indigo-800"
          target={url.startsWith("http") ? "_blank" : undefined}
          rel={url.startsWith("http") ? "noreferrer" : undefined}
        >
          {label}
          {url.startsWith("http") ? (
            <ExternalLink className="h-3 w-3" />
          ) : (
            <span className="text-[10px]">↗</span>
          )}
        </Link>
      );
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const sampleQuestions = [
    "What are India's ₹10,372 Cr GPU subsidies?",
    "Explain DeepSeek-R1's architecture",
    "Sarvam AI defence pact details",
  ];

  return (
    <>
      {/* Human Editorial Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white pl-3.5 pr-4 py-2 text-xs font-mono font-bold uppercase tracking-wider shadow-lg hover:shadow-xl hover:scale-102 active:scale-98 transition-all border border-slate-700 cursor-pointer"
          aria-label="Open Newsroom Research Desk"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-rose-400">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <span>Newsroom Desk</span>
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
        </button>
      )}

      {/* Editorial Drawer / Popover Window */}
      {isOpen && (
        <div
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col sm:w-[440px] sm:h-[640px] bg-white sm:rounded-2xl border border-slate-300 shadow-2xl overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Newsroom Research Desk"
        >
          {/* Masthead Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-900 p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-800 border border-slate-700 text-rose-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-tight text-white leading-none">
                    NEWSROOM RESEARCH DESK
                  </h3>
                  <span className="font-mono text-[9px] font-bold uppercase tracking-wider bg-rose-600 px-1.5 py-0.5 rounded text-white">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Primary source reporting &amp; benchmark database
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome-reset",
                      role: "assistant",
                      content: "Chat cleared. What can I help you research today?",
                    },
                  ]);
                  setArticleContext(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear Research History"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Drawer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active Context Bar */}
          {articleContext && (
            <div className="flex items-center justify-between bg-slate-100 px-4 py-2 text-xs text-slate-700 border-b border-slate-200">
              <span className="truncate flex items-center gap-1.5 font-medium">
                <BookOpen className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span className="text-slate-500">Context:</span>
                <span className="font-semibold text-slate-900 truncate">
                  {articleContext.title}
                </span>
              </span>
              <button
                onClick={() => setArticleContext(null)}
                className="text-slate-400 hover:text-slate-600 ml-2 shrink-0 cursor-pointer text-xs"
              >
                Clear
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {isUser ? "You" : "Newsroom Desk"}
                    </span>
                  </div>

                  <div
                    className={`max-w-[88%] rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? "bg-slate-900 text-white rounded-br-xs"
                        : "bg-white text-slate-800 border border-slate-200 shadow-2xs rounded-bl-xs"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {renderMessageContent(message.content)}
                    </div>
                  </div>

                  {/* Feedback on assistant message */}
                  {!isUser && !isStreaming && (
                    <div className="mt-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
                      <span>Helpful?</span>
                      <button
                        onClick={() => handleFeedback(message.id, "up")}
                        disabled={!!message.feedbackGiven}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          message.feedbackGiven === "up" ? "text-emerald-600 font-bold" : ""
                        }`}
                        title="Yes, accurate"
                      >
                        <ThumbsUp className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, "down")}
                        disabled={!!message.feedbackGiven}
                        className={`p-1 rounded hover:bg-slate-200 transition-colors ${
                          message.feedbackGiven === "down" ? "text-rose-600 font-bold" : ""
                        }`}
                        title="No, needs review"
                      >
                        <ThumbsDown className="h-3 w-3" />
                      </button>
                      {message.feedbackGiven && (
                        <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                          <Check className="h-3 w-3" /> Recorded
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500 py-1">
                <span className="h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
                <span>Searching editorial database &amp; compiling response...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Preset Prompts Strip */}
          {messages.length <= 2 && !isStreaming && (
            <div className="border-t border-slate-200 bg-white px-4 py-2.5">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Suggested Inquiries:
              </span>
              <div className="flex flex-col gap-1.5">
                {sampleQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="text-left text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 p-1.5 rounded-md border border-slate-100 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span className="truncate">{q}</span>
                    <Search className="h-3 w-3 text-slate-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-slate-200 bg-white p-3 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the newsroom about models, compute, or research..."
              disabled={isStreaming}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:bg-white transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer shrink-0"
              aria-label="Send inquiry"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}