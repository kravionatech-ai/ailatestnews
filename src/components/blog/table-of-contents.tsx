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
    <nav className="rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] p-5 text-sm">
      <div className="flex items-center gap-2 font-semibold text-[var(--foreground)] mb-3">
        <List className="h-4 w-4 text-[var(--accent)]" />
        <span>Table of Contents</span>
      </div>
      <ul className="space-y-2 text-xs">
        {headings.map((h) => (
          <li
            key={h.id}
            style={{ paddingLeft: h.level === 3 ? "1rem" : "0" }}
          >
            <a
              href={`#${h.id}`}
              className={`block py-0.5 transition-colors ${
                activeId === h.id
                  ? "font-semibold text-[var(--accent)]"
                  : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
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
