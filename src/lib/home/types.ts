import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import type { NewsCardPost } from "@/components/blog/cards/types";

export interface HomepageResolvedData {
  headlines: Array<{
    _id: string;
    title: string;
    slug: string;
    publishedAt?: string | Date;
    createdAt?: string | Date;
  }>;
  featuredPost: NewsCardPost | null;
  secondaryPosts: NewsCardPost[];
  trendingPosts: NewsCardPost[];
  latestPosts?: NewsCardPost[];
  editorsPicks?: NewsCardPost[];
  sectionPostsMap: Record<string, NewsCardPost[]>; // keyed by section.id or section.type
  heroProps: {
    badge: string;
    title: string;
    subtitle: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    showOrb: boolean;
  };
  faqProps: {
    title: string;
    subtitle: string;
    items?: Array<{ question: string; answer: string }>;
  };
  introProps: {
    title: string;
    contentHtml?: string;
  };
}

export interface SectionDispatcherProps {
  sections: HomepageSectionConfig[];
  data: HomepageResolvedData;
  isPreview?: boolean;
}
