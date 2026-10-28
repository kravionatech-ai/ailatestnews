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
    <nav className="rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-2xs" aria-label="Table of contents">
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3 pb-2 border-b border-slate-100">
        <List className="h-3.5 w-3.5 text-rose-600" />
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
                  ? "font-bold text-indigo-600 border-l-2 border-indigo-600 pl-2 -ml-2"
                  : "text-slate-600 hover:text-slate-900"
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
