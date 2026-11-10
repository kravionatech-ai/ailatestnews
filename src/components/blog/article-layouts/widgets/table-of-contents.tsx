"use client";

import { useEffect, useState } from "react";
import { List, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Server-safe helper to extract TOC headings from HTML strings without DOM dependency.
 */
export function extractHeadingsFromHtml(html?: string): TocItem[] {
  if (!html) return [];
  const matches = [...html.matchAll(/<h([23])[^>]*>(.*?)<\/h[23]>/gi)];
  return matches.map((m, idx) => {
    const level = Number(m[1]);
    const rawTag = m[0];
    const text = m[2] ? m[2].replace(/<[^>]+>/g, "").trim() : "";
    const idMatch = rawTag.match(/id=["']([^"']+)["']/i);
    const id = idMatch?.[1] || `heading-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return { id, text, level };
  });
}

export function useHeadingsExtractor(initialHeadings?: TocItem[]) {
  const [headings, setHeadings] = useState<TocItem[]>(initialHeadings || []);
  const [activeId, setActiveId] = useState<string>("");

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

  return { headings, activeId };
}

/**
 * Desktop Sidebar Table of Contents
 */
export function TableOfContentsWidget({
  className = "",
  initialHeadings,
}: {
  className?: string;
  initialHeadings?: TocItem[];
}) {
  const { headings, activeId } = useHeadingsExtractor(initialHeadings);
  if (headings.length === 0) return null;

  return (
    <nav
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-card-background)] p-5 text-sm shadow-2xs",
        className
      )}
      aria-label="Table of contents"
    >
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading)] mb-3 pb-2 border-b border-[var(--color-border)]">
        <List className="h-3.5 w-3.5 text-[var(--color-primary-accent)]" />
        <span>In This Investigation</span>
      </div>
      <ul className="space-y-1.5 text-xs">
        {headings.map((h) => (
          <li key={h.id} style={{ paddingLeft: h.level === 3 ? "0.75rem" : "0" }}>
            <a
              href={`#${h.id}`}
              className={cn(
                "block py-1 transition-colors leading-snug",
                activeId === h.id
                  ? "font-bold text-[var(--color-primary-accent)] border-l-2 border-[var(--color-primary-accent)] pl-2 -ml-2"
                  : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * Collapsible Accordion for Mobile, Tablet, or In-Body Layouts
 */
export function TableOfContentsAccordion({
  className = "",
  initialHeadings,
}: {
  className?: string;
  initialHeadings?: TocItem[];
}) {
  const { headings, activeId } = useHeadingsExtractor(initialHeadings);
  const [isOpen, setIsOpen] = useState(false);

  if (headings.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-card-background)] p-4 shadow-2xs",
        className
      )}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-heading)] cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <List className="h-3.5 w-3.5 text-[var(--color-primary-accent)]" />
          <span>Table of Contents ({headings.length} sections)</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
      </button>

      {isOpen && (
        <ul className="mt-3 pt-3 border-t border-[var(--color-border)] space-y-2 text-xs">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: h.level === 3 ? "0.75rem" : "0" }}>
              <a
                href={`#${h.id}`}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block py-0.5 transition-colors",
                  activeId === h.id
                    ? "font-bold text-[var(--color-primary-accent)]"
                    : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                )}
              >
                {h.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { TableOfContentsWidget as TableOfContents };
export default TableOfContentsWidget;
