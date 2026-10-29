"use client";

import { useState, useEffect } from "react";
import { Bookmark, Check, Clock, Type, Share2 } from "lucide-react";

interface ReadingControlsProps {
  postId: string;
  slug: string;
  title: string;
  readingTime?: number;
}

export function ReadingControlsBar({
  postId,
  slug,
  title,
  readingTime = 6,
}: ReadingControlsProps) {
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");
  const [isSaved, setIsSaved] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(readingTime);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedQueue = JSON.parse(localStorage.getItem("ai_reading_queue") || "[]");
      const exists = savedQueue.some((item: { slug: string }) => item.slug === slug);
      setIsSaved(exists);
    } catch {}

    // Scroll progress handler to calculate time left
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollHeight));
      const remaining = Math.max(1, Math.ceil(readingTime * (1 - progress)));
      setTimeLeft(remaining);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug, readingTime]);

  // Apply typography adjustments to article container
  useEffect(() => {
    const articleContainer = document.querySelector(".prose-article");
    if (!articleContainer) return;

    // Font size
    articleContainer.classList.remove("text-base", "text-lg", "text-xl", "text-[1.25rem]");
    if (fontSize === "sm") {
      articleContainer.classList.add("text-base");
    } else if (fontSize === "md") {
      articleContainer.classList.add("text-lg");
    } else {
      articleContainer.classList.add("text-[1.25rem]");
    }

    // Font family
    if (fontFamily === "sans") {
      articleContainer.classList.remove("font-serif");
      articleContainer.classList.add("font-sans");
    } else {
      articleContainer.classList.remove("font-sans");
      articleContainer.classList.add("font-serif");
    }
  }, [fontSize, fontFamily]);

  const toggleSave = () => {
    try {
      const savedQueue = JSON.parse(localStorage.getItem("ai_reading_queue") || "[]");
      if (isSaved) {
        const updated = savedQueue.filter((item: { slug: string }) => item.slug !== slug);
        localStorage.setItem("ai_reading_queue", JSON.stringify(updated));
        setIsSaved(false);
      } else {
        savedQueue.push({ postId, slug, title, readingTime, savedAt: new Date().toISOString() });
        localStorage.setItem("ai_reading_queue", JSON.stringify(savedQueue));
        setIsSaved(true);
      }
      window.dispatchEvent(new Event("readingQueueUpdated"));
    } catch {}
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  return (
    <aside
      className="mb-8 rounded-xl border border-slate-200 bg-slate-50/90 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-2xs"
      aria-label="Reading controls and typography settings"
    >
      {/* Time remaining indicator */}
      <div className="flex items-center gap-2 font-mono text-slate-700">
        <Clock className="h-3.5 w-3.5 text-indigo-600" />
        <span className="font-bold">{timeLeft} min remaining</span>
        <span className="text-slate-400 hidden sm:inline">|</span>
        <span className="text-slate-500 hidden sm:inline">Deep-Dive Dispatch</span>
      </div>

      {/* Typography and Reading Tools */}
      <div className="flex items-center gap-3">
        {/* Font Family Toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            onClick={() => setFontFamily("serif")}
            className={`px-2 py-1 rounded text-xs font-serif font-bold transition-colors cursor-pointer ${
              fontFamily === "serif" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
            title="Serif typography (Editorial)"
          >
            Serif
          </button>
          <button
            onClick={() => setFontFamily("sans")}
            className={`px-2 py-1 rounded text-xs font-sans font-bold transition-colors cursor-pointer ${
              fontFamily === "sans" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
            title="Sans-serif typography (Modern)"
          >
            Sans
          </button>
        </div>

        {/* Font Size Adjuster */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
          <button
            onClick={() => setFontSize("sm")}
            className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              fontSize === "sm" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
            title="Compact text size"
          >
            A-
          </button>
          <button
            onClick={() => setFontSize("md")}
            className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors cursor-pointer ${
              fontSize === "md" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
            title="Default text size"
          >
            A
          </button>
          <button
            onClick={() => setFontSize("lg")}
            className={`px-2 py-1 rounded text-sm font-mono font-bold transition-colors cursor-pointer ${
              fontSize === "lg" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"
            }`}
            title="Large text size"
          >
            A+
          </button>
        </div>

        {/* Bookmark / Save to Queue */}
        <button
          onClick={toggleSave}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-bold transition-all cursor-pointer shadow-2xs ${
            isSaved
              ? "border-emerald-500 bg-emerald-50 text-emerald-800"
              : "border-slate-200 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
          }`}
          title={isSaved ? "Saved to Reading Queue" : "Save for later"}
        >
          {isSaved ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span>Saved</span>
            </>
          ) : (
            <>
              <Bookmark className="h-3.5 w-3.5" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* Quick Share */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-bold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
          title="Share dispatch"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>
    </aside>
  );
}
