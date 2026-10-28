"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Send,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ExternalLink,
  RotateCcw,
  BookOpen,
} from "lucide-react";
import { RobotHeadCanvas } from "./robot-head-canvas";
import type { RobotExpression } from "./robot-head-3d";

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

  // 3D Robot Expression state
  const [robotExpression, setRobotExpression] = useState<RobotExpression>("idle");

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content:
        "Hello! I am your **AI Latest News 3D Assistant**. Ask me anything about the latest model releases, DeepSeek-R1, AI developer tools, or India's AI mission (Sarvam, Krutrim, BharatGPT)!",
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
      setRobotExpression("happy");
      setTimeout(() => setRobotExpression("idle"), 3000);
      setMessages((prev) => [
        ...prev,
        {
          id: `context-${Date.now()}`,
          role: "assistant",
          content: `I've loaded the context for **"${e.detail.title}"**. What would you like to know about this article?`,
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
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
    setRobotExpression("thinking");

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

      // Switch expression to speaking as words start flowing
      setRobotExpression("speaking");

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

      // Completed successfully: flash a happy smile then return to idle
      setRobotExpression("happy");
      setTimeout(() => setRobotExpression("idle"), 3500);
    } catch (err: unknown) {
      setRobotExpression("idle");
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content:
                  err instanceof Error
                    ? err.message
                    : "I couldn't reach the server right now. Please try again shortly.",
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
    if (rating === "up") {
      setRobotExpression("happy");
      setTimeout(() => setRobotExpression("idle"), 3500);
    }
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

  return (
    <>
      {/* Floating 3D Robot Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setRobotExpression("happy");
            setTimeout(() => setRobotExpression("idle"), 2500);
            setTimeout(() => inputRef.current?.focus(), 150);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-sky-600 pl-2 pr-4 py-1.5 text-xs font-bold text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group border border-white/20"
          aria-label="Open 3D AI Assistant"
        >
          <div className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
            <RobotHeadCanvas expression="idle" className="w-12 h-12 -mt-1" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[11px] leading-tight font-extrabold">Ask AI 3D</span>
            <span className="text-[9px] text-indigo-200 font-normal">Cursor tracking</span>
          </div>
        </button>
      )}

      {/* Chat Popover Window (Desktop) & Drawer (Mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 flex flex-col sm:w-[430px] sm:h-[620px] bg-white sm:rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in fade-in sm:zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="AI News 3D Assistant"
        >
          {/* Header with Live Interactive 3D Robot Head */}
          <div className="flex items-center justify-between border-b border-[var(--border)] bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/60 p-3 sm:p-4">
            <div className="flex items-center gap-3">
              {/* 3D Robot Avatar Box */}
              <div
                onClick={() => {
                  setRobotExpression("happy");
                  setTimeout(() => setRobotExpression("idle"), 2500);
                }}
                className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-100/70 via-white to-sky-100/50 border border-indigo-200/80 shadow-xs overflow-hidden cursor-pointer group"
                title="Interactive 3D Robot Head (Click to smile!)"
              >
                <RobotHeadCanvas
                  expression={robotExpression}
                  isStreaming={isStreaming}
                  className="w-full h-full"
                />
                <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 shadow-2xs" />
              </div>

              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-[var(--foreground)] leading-tight flex items-center gap-1.5">
                  AI News 3D Assistant
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-all ${
                      robotExpression === "thinking"
                        ? "bg-amber-100 text-amber-800 animate-pulse"
                        : robotExpression === "speaking"
                        ? "bg-indigo-100 text-indigo-800"
                        : robotExpression === "happy"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {robotExpression === "thinking"
                      ? "Thinking"
                      : robotExpression === "speaking"
                      ? "Speaking"
                      : robotExpression === "happy"
                      ? "Smiling"
                      : "Watching"}
                  </span>
                </h3>
                <p className="text-[10px] text-[var(--foreground-muted)] flex items-center gap-1 mt-0.5">
                  <span>Smooth cursor tracking</span> • <span>Blinking LED eyes</span>
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
                      content: "Chat cleared! How can I help you today?",
                    },
                  ]);
                  setArticleContext(null);
                  setRobotExpression("happy");
                  setTimeout(() => setRobotExpression("idle"), 2500);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Clear Chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Close Assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active Context Bar */}
          {articleContext && (
            <div className="flex items-center justify-between bg-indigo-50/80 px-4 py-1.5 text-[11px] text-indigo-700 border-b border-indigo-100">
              <span className="truncate flex items-center gap-1.5 font-medium">
                <BookOpen className="h-3 w-3 flex-shrink-0" />
                Context: {articleContext.title}
              </span>
              <button
                onClick={() => setArticleContext(null)}
                className="text-[10px] text-indigo-500 hover:text-indigo-800 ml-2 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Messages Container */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 leading-relaxed shadow-2xs ${
                    msg.role === "user"
                      ? "bg-[var(--accent)] text-white rounded-br-xs"
                      : "border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] rounded-bl-xs whitespace-pre-line"
                  }`}
                >
                  {renderMessageContent(msg.content)}
                </div>

                {/* Feedback for assistant messages */}
                {msg.role === "assistant" && msg.content && (
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--foreground-muted)] pl-1">
                    <span>Helpful?</span>
                    <button
                      onClick={() => handleFeedback(msg.id, "up")}
                      className={`hover:text-emerald-600 transition-colors ${
                        msg.feedbackGiven === "up" ? "text-emerald-600 font-bold" : ""
                      }`}
                      title="Good answer"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, "down")}
                      className={`hover:text-rose-600 transition-colors ${
                        msg.feedbackGiven === "down" ? "text-rose-600 font-bold" : ""
                      }`}
                      title="Needs improvement"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isStreaming && (
              <div className="flex items-center gap-2 text-xs text-indigo-600 font-medium py-1">
                <Sparkles className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                <span>Robot is analyzing &amp; synthesizing sources...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="border-t border-[var(--border)] bg-white px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              "DeepSeek-R1 Architecture",
              "Sarvam-1 Indic Model",
              "India AI Mission 10,000 GPUs",
              "Cursor vs Claude Code",
            ].map((qp, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInput(qp);
                  setTimeout(() => handleSendMessage(), 50);
                }}
                className="whitespace-nowrap rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-2.5 py-1 text-[10px] font-semibold text-[var(--foreground-secondary)] hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors cursor-pointer"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-[var(--border)] bg-white p-3 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about AI models, tools, or India..."
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3.5 py-2 text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:bg-white transition-all"
              disabled={isStreaming}
              maxLength={1000}
            />
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent)] text-white shadow-2xs hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              title="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
