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
    const id =
      idMatch?.[1] ||
      `heading-${idx}-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    return { id, text, level };
  });
}
