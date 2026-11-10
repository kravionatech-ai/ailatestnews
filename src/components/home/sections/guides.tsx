import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard } from "@/components/blog/cards/news-card";
import { SectionDeskHeader } from "./section-header";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface GuidesProps {
  config?: HomepageSectionConfig;
  posts: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  className?: string;
}

export function GuidesSection({
  config,
  posts,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  cardVariant: variantProp,
  limit: limitProp,
  className,
}: GuidesProps) {
  const displayPosts = (posts || []).slice(0, config?.limit || limitProp || 2);
  if (displayPosts.length === 0) return null;

  const kicker = config?.kicker || kickerProp || "Desk 04 // Benchmarks & Shootouts";
  const title = config?.title || titleProp || "Guides & Model Shootouts";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Unbiased comparisons, token cost analysis, and actionable implementation tutorials.";

  const effectiveVariant: CardVariant =
    (config?.cardVariant as CardVariant) || variantProp || "modern-magazine";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="Guides Desk"
    >
      <SectionDeskHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        icon={Scale}
        actionLabel="All Comparisons"
        actionHref="/category/guides-and-comparisons"
      />

      {/* 2-Column In-Depth Shootout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {displayPosts.map((post) => (
          <NewsCard
            key={post._id || post.slug}
            post={post}
            variant={effectiveVariant}
            aspectRatio="16:9"
            showBadges={true}
            showExcerpt={true}
          />
        ))}
      </div>
    </section>
  );
}
