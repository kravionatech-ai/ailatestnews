import { Metadata } from "next";
import { ShieldCheck, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ZeroAiDetectorStudio } from "@/components/zeroai/zeroai-detector-studio";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return buildEntityMetadata({
    entityType: "page",
    path: "/zeroai",
    title: "ZeroAI — Free Clean-Room AI Content & Stylometry Detector",
    excerpt:
      "Analyze essays, articles, and AI drafts using ZeroAI on Kraviona AI News. Clean-room statistical detector measuring burstiness variance, lexical entropy, cliché markers, and sentence attribution.",
  });
}

export default async function ZeroAiPage() {
  let settings: any = {};
  let headlines: any[] = [];

  try {
    const [s, postsRes] = await Promise.all([
      getGlobalSettings(),
      getPublishedPosts({ page: 1, limit: 5, sort: "latest" }),
    ]);
    settings = s;
    headlines = postsRes?.posts || [];
  } catch {
    settings = await getGlobalSettings();
    headlines = [];
  }

  const siteUrl = getSiteUrl();
  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ZeroAI Detector — Kraviona AI News",
    url: `${siteUrl}/zeroai`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "All",
    description:
      "Clean-room stylometric and statistical AI text analyzer measuring sentence burstiness, lexical entropy, repetition patterns, and LLM transition markers.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    publisher: {
      "@type": "Organization",
      name: "Kraviona AI News",
      url: siteUrl,
    },
  };

  return (
    <PublicShell
      navLinks={settings?.navigation}
      footerConfig={settings?.footer}
      headlines={headlines}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Editorial Hero Header */}
        <header className="mb-8 pb-6 border-b-2 border-[var(--color-heading)] max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>ZeroAI Labs // Clean-Room Stylometric Intelligence</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-[var(--color-heading)] tracking-tight leading-tight">
            ZeroAI — AI Content &amp; Stylometry Detector
          </h1>

          <p className="mt-3 text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed max-w-3xl">
            Evaluate articles, academic drafts, and editorial copy for synthetic writing signatures. Powered by an independent statistical engine analyzing sentence burstiness, Moving-Average lexical diversity, word entropy, and formulaic LLM markers—with zero third-party scraping or data retention.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-mono text-[var(--color-muted-text)]">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Sentence-by-Sentence Attribution
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1">
              Up to 30,000 Characters
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1">
              Exportable JSON &amp; Summary Reports
            </span>
          </div>
        </header>

        {/* Interactive ZeroAI Studio */}
        <ZeroAiDetectorStudio />
      </div>
    </PublicShell>
  );
}
