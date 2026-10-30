import { Metadata } from "next";
import { BookOpen, Code2, Cpu, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "about" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/about",
    title: page?.seo?.metaTitle || page?.title || "About AI Latest News | Editorial Mission & Standards",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Learn about AI Latest News, India's dedicated artificial intelligence editorial platform, model benchmark standards, and technology journalism values.",
  });
}

export default async function AboutPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "about" }).lean(),
      getGlobalSettings(),
    ]);
    pageRaw = p;
    settings = s;
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  const pillars = [
    {
      icon: Cpu,
      title: "Zero Fluff Architecture",
      desc: "We focus on verified system design, memory footprints, algorithmic complexity, and scalable distributed patterns.",
    },
    {
      icon: Code2,
      title: "Executable & Verified",
      desc: "Every code snippet is verified against current LTS runtimes and modern compiler constraints. If it doesn't run, we don't publish it.",
    },
    {
      icon: ShieldCheck,
      title: "Zero-CLS, WCAG AA Accessibility",
      desc: "Our reading interface is built for performance. Instant server rendering, minimal hydration overhead, and pristine typography.",
    },
  ];

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-slate-900" />
          <span>Editorial Charter // Mission</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.12]">
          {page?.title || "An Independent AI Publication Engineered for Builders"}
        </h1>

        <p className="mt-4 text-lg font-serif text-slate-700 leading-relaxed">
          {page?.excerpt ||
            "AI Latest News was founded to bridge the gap between high-level foundation model research and practical deployment for Indian developers, enterprises, and startups. We deliver rigorous, verified benchmarks and independent news dispatches."}
        </p>

        {page?.contentHtml ? (
          <div
            className="prose-article text-base my-8"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <>
            <div className="my-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {p.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-slate-600">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="prose-article text-base text-slate-800 leading-relaxed space-y-4">
              <h2>Verified Research &amp; Independent Benchmarks</h2>
              <p>
                Our reporting prioritizes verified reproducibility over press release hype. When new frontier models like DeepSeek-R1, Claude 3.7, or Sarvam-1 launch, our technical editors evaluate context windows, tokenization ratios on Indic scripts (Hindi, Tamil, Telugu), and actual rupee pricing for Indian engineering teams.
              </p>

              <h2>Peer Review &amp; Primary Sources</h2>
              <p>
                We welcome submissions and tips from AI researchers, founders, and engineers. Every claim is corroborated by primary sources (official weights, arXiv preprints, or government tenders) before publication.
              </p>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
