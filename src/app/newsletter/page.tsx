import { Metadata } from "next";
import { Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { NewsletterBox } from "@/components/home/newsletter-box";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "newsletter" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/newsletter",
    title: page?.seo?.metaTitle || page?.title || "AI Latest News Intelligence Newsletter",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Curated weekly AI dispatches, foundation model benchmark reports, and Indian compute intelligence delivered directly to your inbox.",
  });
}

export default async function NewsletterPage() {
  await connectDB();
  const [pageRaw, settings] = await Promise.all([
    Page.findOne({ slug: "newsletter" }).lean(),
    getGlobalSettings(),
  ]);
  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  const perks = [
    {
      icon: Zap,
      title: "Actionable Patterns",
      desc: "Every email contains reproducible code patterns and architectural diagrams.",
    },
    {
      icon: CheckCircle2,
      title: "Double Opt-In Protected",
      desc: "Strict adherence to anti-spam protocols with one-click unsubscribe links in every footer.",
    },
    {
      icon: ShieldCheck,
      title: "100% Sponsor Vetted",
      desc: "No low-quality sponsored content. Only tools and infrastructure we actively run in production.",
    },
  ];

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-semibold text-[var(--accent)] shadow-2xs mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Weekly Tech Dispatch</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--foreground)]">
            {page?.title || "The Technical Briefing for Senior Engineers"}
          </h1>
          <p className="mt-4 text-base text-[var(--foreground-muted)] leading-relaxed">
            {page?.excerpt ||
              "Every Thursday morning, we dissect modern web infrastructure, distributed system bottlenecks, and emerging AI tooling."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm max-w-2xl mx-auto my-6"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}

        <div className="my-10 max-w-2xl mx-auto">
          <NewsletterBox />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-2 text-center"
              >
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  {p.title}
                </h3>
                <p className="text-xs text-[var(--foreground-muted)]">
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
