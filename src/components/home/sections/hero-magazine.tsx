"use client";

import Link from "next/link";
import { Flame, Clock } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { NewsCard } from "@/components/blog/cards/news-card";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface HeroMagazineProps {
  config?: HomepageSectionConfig;
  featuredPost?: NewsCardPost | null;
  secondaryPosts?: NewsCardPost[];
  posts?: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  trendingTopics?: Array<{ label: string; href: string }>;
  className?: string;
}

const DEFAULT_TRENDING_TOPICS = [
  { label: "IndiaAI 10k GPUs", href: "/blog/india-10000-gpus-national-ai-mission-tender" },
  { label: "DeepSeek-V3", href: "/blog/deepseek-v3-architecture-deep-dive-mla-dualpipe" },
  { label: "ChatGPT vs Claude vs Gemini", href: "/blog/chatgpt-vs-claude-vs-gemini-best-in-india" },
  { label: "Sarvam-1 Indic 2B", href: "/blog/sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp" },
  { label: "Enterprise AI India", href: "/blog/enterprise-ai-adoption-india-bfsi-it-private-llms" },
  { label: "Free AI Tools", href: "/blog/best-free-ai-tools-for-students-2026" },
];

export function HeroMagazineSection({
  config,
  featuredPost: featuredProp,
  secondaryPosts: secondaryProp = [],
  posts: postsProp,
  title: titleProp,
  subtitle: subtitleProp,
  trendingTopics = DEFAULT_TRENDING_TOPICS,
  className,
}: HeroMagazineProps) {
  // Derive lead post & wire posts
  const leadPost: NewsCardPost | null =
    featuredProp ||
    (postsProp && postsProp[0]) ||
    secondaryProp[0] ||
    null;

  const wirePosts: NewsCardPost[] =
    secondaryProp.length > 0
      ? secondaryProp.slice(0, 3)
      : (postsProp || []).slice(1, 4);

  const title = config?.title || titleProp || "Latest AI News, Tools and Launches, Explained for India";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Independent reporting, hands-on model evaluations, and sovereign compute analysis.";

  const leadVariant: CardVariant =
    (config?.cardVariant as CardVariant) || "large-featured";

  return (
    <section
      className={cn(
        "border-b border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)] pt-6 pb-10",
        className
      )}
      aria-label="Lead Editorial Stories"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1280px)] px-4 sm:px-6 lg:px-8">
        {/* Trending In-Focus Topics Bar */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-[var(--color-border,#E2E8F0)] pb-3 text-xs">
          <span className="flex items-center gap-1 font-mono text-[11px] font-black uppercase tracking-wider text-[var(--color-breaking-news,#EF4444)] shrink-0">
            <Flame className="h-3.5 w-3.5 fill-current" />
            In Focus:
          </span>
          <div className="flex items-center gap-2 text-[var(--color-muted-text,#64748B)] font-medium whitespace-nowrap">
            {trendingTopics.map((topic, i) => (
              <span key={topic.label} className="flex items-center gap-2">
                <Link
                  href={topic.href}
                  className="rounded-md bg-[var(--color-secondary-surface,#F1F5F9)] hover:bg-[var(--color-border,#E2E8F0)] hover:text-[var(--color-heading,#0F172A)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-body-text,#334155)] transition-colors"
                >
                  #{topic.label}
                </Link>
                {i < trendingTopics.length - 1 && (
                  <span className="text-[var(--color-border,#E2E8F0)]">·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Magazine Grid: Lead Story (8 cols) + The Wire (4 cols) */}
        {leadPost ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 1. Main Lead Cover Story */}
            <div className="lg:col-span-8">
              <NewsCard
                post={leadPost}
                variant={leadVariant}
                priorityImage={true}
                showBadges={true}
                showExcerpt={true}
                showAuthorAvatar={true}
              />
            </div>

            {/* 2. The Developing Wire */}
            <aside className="lg:col-span-4 rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)] p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border,#E2E8F0)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--color-breaking-news,#EF4444)] animate-pulse" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-heading,#0F172A)] font-mono">
                    The Developing Wire
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="text-[11px] font-bold text-[var(--color-primary-accent,#10B981)] hover:underline"
                >
                  All Dispatches →
                </Link>
              </div>

              <div className="divide-y divide-[var(--color-border,#E2E8F0)]">
                {wirePosts.map((post) => {
                  const dateVal = post.publishedAt || post.createdAt;
                  return (
                    <article key={post._id || post.slug} className="py-4 first:pt-1 last:pb-1 group relative">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[var(--color-muted-text,#64748B)] mb-1.5">
                        <span className="font-bold text-[var(--color-primary-accent,#10B981)]">
                          {post.category?.name || "Update"}
                        </span>
                        {dateVal && <span>{formatRelativeTime(dateVal)}</span>}
                      </div>

                      <h3 className="text-sm font-bold text-[var(--color-heading,#0F172A)] tracking-tight leading-snug group-hover:text-[var(--color-primary-accent,#10B981)] transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          <span className="absolute inset-0 z-0" aria-hidden="true" />
                          {post.title}
                        </Link>
                      </h3>

                      {post.excerpt && (
                        <p className="mt-1.5 text-xs text-[var(--color-muted-text,#64748B)] line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      )}

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[var(--color-muted-text,#64748B)] font-medium">
                        {post.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readingTime} min
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-semibold text-[var(--color-heading,#0F172A)] group-hover:text-[var(--color-primary-accent,#10B981)]">
                          Read dispatch →
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>
          </div>
        ) : (
          <div className="text-center py-10 max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold text-[var(--color-heading,#0F172A)] tracking-tight">
              {title}
            </h1>
            <p className="text-[var(--color-muted-text,#64748B)] text-sm leading-relaxed">{subtitle}</p>
          </div>
        )}
      </div>
    </section>
  );
}

// Export HeroMagazineSection
export default HeroMagazineSection;
