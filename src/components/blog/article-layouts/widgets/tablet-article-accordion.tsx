"use client";

import { useEffect, useState } from "react";
import { List, ChevronDown, BookOpen } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

import type { TocItem } from "./table-of-contents";

export function TabletArticleAccordion({
  className = "",
  initialHeadings,
}: {
  className?: string;
  initialHeadings?: TocItem[];
}) {
  const [headings, setHeadings] = useState<TocItem[]>(initialHeadings || []);
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll(".prose-article h2, .prose-article h3")
    );

    if (elements.length > 0) {
      const items: TocItem[] = elements.map((elem, idx) => {
        if (!elem.id) {
          elem.id = `heading-${idx}-${elem.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        }
        return {
          id: elem.id,
          text: elem.textContent || "",
          level: elem.tagName === "H2" ? 2 : 3,
        };
      });

      setHeadings(items);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
            }
          });
        },
        { rootMargin: "0% 0% -70% 0%" }
      );

      elements.forEach((elem) => observer.observe(elem));
      return () => observer.disconnect();
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <div
      className={cn(
        "block lg:hidden my-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-card-background)] shadow-2xs overflow-hidden",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="tablet-toc-content"
        className="flex w-full items-center justify-between min-h-[48px] px-4 py-3 bg-[var(--color-secondary-surface)] hover:bg-[var(--color-secondary-surface)]/80 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-2.5">
          <List className="h-4 w-4 text-[var(--color-primary-accent)] shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-heading)]">
            Table of Contents
          </span>
          <span className="rounded-full bg-[var(--color-primary-dark)] text-white px-2 py-0.5 font-mono text-[10px] font-bold">
            {headings.length} sections
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--color-muted-text)] transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen && (
        <div id="tablet-toc-content" className="p-4 border-t border-[var(--color-border)]">
          <ul className="space-y-2 text-xs">
            {headings.map((h) => (
              <li
                key={h.id}
                style={{ paddingLeft: h.level === 3 ? "1rem" : "0" }}
              >
                <a
                  href={`#${h.id}`}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "block py-1.5 transition-colors leading-snug",
                    activeId === h.id
                      ? "font-bold text-[var(--color-primary-accent)] border-l-2 border-[var(--color-primary-accent)] pl-2.5 -ml-2"
                      : "text-[var(--color-body-text)] hover:text-[var(--color-heading)]"
                  )}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>

          {/* Quick Editorial Policy Link */}
          <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-muted-text)]">
            <span className="flex items-center gap-1.5 font-mono">
              <BookOpen className="h-3 w-3 text-[var(--color-muted-text)]" />
              Fact-Checked Newsroom Dispatch
            </span>
            <Link
              href="/editorial-policy"
              className="font-mono text-[10px] font-bold uppercase text-[var(--color-heading)] underline"
            >
              Policy →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
