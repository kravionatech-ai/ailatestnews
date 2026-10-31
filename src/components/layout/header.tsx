"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Bot, Newspaper, ArrowRight, Bookmark } from "lucide-react";
import { CommandPalette } from "../search/command-palette";

export interface NavItem {
  label: string;
  href: string;
  order?: number;
  isExternal?: boolean;
}

export function Header({
  onOpenChat,
  navLinks: propNavLinks,
}: {
  onOpenChat?: () => void;
  navLinks?: NavItem[];
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("ai_reading_queue") || "[]");
        setSavedCount(queue.length);
      } catch {}
    };
    updateCount();
    window.addEventListener("readingQueueUpdated", updateCount);
    return () => window.removeEventListener("readingQueueUpdated", updateCount);
  }, []);

  const defaultNavLinks: NavItem[] = [
    { label: "Front Page", href: "/", order: 1 },
    { label: "AI News", href: "/category/ai-news", order: 2 },
    { label: "Model Launches", href: "/category/model-launches", order: 3 },
    { label: "AI Tools", href: "/category/ai-tools", order: 4 },
    { label: "India AI", href: "/category/india-ai", order: 5 },
    { label: "Guides & Comparisons", href: "/category/guides-and-comparisons", order: 6 },
    { label: "Enterprise AI", href: "/category/enterprise-ai", order: 7 },
  ];

  const rawLinks = propNavLinks && propNavLinks.length > 0 ? propNavLinks : defaultNavLinks;
  const navLinks = [...rawLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Current formatted date for editorial masthead (e.g. Wednesday, October 28, 2026)
  const todayFormatted = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* ── Top Newsroom Utility Strip ── */}
      <div className="border-b border-slate-200/80 bg-slate-900 text-slate-300 text-[11px] font-medium py-1.5 hidden md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 font-mono tracking-tight">{todayFormatted}</span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>India &amp; Global AI Edition</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span className="hover:text-white transition-colors">
              Independent AI Journalism &amp; Compute Analysis
            </span>
            <span className="text-slate-600">|</span>
            <Link href="#newsletter" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
              Get Daily Dispatch →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Main Newsroom Masthead Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md transition-all shadow-3xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Authentic Editorial Masthead Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase font-sans">
                  AI Latest <span className="text-indigo-600">News</span>
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-600 inline-block mb-1" />
              </div>
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-slate-500 font-mono -mt-1">
                The AI Journal for India
              </span>
            </div>
          </Link>

          {/* Action Tools: Search, Reading Queue, Ask AI Desk, Daily Newsletter */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Search Bar */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-600 transition-all cursor-pointer shadow-3xs"
              aria-label="Search articles and benchmarks"
            >
              <Search className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline font-sans">Search stories, models...</span>
              <kbd className="hidden md:inline-block rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] text-slate-500 font-mono font-semibold">
                ⌘K
              </kbd>
            </button>

            {/* Saved Reading Queue Pill */}
            {savedCount > 0 && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("openReadingQueue"))}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 py-1.5 text-xs font-semibold text-indigo-800 transition-all cursor-pointer shadow-3xs"
                title="Saved Reading Queue"
                aria-label="Saved Reading Queue"
              >
                <Bookmark className="h-3.5 w-3.5 text-indigo-600 fill-indigo-200" />
                <span className="font-mono text-[11px] font-bold">{savedCount}</span>
                <span className="hidden md:inline text-[11px]">saved</span>
              </button>
            )}

            {/* Editorial Research Assistant Pill (Clean, No 3D Toy) */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-800 transition-all cursor-pointer shadow-3xs"
                title="Ask AI Newsroom Assistant"
              >
                <Bot className="h-3.5 w-3.5 text-indigo-600" />
                <span>Ask AI Desk</span>
              </button>
            )}

            {/* Newsletter Dispatch CTA */}
            <Link
              href="#newsletter"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-lg bg-slate-900 hover:bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition-all shadow-3xs"
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Subscribe</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* ── Editorial Section Navigation Bar ── */}
        <div className="hidden lg:block border-t border-slate-100 bg-slate-50/70">
          <div className="mx-auto flex max-w-7xl items-center justify-start gap-1 px-4 sm:px-6 lg:px-8 py-1.5">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-3xs"
                      : "text-slate-700 hover:bg-white hover:text-indigo-600"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-2 shadow-md animate-in fade-in-50 duration-200">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 px-3">
              Editorial Sections
            </div>
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-slate-200 flex gap-2">
              {onOpenChat && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenChat();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-bold text-indigo-700"
                >
                  <Bot className="h-3.5 w-3.5 text-indigo-600" /> Ask AI Desk
                </button>
              )}
              <Link
                href="#newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center rounded-lg bg-slate-900 text-white py-2.5 text-xs font-bold"
              >
                Subscribe
              </Link>
            </div>
          </div>
        )}
      </header>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
