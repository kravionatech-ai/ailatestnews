import React from "react";
import type { SectionDispatcherProps } from "@/lib/home/types";
import type { CardVariant } from "@/lib/design-tokens/types";
import {
  BreakingNewsSection,
  HeroMagazineSection,
  ModelLaunchesSection,
  IndiaAiSection,
  AiToolsSection,
  GuidesSection,
  EnterpriseAiSection,
  TrendingLatestSection,
  BenchmarkLeaderboardSection,
  ModelCalculatorSection,
  NewsletterSection,
  SiteIntroSection,
  FaqSection,
  CommunityPollSection,
  ModelReleasesTimelineSection,
} from "./sections";

const FULL_WIDTH_SECTIONS = new Set(["breaking-news", "hero"]);

export function SectionDispatcher({
  sections,
  data,
  isPreview = false,
}: SectionDispatcherProps) {
  const activeSections = [...(sections || [])]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);

  if (activeSections.length === 0) {
    return (
      <div
        className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-xs text-slate-500"
        role="status"
        aria-label="No Active Sections"
      >
        No sections are currently enabled on the homepage. Configure sections in the Admin Design Studio.
      </div>
    );
  }

  return (
    <>
      {activeSections.map((section) => {
        const posts =
          data.sectionPostsMap[section.id] ||
          data.sectionPostsMap[section.type] ||
          [];
        const isFullWidth = FULL_WIDTH_SECTIONS.has(section.type);

        let content: React.ReactNode = null;

        switch (section.type) {
          case "breaking-news":
            content = (
              <BreakingNewsSection
                config={section}
                headlines={data.headlines}
                posts={posts}
                kicker={section.kicker}
                limit={section.limit}
              />
            );
            break;

          case "hero":
            content = (
              <HeroMagazineSection
                config={section}
                featuredPost={data.featuredPost}
                secondaryPosts={data.secondaryPosts}
                posts={posts}
                title={section.title || data.heroProps.title}
                subtitle={section.subtitle || data.heroProps.subtitle}
                kicker={section.kicker || data.heroProps.badge}
              />
            );
            break;

          case "model-launches":
            content = (
              <ModelLaunchesSection
                config={section}
                posts={posts}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                cardVariant={section.cardVariant as CardVariant}
                limit={section.limit}
              />
            );
            break;

          case "india-ai":
            content = (
              <IndiaAiSection
                config={section}
                posts={posts}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                cardVariant={section.cardVariant as CardVariant}
                limit={section.limit}
              />
            );
            break;

          case "ai-tools":
            content = (
              <AiToolsSection
                config={section}
                posts={posts}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                cardVariant={section.cardVariant as CardVariant}
                limit={section.limit}
              />
            );
            break;

          case "guides":
            content = (
              <GuidesSection
                config={section}
                posts={posts}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                cardVariant={section.cardVariant as CardVariant}
                limit={section.limit}
              />
            );
            break;

          case "enterprise-ai":
            content = (
              <EnterpriseAiSection
                config={section}
                posts={posts}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                cardVariant={section.cardVariant as CardVariant}
                limit={section.limit}
              />
            );
            break;

          case "trending-latest":
            content = (
              <TrendingLatestSection
                config={section}
                latestPosts={posts}
                trendingPosts={data.trendingPosts}
                title={section.title}
                subtitle={section.subtitle}
                cardVariant={section.cardVariant as CardVariant}
              />
            );
            break;

          case "benchmark-leaderboard":
            content = (
              <BenchmarkLeaderboardSection
                config={section}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
              />
            );
            break;

          case "model-calculator":
            content = (
              <ModelCalculatorSection
                config={section}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
              />
            );
            break;

          case "newsletter":
            content = (
              <NewsletterSection
                config={section}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
              />
            );
            break;

          case "site-intro":
            content = (
              <SiteIntroSection
                config={section}
                title={section.title || data.introProps.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                contentHtml={
                  (section.customSettings?.contentHtml as string) ||
                  data.introProps.contentHtml
                }
              />
            );
            break;

          case "faq":
            content = (
              <FaqSection
                config={section}
                title={section.title || data.faqProps.title}
                subtitle={section.subtitle || data.faqProps.subtitle}
                kicker={section.kicker}
                items={
                  (section.customSettings?.items as any) || data.faqProps.items
                }
              />
            );
            break;

          case "community-poll":
            content = (
              <CommunityPollSection
                config={section}
                pollId={section.id}
                question={
                  section.title || (section.customSettings?.question as string)
                }
                options={section.customSettings?.options as any}
                subtitle={section.subtitle}
                kicker={section.kicker}
              />
            );
            break;

          case "model-releases":
            content = (
              <ModelReleasesTimelineSection
                config={section}
                posts={posts}
                title={section.title}
                subtitle={section.subtitle}
                kicker={section.kicker}
                limit={section.limit}
              />
            );
            break;

          default:
            return null;
        }

        // Render full-width vs contained
        if (isFullWidth) {
          return <React.Fragment key={section.id}>{content}</React.Fragment>;
        }

        return (
          <div
            key={section.id}
            data-section-id={section.id}
            data-section-type={section.type}
            className="mx-auto max-w-[var(--max-content-width,1280px)] px-4 sm:px-6 lg:px-8"
          >
            {content}
          </div>
        );
      })}
    </>
  );
}

export default SectionDispatcher;
