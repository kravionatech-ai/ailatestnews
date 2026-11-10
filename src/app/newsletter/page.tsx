import { Metadata } from "next";
import { CheckCircle2, ShieldCheck, Zap, Mail } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { KravionaNewsletter } from "@/components/home/kraviona/newsletter-banner";
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
    title: page?.seo?.metaTitle || page?.title || "Kraviona AI News Intelligence Newsletter",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Curated AI dispatches, foundation model benchmark reports, and technology research intelligence delivered directly to your inbox.",
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
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-12 pb-6">
        <div className="max-w-3xl mb-6 pb-5 border-b-2 border-[var(--color-heading)]">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2">
            <Mail className="h-3.5 w-3.5" />
            <span>Kraviona Briefing // Intelligence Wire</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-[1.1]">
            {page?.title || "The Morning AI & Technology Dispatch"}
          </h1>
          <p className="mt-3 text-base text-[var(--color-body-text)] leading-relaxed">
            {page?.excerpt ||
              "Curated daily briefings on frontier foundation models, arXiv research breakthroughs, developer tools, and compute economics."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm max-w-3xl my-6 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}
      </div>

      <KravionaNewsletter source="newsletter-page" className="!py-6" />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {perks.map((p, idx) => {
            const Icon = p.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-2.5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-secondary-surface)] text-[var(--accent)]">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="font-display text-sm font-bold text-[var(--color-heading)]">
                  {p.title}
                </h2>
                <p className="text-xs leading-relaxed text-[var(--color-muted-text)]">
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