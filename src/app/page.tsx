import { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { SectionDispatcher } from "@/components/home/section-dispatcher";
import {
  HeroEditorialSection,
  LatestNewsSection,
  TrendingNowSection,
  ExploreCategoriesSection,
  EditorsPicksSection,
  KravionaNewsletter,
} from "@/components/home/kraviona";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { getActiveHomepageSections } from "@/lib/design-tokens/service";
import { getHomepageData } from "@/lib/home/data";

export const revalidate = 300; // 5 minutes ISR for public visitors

interface HomePageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(): Promise<Metadata> {
  let homePage: any = null;
  try {
    await connectDB();
    homePage = await Page.findOne({ slug: "home" }).lean();
  } catch {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "home",
    entitySeo: homePage?.seo,
    path: "/",
    title:
      homePage?.seo?.metaTitle ||
      homePage?.title ||
      "Kraviona AI News — AI, Technology, Research and Innovation Intelligence",
    excerpt:
      homePage?.seo?.metaDescription ||
      homePage?.excerpt ||
      "Independent international digital publication covering artificial intelligence, foundation models, research papers, AI tools, startups, cybersecurity, and compute technology.",
  });
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const isPreviewRequested =
    resolvedParams.preview === "true" || resolvedParams.preview === "draft";
  const previewToken =
    typeof resolvedParams.token === "string"
      ? resolvedParams.token
      : typeof resolvedParams.secret === "string"
      ? resolvedParams.secret
      : undefined;

  const { sections, isPreview } = await getActiveHomepageSections({
    isPreview: isPreviewRequested,
    previewToken,
  });

  const clientSections = isPreview
    ? sections
    : sections.filter(
        (s) =>
          s.enabled &&
          ![
            "benchmark-leaderboard",
            "model-calculator",
            "community-poll",
            "model-releases",
            "site-intro",
            "faq",
          ].includes(s.type)
      );

  let data: any = null;
  let settings: any = {};

  try {
    const [d, s] = await Promise.all([
      getHomepageData(clientSections),
      getGlobalSettings(),
    ]);
    data = d;
    settings = s;
  } catch (err) {
    console.error("[HomePage] Error fetching homepage data:", err);
    settings = await getGlobalSettings();
    data = {
      headlines: [],
      featuredPost: null,
      secondaryPosts: [],
      trendingPosts: [],
      latestPosts: [],
      editorsPicks: [],
      sectionPostsMap: {},
      heroProps: {
        badge: "AI, Technology, Research & Innovation Intelligence",
        title: "Kraviona AI News — Frontier Intelligence",
        subtitle:
          "Authoritative coverage of foundational AI models, scientific research, engineering tooling, and global compute.",
        primaryCtaText: "Explore Latest News",
        primaryCtaLink: "/category/ai-news",
        secondaryCtaText: "AI Models",
        secondaryCtaLink: "/category/model-launches",
        showOrb: false,
      },
      faqProps: { title: "Editorial Intelligence FAQ", subtitle: "" },
      introProps: { title: "Kraviona AI News Editorial Standards" },
    };
  }

  return (
    <PublicShell
      navLinks={settings?.navigation}
      footerConfig={settings?.footer}
      headlines={data?.headlines}
    >
      {/* Draft Preview Indicator Banner */}
      {isPreview && (
        <aside
          role="status"
          aria-label="Draft Preview Mode"
          className="sticky top-0 z-50 flex items-center justify-between border-b border-amber-400 bg-amber-500/95 px-4 py-2 font-mono text-xs font-bold text-slate-950 backdrop-blur-md shadow-sm"
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-950 animate-pulse" />
            <span>DESIGN STUDIO PREVIEW · Viewing Unpublished Draft Configuration</span>
          </div>
          <span className="rounded bg-slate-950 px-2 py-0.5 text-[10px] uppercase text-white">
            Draft Active
          </span>
        </aside>
      )}

      {isPreview ? (
        <SectionDispatcher sections={clientSections} data={data} isPreview={isPreview} />
      ) : (
        <>
          {/* C. Hero Editorial Section */}
          <HeroEditorialSection
            featuredPost={data?.featuredPost || null}
            secondaryPosts={data?.secondaryPosts || []}
          />

          {/* D. Latest News */}
          <LatestNewsSection
            posts={
              data?.latestPosts && data.latestPosts.length > 0
                ? data.latestPosts
                : data?.secondaryPosts || []
            }
          />

          {/* E. Trending Now */}
          <TrendingNowSection posts={data?.trendingPosts || []} />

          {/* F. Explore Categories */}
          <ExploreCategoriesSection />

          {/* G. Editor's Picks */}
          <EditorsPicksSection
            posts={
              data?.editorsPicks && data.editorsPicks.length > 0
                ? data.editorsPicks
                : data?.trendingPosts?.slice(0, 4) || []
            }
          />

          {/* H. Newsletter Section */}
          <KravionaNewsletter variant="banner" source="homepage" />
        </>
      )}
    </PublicShell>
  );
}
