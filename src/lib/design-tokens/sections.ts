import { z } from "zod";

/**
 * 15 Dynamic Homepage Section Types and Inventory
 * Conforms strictly to PROJECT.md § Interface Contracts
 */

export type SectionType =
  | "breaking-news"
  | "hero"
  | "model-launches"
  | "india-ai"
  | "ai-tools"
  | "guides"
  | "enterprise-ai"
  | "trending-latest"
  | "benchmark-leaderboard"
  | "model-calculator"
  | "newsletter"
  | "site-intro"
  | "faq"
  | "community-poll"
  | "model-releases";

export interface HomepageSectionConfig {
  id: string;                  // unique instance id
  type: SectionType;
  enabled: boolean;
  order: number;
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: string;
  limit?: number;
  categoryFilter?: string;
  customSettings?: Record<string, unknown>;
}

export const SECTION_TYPES: SectionType[] = [
  "breaking-news",
  "hero",
  "model-launches",
  "india-ai",
  "ai-tools",
  "guides",
  "enterprise-ai",
  "trending-latest",
  "benchmark-leaderboard",
  "model-calculator",
  "newsletter",
  "site-intro",
  "faq",
  "community-poll",
  "model-releases",
];

export const HomepageSectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "breaking-news",
    "hero",
    "model-launches",
    "india-ai",
    "ai-tools",
    "guides",
    "enterprise-ai",
    "trending-latest",
    "benchmark-leaderboard",
    "model-calculator",
    "newsletter",
    "site-intro",
    "faq",
    "community-poll",
    "model-releases",
  ]),
  enabled: z.boolean(),
  order: z.number().int().nonnegative(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  kicker: z.string().optional(),
  cardVariant: z.string().optional(),
  limit: z.number().int().positive().optional(),
  categoryFilter: z.string().optional(),
  customSettings: z.record(z.unknown()).optional(),
});

export const HomepageSectionsSchema = z.array(HomepageSectionSchema);

// 15 Default Homepage Sections (Authoritative inventory from PROJECT.md R3/Feature Inventory)
export const DEFAULT_HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  { id: "sec-breaking", type: "breaking-news", enabled: true, order: 1, title: "Breaking AI Wire" },
  { id: "sec-hero", type: "hero", enabled: true, order: 2, title: "Featured Frontier Developments" },
  { id: "sec-launches", type: "model-launches", enabled: true, order: 3, title: "Model Launches Desk" },
  { id: "sec-india-ai", type: "india-ai", enabled: true, order: 4, title: "India AI Mission & Compute" },
  { id: "sec-tools", type: "ai-tools", enabled: true, order: 5, title: "Developer Tools & Agent Runners" },
  { id: "sec-guides", type: "guides", enabled: true, order: 6, title: "Architectural Guides & Benchmarks" },
  { id: "sec-enterprise", type: "enterprise-ai", enabled: true, order: 7, title: "Enterprise AI Production" },
  { id: "sec-trending", type: "trending-latest", enabled: true, order: 8, title: "Trending & Most Read" },
  { id: "sec-benchmarks", type: "benchmark-leaderboard", enabled: true, order: 9, title: "AI Benchmark Leaderboard" },
  { id: "sec-calculator", type: "model-calculator", enabled: true, order: 10, title: "API Cost Calculator" },
  { id: "sec-newsletter", type: "newsletter", enabled: true, order: 11, title: "Daily AI Dispatch" },
  { id: "sec-intro", type: "site-intro", enabled: true, order: 12, title: "Editorial Charter & Principles" },
  { id: "sec-faq", type: "faq", enabled: true, order: 13, title: "Interactive Editorial FAQ" },
  { id: "sec-poll", type: "community-poll", enabled: true, order: 14, title: "Reader Benchmark Poll" },
  { id: "sec-timeline", type: "model-releases", enabled: true, order: 15, title: "AI Releases Timeline" },
];
