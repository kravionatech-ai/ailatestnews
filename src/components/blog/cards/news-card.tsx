"use client";

import React from "react";
import type { CardVariant } from "@/lib/design-tokens/types";
import { ClassicEditorialCard } from "./classic-editorial";
import { ModernMagazineCard } from "./modern-magazine";
import { HorizontalCard } from "./horizontal";
import { CompactNewsCard } from "./compact";
import { LargeFeaturedCard } from "./large-featured";
import { ImageOverlayCard } from "./image-overlay";
import { MinimalListCard } from "./minimal-list";
import type { NewsCardProps, NewsCardBaseProps } from "./types";
import { cn } from "@/lib/utils";

const VARIANT_MAP: Record<CardVariant, React.ComponentType<NewsCardBaseProps & { rank?: number }>> = {
  "classic-editorial": ClassicEditorialCard,
  "modern-magazine": ModernMagazineCard,
  "horizontal": HorizontalCard,
  "compact": CompactNewsCard,
  "large-featured": LargeFeaturedCard,
  "image-overlay": ImageOverlayCard,
  "minimal-list": MinimalListCard,
};

export function NewsCard({
  post,
  variant,
  featured = false,
  rank,
  aspectRatio,
  showBadges = true,
  showAuthorAvatar = true,
  showReadingTime = true,
  showViewsCount = true,
  showExcerpt = true,
  showDate = true,
  priorityImage = false,
  className,
}: NewsCardProps) {
  // Determine effective variant with fallback hierarchy
  const effectiveVariant: CardVariant =
    variant || (featured ? "large-featured" : "classic-editorial");

  const CardComponent = VARIANT_MAP[effectiveVariant] || ClassicEditorialCard;

  // Apply md:col-span-2 when featured is true and caller hasn't explicitly overridden span
  const combinedClassName = cn(
    featured && !className?.includes("col-span") && "md:col-span-2",
    className
  );

  return (
    <CardComponent
      post={post}
      rank={rank}
      aspectRatio={aspectRatio}
      showBadges={showBadges}
      showAuthorAvatar={showAuthorAvatar}
      showReadingTime={showReadingTime}
      showViewsCount={showViewsCount}
      showExcerpt={showExcerpt}
      showDate={showDate}
      priorityImage={priorityImage}
      className={combinedClassName}
    />
  );
}

export default NewsCard;
