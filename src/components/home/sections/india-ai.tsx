import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard } from "@/components/blog/cards/news-card";
import { SectionDeskHeader } from "./section-header";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface IndiaAiProps {
  config?: HomepageSectionConfig;
  posts: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  className?: string;
}

export function IndiaAiSection({
  config,
  posts,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  cardVariant: variantProp,
  limit: limitProp,
  className,
}: IndiaAiProps) {
  const displayPosts = (posts || []).slice(0, config?.limit || limitProp || 3);
  if (displayPosts.length === 0) return null;

  const kicker = config?.kicker || kickerProp || "Desk 02 // Sovereign Compute & India AI Mission";
  const title = config?.title || titleProp || "India AI & Sovereign Infrastructure";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Tracking the ₹10,372 Cr IndiaAI Mission, domestic GPU clusters, and Indic frontier models.";

  const effectiveVariant: CardVariant =
    (config?.cardVariant as CardVariant) || variantProp || "modern-magazine";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="India AI Desk"
    >
      <SectionDeskHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        icon={Flag}
        actionLabel="India AI Archive"
        actionHref="/category/india-ai"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {displayPosts.map((post) => (
          <NewsCard
            key={post._id || post.slug}
            post={post}
            variant={effectiveVariant}
            showBadges={true}
            showExcerpt={true}
          />
        ))}
      </div>
    </section>
  );
}
