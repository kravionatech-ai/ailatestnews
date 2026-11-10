import Link from "next/link";
import { Rocket, Calendar, ArrowRight, Clock } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { SectionDeskHeader } from "./section-header";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface ModelReleasesTimelineProps {
  config?: HomepageSectionConfig;
  posts?: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  className?: string;
}

const DEFAULT_MILESTONES: NewsCardPost[] = [
  {
    _id: "milestone-1",
    title: "DeepSeek-V3 & R1 Open-Weights Disruption: Full Teardown of Multi-Head Latent Attention",
    slug: "deepseek-v3-architecture-deep-dive-mla-dualpipe",
    excerpt: "Comprehensive technical analysis of DeepSeek-V3 architecture, 671B MoE activation, and 90.8% AIME score.",
    publishedAt: new Date("2026-02-15"),
    readingTime: 8,
    category: { name: "Model Launches", slug: "model-launches" },
    author: { name: "Editorial Desk" },
  },
  {
    _id: "milestone-2",
    title: "Sarvam AI Unveils Sarvam-1: 2B Parameter Model Optimized for 10 Indian Languages",
    slug: "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
    excerpt: "How Sarvam-1 achieves 94.2% Indic comprehension score with 4x higher tokenization efficiency.",
    publishedAt: new Date("2026-01-28"),
    readingTime: 6,
    category: { name: "India AI", slug: "india-ai" },
    author: { name: "Sovereign AI Desk" },
  },
  {
    _id: "milestone-3",
    title: "IndiaAI Mission 10,000 GPU Cluster Tender: Allocations, CtrlS & Yotta Infrastructure",
    slug: "india-10000-gpus-national-ai-mission-tender",
    excerpt: "Government reveals sovereign compute subsidies for domestic AI startups and academic labs.",
    publishedAt: new Date("2026-01-10"),
    readingTime: 7,
    category: { name: "Infrastructure", slug: "india-ai" },
    author: { name: "Policy & Compute Desk" },
  },
];

export function ModelReleasesTimelineSection({
  config,
  posts,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  limit: limitProp,
  className,
}: ModelReleasesTimelineProps) {
  // Use posts or fallback to curated default milestones
  const sourcePosts = posts && posts.length > 0 ? posts : DEFAULT_MILESTONES;

  // Sort chronologically descending
  const timelinePosts = sourcePosts
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.publishedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, config?.limit || limitProp || 6);

  if (timelinePosts.length === 0) return null;

  const kicker = config?.kicker || kickerProp || "Timeline Desk // Architectural Milestones";
  const title = config?.title || titleProp || "AI Model Releases Timeline";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Chronological tracking of frontier LLM releases, weights disclosures, and benchmark milestones.";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="AI Model Releases Timeline"
    >
      <SectionDeskHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        icon={Rocket}
        actionLabel="Explore Timeline"
        actionHref="/category/model-launches"
      />

      {/* Chronological Vertical Spine */}
      <div className="relative border-l-2 border-[var(--color-border,#E2E8F0)] ml-3 sm:ml-4 pl-6 sm:pl-8 space-y-8 sm:space-y-10 my-4">
        {timelinePosts.map((post) => {
          const dateVal = post.publishedAt || post.createdAt;
          return (
            <div key={post._id || post.slug} className="group relative">
              {/* Milestone Node on Spine */}
              <div
                className="absolute -left-[31px] sm:-left-[39px] top-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 rounded-full border-2 border-[var(--color-main-background,#F8FAFC)] bg-[var(--color-primary-accent,#10B981)] group-hover:scale-125 transition-transform"
                aria-hidden="true"
              />

              {/* Milestone Header Metadata */}
              <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
                {dateVal && (
                  <span className="font-mono text-[11px] font-bold text-[var(--color-primary-accent,#10B981)] flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(dateVal)}
                  </span>
                )}
                {post.category && (
                  <Link
                    href={`/category/${post.category.slug}`}
                    className="rounded bg-[var(--color-secondary-surface,#F1F5F9)] px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)] hover:text-[var(--color-primary-accent,#10B981)] transition-colors"
                  >
                    {post.category.name}
                  </Link>
                )}
                {post.readingTime && (
                  <span className="text-[11px] text-[var(--color-muted-text,#64748B)] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min read
                  </span>
                )}
              </div>

              {/* Milestone Card Content */}
              <div className="p-4 sm:p-5 rounded-[var(--radius-card,0.75rem)] bg-[var(--color-card-background,#FFFFFF)] border border-[var(--color-border,#E2E8F0)] hover:border-[var(--color-primary-accent,#10B981)] shadow-2xs hover:shadow-xs transition-all">
                <h3 className="text-base sm:text-lg font-bold text-[var(--color-heading,#0F172A)] group-hover:text-[var(--color-primary-accent,#10B981)] transition-colors line-clamp-2 leading-snug">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" aria-hidden="true" />
                    {post.title}
                  </Link>
                </h3>

                {post.excerpt && (
                  <p className="mt-2 text-xs sm:text-sm text-[var(--color-body-text,#334155)] line-clamp-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                )}

                <div className="mt-3.5 pt-2.5 border-t border-[var(--color-border,#E2E8F0)] flex items-center justify-between text-xs text-[var(--color-muted-text,#64748B)]">
                  <span className="font-semibold text-[var(--color-heading,#0F172A)] text-[11px]">
                    By {post.author?.name || "Editorial Desk"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-primary-accent,#10B981)]">
                    <span>Architecture Deep-Dive</span>
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Backward-compatibility alias
export { ModelReleasesTimelineSection as ModelReleasesSection };
