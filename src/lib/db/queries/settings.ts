import { connectDB } from "../connection";
import { Setting } from "../models";
import type { IGlobalSettings } from "../models/setting.model";

export async function getGlobalSettings(): Promise<Partial<IGlobalSettings>> {
  await connectDB();
  const settings = await Setting.findOne().lean();
  if (settings) {
    return JSON.parse(JSON.stringify(settings));
  }

  // Fallback defaults if no record exists yet
  return {
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
}
