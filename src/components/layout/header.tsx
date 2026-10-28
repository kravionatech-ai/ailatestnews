"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, X, Sparkles, Bot, Cpu } from "lucide-react";
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

  const defaultNavLinks: NavItem[] = [
    { label: "Home", href: "/", order: 1 },
    { label: "AI News", href: "/category/ai-news", order: 2 },
    { label: "Model Launches", href: "/category/model-launches", order: 3 },
    { label: "AI Tools", href: "/category/ai-tools", order: 4 },
    { label: "India AI", href: "/category/india-ai", order: 5 },
    { label: "Guides", href: "/category/guides-and-comparisons", order: 6 },
  ];

  const rawLinks = propNavLinks && propNavLinks.length > 0 ? propNavLinks : defaultNavLinks;
  const navLinks = [...rawLinks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-white/90 backdrop-blur-md transition-all">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-xl tracking-tight text-[var(--foreground)] group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-xs group-hover:scale-105 transition-transform">
              <Cpu className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">
                AI Latest <span className="text-[var(--accent)]">News</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--foreground-muted)] flex items-center gap-1">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                India &amp; Global AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && Boolean(pathname?.startsWith(link.href)));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)] font-bold"
                      : "text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Buttons: Search, Ask AI, Newsletter (No Admin Button) */}
          <div className="flex items-center gap-2">
            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--foreground-muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)] transition-all cursor-pointer"
              aria-label="Search AI News"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search AI...</span>
              <kbd className="hidden sm:inline-block rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-[9px] text-[var(--foreground-muted)] font-mono">
                ⌘K
              </kbd>
            </button>

            {/* Ask AI button */}
            {onOpenChat && (
              <button
                onClick={onOpenChat}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs cursor-pointer"
                title="Chat with AI News Assistant"
              >
                <Bot className="h-3.5 w-3.5 text-indigo-600" />
                <span>Ask AI</span>
              </button>
            )}

            {/* Newsletter CTA Button */}
            <Link
              href="#newsletter"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[var(--accent-hover)] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Newsletter</span>
            </Link>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-[var(--border)] bg-white px-4 py-4 space-y-2 shadow-sm animate-in fade-in-50 duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[var(--border)] flex gap-2">
              {onOpenChat && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenChat();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-semibold text-indigo-700"
                >
                  <Bot className="h-3.5 w-3.5" /> Ask AI
                </button>
              )}
              <Link
                href="#newsletter"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center rounded-lg bg-[var(--accent)] text-white py-2.5 text-xs font-semibold shadow-2xs"
              >
                Newsletter
              </Link>
            </div>
          </div>
        )}
      </header>

      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
