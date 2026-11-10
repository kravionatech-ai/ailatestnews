import Link from "next/link";
import { ArrowRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard } from "@/components/blog/cards/news-card";
import { MinimalListCard } from "@/components/blog/cards/minimal-list";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface TrendingLatestProps {
  config?: HomepageSectionConfig;
  latestPosts?: NewsCardPost[];
  trendingPosts?: NewsCardPost[];
  posts?: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  className?: string;
}

export function TrendingLatestSection({
  config,
  latestPosts: latestProp,
  trendingPosts: trendingProp,
  posts: postsProp,
  title: titleProp,
  cardVariant: variantProp,
  className,
}: TrendingLatestProps) {
  // Resolve latest stream posts
  const resolvedLatest: NewsCardPost[] =
    latestProp && latestProp.length > 0
      ? latestProp.slice(0, 4)
      : (postsProp || []).slice(0, 4);

  // Resolve trending posts by views
  const resolvedTrending: NewsCardPost[] =
    trendingProp && trendingProp.length > 0
      ? trendingProp.slice(0, 5)
      : [...(postsProp || [])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);

  const title = config?.title || titleProp || "Latest AI Reporting";
  const kicker = config?.kicker || "Continuous Stream";
  const streamVariant: CardVariant =
    (config?.cardVariant as CardVariant) || variantProp || "horizontal";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="Latest AI Stream and Most Read"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Continuous Stream (8 cols) */}
        <div className="lg:col-span-8">
          <div className="flex items-end justify-between mb-8 pb-4 border-b border-[var(--color-heading,#0F172A)]">
            <div>
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text,#64748B)] block mb-1">
                {kicker}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading,#0F172A)]">
                {title}
              </h2>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)] hover:text-[var(--color-primary-accent,#10B981)] transition-colors"
            >
              <span>Full Archive</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Vertical Stack of Stream Cards */}
          <div className="space-y-6">
            {resolvedLatest.map((post) => (
              <NewsCard
                key={post._id || post.slug}
                post={post}
                variant={streamVariant}
                showBadges={true}
                showExcerpt={true}
              />
            ))}
          </div>

          <div className="mt-8 pt-4">
            <Link
              href="/blog"
              className="inline-flex items-center justify-center gap-2 rounded-[var(--radius,0.5rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)] px-6 py-3 text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)] hover:bg-[var(--color-secondary-surface,#F1F5F9)] hover:border-[var(--color-heading,#0F172A)] transition-all shadow-2xs group"
            >
              <span>Explore All Published Stories</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Right Column: Algorithmic Leaderboard (4 cols) */}
        <aside className="lg:col-span-4">
          <div className="border border-[var(--color-border,#E2E8F0)] rounded-[var(--radius-card,0.75rem)] bg-[var(--color-card-background,#FFFFFF)] p-6 shadow-2xs">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--color-heading,#0F172A)]">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)]">
                <TrendingUp className="h-4 w-4 text-[var(--color-trending,#F59E0B)]" />
                <span>The Most Read</span>
              </div>
              <span className="text-[10px] font-mono text-[var(--color-muted-text,#64748B)] uppercase">
                Top 5
              </span>
            </div>

            <div className="space-y-1">
              {resolvedTrending.map((post, idx) => (
                <MinimalListCard
                  key={post._id || post.slug || idx}
                  post={post}
                  rank={idx + 1}
                  showBadges={true}
                  showReadingTime={true}
                  showViewsCount={true}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
