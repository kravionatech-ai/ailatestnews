"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Bookmark,
  Newspaper,
  Flame,
  ArrowUpRight,
} from "lucide-react";
import { CommandPalette } from "../search/command-palette";
import { useTheme } from "../providers/theme-provider";

export interface NavItem {
  label: string;
  href: string;
  order?: number;
  isExternal?: boolean;
}

export interface TickerHeadline {
  _id?: string;
  title: string;
  slug: string;
  category?: { name: string; slug: string };
}

const KRAVIONA_NAV_LINKS: NavItem[] = [
  { label: "Home", href: "/", order: 1 },
  { label: "AI News", href: "/category/ai-news", order: 2 },
  { label: "AI Models", href: "/category/model-launches", order: 3 },
  { label: "AI Research", href: "/category/ai-research", order: 4 },
  { label: "AI Tools", href: "/category/ai-tools", order: 5 },
  { label: "Startups", href: "/category/startups", order: 6 },
  { label: "Cybersecurity", href: "/category/cybersecurity", order: 7 },
  { label: "Technology", href: "/category/technology", order: 8 },
];

const DEFAULT_TRENDING_TOPICS = [
  { label: "DeepSeek-R1", href: "/search?q=DeepSeek" },
  { label: "AI Agents", href: "/category/ai-agents" },
  { label: "IndiaAI", href: "/category/india-ai" },
  { label: "Claude 3.5", href: "/search?q=Claude" },
];

const FALLBACK_HEADLINES: TickerHeadline[] = [
  {
    title: "DeepSeek-R1 Disrupts Global AI Inference Economics Across Startups",
    slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
  },
  {
    title: "10,000 GPUs Tender Allocations Announced Under Sovereign AI Compute",
    slug: "india-10000-gpus-national-ai-mission-tender",
  },
  {
    title: "Anthropic Expands Claude 3.5 Sonnet Computer Use & Agentic Workflows",
    slug: "anthropic-claude-3-5-sonnet-computer-use-evaluated",
  },
  {
    title: "Sarvam-1 2B Model Sets New Benchmarks for Multilingual AI Inference",
    slug: "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
  },
];

export function Header({
  navLinks: propNavLinks,
  headlines,
}: {
  onOpenChat?: () => void;
  navLinks?: NavItem[];
  headlines?: TickerHeadline[];
}) {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const queue = JSON.parse(localStorage.getItem("ai_reading_queue") || "[]");
        setSavedCount(queue.length);
      } catch {
        setSavedCount(0);
      }
    };
    updateCount();
    window.addEventListener("readingQueueUpdated", updateCount);
    return () => window.removeEventListener("readingQueueUpdated", updateCount);
  }, []);

  // Ensure nav links reflect Kraviona's primary editorial architecture
  const rawLinks =
    propNavLinks && propNavLinks.length >= 7 ? propNavLinks : KRAVIONA_NAV_LINKS;
  const navLinks = [...rawLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const tickerItems =
    headlines && headlines.length > 0 ? headlines : FALLBACK_HEADLINES;

  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      {/* ── A. Top News Bar (Ticker, Date, Trending Topics, Newsletter) ── */}
      <div className="border-b border-white/10 bg-[#101820] text-[#E4E2DC] text-[11px] font-medium">
        <div className="mx-auto flex max-w-[var(--max-content-width,1320px)] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 h-9">
          {/* Left: Current Date + Live Ticker */}
          <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
            <span
              suppressHydrationWarning
              className="hidden sm:inline-flex items-center font-mono text-[10px] tracking-tight text-[#8B949E] shrink-0"
            >
              {todayFormatted}
            </span>
            <span className="hidden sm:inline text-white/15 shrink-0">|</span>

            <span className="inline-flex items-center gap-1.5 rounded bg-[#D94F35] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              Latest
            </span>

            {/* Infinite Marquee Ticker */}
            <div className="relative flex-1 overflow-hidden whitespace-nowrap mask-linear-fade">
              <div className="animate-ticker gap-8">
                {[...tickerItems, ...tickerItems].map((item, idx) => (
                  <Link
                    key={`${item.slug}-${idx}`}
                    href={`/blog/${item.slug}`}
                    className="inline-flex items-center gap-2 text-[11px] text-[#E4E2DC] hover:text-[#E05A42] transition-colors shrink-0"
                  >
                    <span className="truncate max-w-[260px] sm:max-w-[380px]">
                      {item.title}
                    </span>
                    <span className="text-white/25">•</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Trending Topics & Newsletter Link */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3 w-3 text-[#D94F35]" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#8B949E]">
                Trending:
              </span>
              {DEFAULT_TRENDING_TOPICS.slice(0, 3).map((topic) => (
                <Link
                  key={topic.label}
                  href={topic.href}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#E4E2DC]/90 hover:bg-white/10 hover:text-white transition-colors"
                >
                  #{topic.label}
                </Link>
              ))}
            </div>
            <span className="text-white/15">|</span>
            <Link
              href="/newsletter"
              className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-wider text-[#E05A42] hover:text-white transition-colors"
            >
              <span>Newsletter</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── B. Main Editorial Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[var(--color-card-background)]/95 backdrop-blur-md transition-colors duration-200">
        <div className="mx-auto flex h-[68px] max-w-[var(--max-content-width,1320px)] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Kraviona AI News Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#101820] dark:bg-[#E05A42] text-white font-display font-black text-base tracking-tighter shadow-xs group-hover:bg-[#D94F35] transition-colors">
              K<span className="text-[#D94F35] dark:text-[#101820] group-hover:text-white">.</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg sm:text-xl font-black tracking-tight text-[var(--color-heading)]">
                  KRAVIONA{" "}
                  <span className="text-[var(--accent)]">AI NEWS</span>
                </span>
              </div>
              <span className="hidden sm:block text-[9px] font-mono font-medium uppercase tracking-[0.14em] text-[var(--color-muted-text)] -mt-0.5">
                AI, Technology, Research &amp; Innovation Intelligence
              </span>
            </div>
          </Link>

          {/* Primary Navigation Links (Desktop) */}
          <nav
            className="hidden xl:flex items-center gap-0.5"
            aria-label="Primary Editorial Navigation"
          >
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 rounded-md text-[13px] font-semibold tracking-tight transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#101820] text-white dark:bg-[#E05A42] dark:text-white"
                      : "text-[var(--color-heading)]/85 hover:text-[var(--accent)] hover:bg-[var(--color-secondary-surface)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Header Utility Tools: Search, Saved Queue, Dark/Light Toggle, Subscribe */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Search Overlay Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] px-2.5 sm:px-3 py-1.5 text-xs font-medium text-[var(--color-muted-text)] hover:text-[var(--color-heading)] transition-all cursor-pointer"
              aria-label="Search articles, models and research"
            >
              <Search className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="hidden md:inline font-sans">Search</span>
              <kbd className="hidden md:inline-block rounded border border-[var(--border)] bg-[var(--color-card-background)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-muted-text)]">
                ⌘K
              </kbd>
            </button>

            {/* Saved Reading Queue Pill */}
            {savedCount > 0 && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("openReadingQueue"))}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-secondary-surface)] hover:border-[var(--accent)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-heading)] transition-all cursor-pointer"
                title="Saved Reading Queue"
                aria-label="Saved Reading Queue"
              >
                <Bookmark className="h-3.5 w-3.5 text-[var(--accent)] fill-current" />
                <span className="font-mono text-[11px] font-bold">{savedCount}</span>
              </button>
            )}

            {/* Dark / Light Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all cursor-pointer"
              aria-label={mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={mounted && theme === "dark" ? "Switch to editorial light mode" : "Switch to dark mode"}
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Newsletter Dispatch CTA */}
            <Link
              href="#newsletter"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[#101820] hover:bg-[#D94F35] dark:bg-[#E05A42] dark:hover:bg-[#D94F35] px-3.5 py-2 text-xs font-bold text-white transition-all"
            >
              <Newspaper className="h-3.5 w-3.5" />
              <span>Subscribe</span>
            </Link>

            {/* Mobile/Tablet Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--color-heading)] hover:bg-[var(--color-secondary-surface)] cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Tablet Condensed Navigation Row (lg to xl) */}
        <div className="hidden lg:flex xl:hidden border-t border-[var(--border)] bg-[var(--color-main-background)]/70">
          <div className="mx-auto flex max-w-[var(--max-content-width,1320px)] items-center gap-1 px-4 sm:px-6 py-1.5 overflow-x-auto no-scrollbar">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#101820] text-white dark:bg-[#E05A42]"
                      : "text-[var(--color-heading)] hover:text-[var(--accent)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-b border-[var(--border)] bg-[var(--color-card-background)] px-4 py-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between px-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted-text)]">
                Intelligence Desks
              </span>
              <span
                suppressHydrationWarning
                className="font-mono text-[10px] text-[var(--color-muted-text)]"
              >
                {todayFormatted}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {navLinks.map((link) => {
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-[#101820] text-white dark:bg-[#E05A42]"
                        : "bg-[var(--color-main-background)] text-[var(--color-heading)] hover:text-[var(--accent)]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSearchOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] py-2.5 text-xs font-bold text-[var(--color-heading)]"
              >
                <Search className="h-3.5 w-3.5 text-[var(--accent)]" />
                Search Archive
              </button>
              <Link
                href="/newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center rounded-lg bg-[#D94F35] text-white py-2.5 text-xs font-bold hover:bg-[#BF3E26] transition-colors"
              >
                Subscribe Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
