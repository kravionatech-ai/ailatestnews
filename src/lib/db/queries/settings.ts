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
    siteName: "Kraviona AI News",
    tagline: "AI, Technology, Research and Innovation Intelligence",
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com",
    separator: "|",
    navigation: [
      { label: "Home", href: "/", order: 1 },
      { label: "AI News", href: "/category/ai-news", order: 2 },
      { label: "AI Models", href: "/category/model-launches", order: 3 },
      { label: "AI Research", href: "/category/ai-research", order: 4 },
      { label: "AI Tools", href: "/category/ai-tools", order: 5 },
      { label: "Startups", href: "/category/startups", order: 6 },
      { label: "Cybersecurity", href: "/category/cybersecurity", order: 7 },
      { label: "Technology", href: "/category/technology", order: 8 },
      { label: "ZeroAI", href: "/zeroai", order: 9 },
    ],
    footer: {
      aboutText:
        "Kraviona AI News delivers independent, deeply researched intelligence on artificial intelligence, foundation models, scientific papers, developer tools, startups, cybersecurity, and compute infrastructure.",
      copyrightText: "Kraviona AI News (ainews.kraviona.com). All rights reserved.",
      sections: [
        {
          title: "Categories",
          links: [
            { label: "AI News", href: "/category/ai-news" },
            { label: "AI Models", href: "/category/model-launches" },
            { label: "AI Research", href: "/category/ai-research" },
            { label: "AI Tools", href: "/category/ai-tools" },
            { label: "Startups & Funding", href: "/category/startups-and-funding" },
            { label: "Cybersecurity", href: "/category/cybersecurity" },
            { label: "Technology", href: "/category/technology" },
          ],
        },
        {
          title: "Intelligence Desks",
          links: [
            { label: "Artificial Intelligence", href: "/category/artificial-intelligence" },
            { label: "AI Agents", href: "/category/ai-agents" },
            { label: "Machine Learning", href: "/category/machine-learning" },
            { label: "Cloud & Computing", href: "/category/cloud-and-computing" },
            { label: "ZeroAI Detector", href: "/zeroai" },
            { label: "Article Archive", href: "/archive" },
            { label: "HTML Sitemap", href: "/sitemap" },
            { label: "Search Portal", href: "/search" },
          ],
        },
        {
          title: "Publication",
          links: [
            { label: "About Kraviona", href: "/about" },
            { label: "Editorial Standards", href: "/editorial-policy" },
            { label: "Contact", href: "/contact" },
            { label: "Newsletter", href: "/newsletter" },
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
