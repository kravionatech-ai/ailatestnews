import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard } from "@/components/blog/cards/news-card";
import { SectionDeskHeader } from "./section-header";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface ModelLaunchesProps {
  config?: HomepageSectionConfig;
  posts: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  className?: string;
}

export function ModelLaunchesSection({
  config,
  posts,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  cardVariant: variantProp,
  limit: limitProp,
  className,
}: ModelLaunchesProps) {
  const displayPosts = (posts || []).slice(0, config?.limit || limitProp || 3);
  if (displayPosts.length === 0) return null;

  const kicker = config?.kicker || kickerProp || "Desk 01 // Foundation Models & Open Weights";
  const title = config?.title || titleProp || "Model Launches & Benchmarks";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Independent teardowns of architecture disclosures, context windows, and reasoning benchmarks.";

  const effectiveVariant: CardVariant =
    (config?.cardVariant as CardVariant) || variantProp || "modern-magazine";

  const isHorizontal = effectiveVariant === "horizontal";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="Model Launches Desk"
    >
      <SectionDeskHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        icon={Cpu}
        actionLabel="All Releases"
        actionHref="/category/model-launches"
      />

      <div
        className={cn(
          "grid gap-6 sm:gap-8",
          isHorizontal
            ? "grid-cols-1 lg:grid-cols-2"
            : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}
      >
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

// Backward-compatibility alias
export { ModelLaunchesSection as ModelLaunchesSectionLegacy };
