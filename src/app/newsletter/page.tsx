import { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Zap, Mail } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { NewsletterBox } from "@/components/home/newsletter-box";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "newsletter" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/newsletter",
    title: page?.seo?.metaTitle || page?.title || "AI Latest News Intelligence Newsletter",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Curated weekly AI dispatches, foundation model benchmark reports, and Indian compute intelligence delivered directly to your inbox.",
  });
}

export default async function NewsletterPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "newsletter" }).lean(),
      getGlobalSettings(),
    ]);
    pageRaw = p;
    settings = s;
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  const perks = [
    {
      icon: Zap,
      title: "Actionable Patterns",
      desc: "Every email contains reproducible code patterns, latency numbers, and architecture breakdowns.",
    },
    {
      icon: CheckCircle2,
      title: "Double Opt-In Protected",
      desc: "Strict adherence to anti-spam protocols with one-click unsubscribe links in every dispatch.",
    },
    {
      icon: ShieldCheck,
      title: "Primary Source Grounded",
      desc: "Zero unverified hype. Only models, benchmarks, and infrastructure verified in production.",
    },
  ];

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-3xl mb-8 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Mail className="h-3.5 w-3.5 text-rose-600" />
            <span>The Daily Wire // Intelligence Briefing</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
            {page?.title || "The Morning AI Dispatch for Builders"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {page?.excerpt ||
              "Every morning at 07:00 IST, we dissect new foundation model weights, GPU compute subsidies, and local tooling."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm max-w-3xl my-6"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}

        <div className="my-8 max-w-3xl">
          <NewsletterBox />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mt-12">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-2"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-900">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {p.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </PublicShell>
  );
}