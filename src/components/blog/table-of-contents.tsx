"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    // Find all H2 and H3 elements inside the article prose
    const elements = Array.from(
      document.querySelectorAll(".prose-article h2, .prose-article h3")
    );

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

    // IntersectionObserver to detect active heading
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
  }, []);

  if (headings.length === 0) return null;

  return (
    <nav className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 text-sm shadow-xs" aria-label="Table of contents">
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-heading)] mb-3 pb-2 border-b border-[var(--border)]">
        <List className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span>In This Investigation</span>
      </div>
      <ul className="space-y-1.5 text-xs">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: h.level === 3 ? "0.75rem" : "0" }}
          >
            <a
              href={`#${h.id}`}
              className={`block py-1 transition-colors leading-snug ${
                activeId === h.id
                  ? "font-bold text-[var(--accent)] border-l-2 border-[var(--accent)] pl-2 -ml-2"
                  : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
