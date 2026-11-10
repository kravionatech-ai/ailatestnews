import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NewsCard } from "@/components/blog/cards/news-card";
import { SectionDeskHeader } from "./section-header";
import type { NewsCardPost } from "@/components/blog/cards/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";

export interface EnterpriseAiProps {
  config?: HomepageSectionConfig;
  posts: NewsCardPost[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  className?: string;
}

export function EnterpriseAiSection({
  config,
  posts,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  cardVariant: variantProp,
  limit: limitProp,
  className,
}: EnterpriseAiProps) {
  const displayPosts = (posts || []).slice(0, config?.limit || limitProp || 2);
  if (displayPosts.length === 0) return null;

  const kicker = config?.kicker || kickerProp || "Desk 05 // Enterprise Infrastructure & Deployment";
  const title = config?.title || titleProp || "Enterprise Architecture & Security";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Production deployment patterns, prompt engineering frameworks, and sovereign data governance.";

  const effectiveVariant: CardVariant =
    (config?.cardVariant as CardVariant) || variantProp || "modern-magazine";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="Enterprise AI Desk"
    >
      <SectionDeskHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        icon={Building2}
        actionLabel="Enterprise Hub"
        actionHref="/category/enterprise-ai"
      />

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
