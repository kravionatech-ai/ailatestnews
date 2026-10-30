import { cache } from "react";
import { connectDB } from "../connection";
import { Setting } from "../models";
import type { IGlobalSettings } from "../models/setting.model";

// In-memory cache with 60-second TTL to avoid redundant MongoDB Atlas network roundtrips
let cachedSettings: Partial<IGlobalSettings> | null = null;
let cacheExpiresAt = 0;

export function invalidateSettingsCache() {
  cachedSettings = null;
  cacheExpiresAt = 0;
}

export const getGlobalSettings = cache(async function getGlobalSettings(): Promise<Partial<IGlobalSettings>> {
  const now = Date.now();
  if (cachedSettings && now < cacheExpiresAt) {
    return cachedSettings;
  }

  // Fallback defaults if no record exists yet or connection unavailable
  const fallback: Partial<IGlobalSettings> = {
    siteName: "AI Latest News",
    tagline: "AI news, tools and guides, explained for India",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com",
    separator: "|",
    navigation: [
      { label: "Home", href: "/", order: 1 },
      { label: "AI News", href: "/category/ai-news", order: 2 },
      { label: "Model Launches", href: "/category/model-launches", order: 3 },
      { label: "AI Tools", href: "/category/ai-tools", order: 4 },
      { label: "India AI", href: "/category/india-ai", order: 5 },
      { label: "Guides", href: "/category/guides-and-comparisons", order: 6 },
    ],
    footer: {
      aboutText:
        "India's authoritative AI publication tracking foundational model releases, LLM benchmarks, Indian AI breakthroughs (Sarvam, Krutrim, BharatGPT), and hands-on tooling comparisons in clear, in-depth English.",
      copyrightText: "AI Latest News (ainews.kraviona.com). All rights reserved.",
      sections: [
        {
          title: "Categories",
          links: [
            { label: "AI News", href: "/category/ai-news" },
            { label: "Model Launches", href: "/category/model-launches" },
            { label: "AI Tools", href: "/category/ai-tools" },
            { label: "India AI", href: "/category/india-ai" },
            { label: "Guides & Comparisons", href: "/category/guides-and-comparisons" },
            { label: "Enterprise AI", href: "/category/enterprise-ai" },
          ],
        },
        {
          title: "Directories",
          links: [
            { label: "AI Tools Directory", href: "/ai-tools" },
            { label: "Model Launches Timeline", href: "/model-launches" },
            { label: "India AI Hub", href: "/india-ai" },
            { label: "Article Archive", href: "/archive" },
            { label: "Search Portal", href: "/search" },
          ],
        },
        {
          title: "Editorial & Legal",
          links: [
            { label: "About Us", href: "/about" },
            { label: "Editorial Policy", href: "/editorial-policy" },
            { label: "Contact Editorial Desk", href: "/contact" },
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms of Service", href: "/terms" },
          ],
        },
      ],
    },
  };

  try {
    await connectDB();
    const settings = await Setting.findOne().lean();
    if (settings) {
      const parsed = JSON.parse(JSON.stringify(settings));
      cachedSettings = parsed;
      cacheExpiresAt = now + 60_000; // 60 seconds
      return parsed;
    }
  } catch (err) {
    console.warn("[getGlobalSettings] MongoDB connection failed, using fallback settings:", err);
  }

  cachedSettings = fallback;
  cacheExpiresAt = now + 60_000;
  return fallback;
});
