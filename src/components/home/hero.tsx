"use client";

import { HeroMagazineSection, type HeroMagazineProps } from "./sections/hero-magazine";

export interface HeroProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featuredPost?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  secondaryPosts?: any[];
  badge?: string;
  title?: string;
  subtitle?: string;
  onOpenChat?: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export function Hero({
  featuredPost,
  secondaryPosts = [],
  badge,
  title,
  subtitle,
  ...rest
}: HeroProps = {}) {
  return (
    <HeroMagazineSection
      featuredPost={featuredPost}
      secondaryPosts={secondaryPosts}
      kicker={badge}
      title={title}
      subtitle={subtitle}
      {...rest}
    />
  );
}

export default Hero;
