import { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "terms" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/terms",
    title: page?.seo?.metaTitle || page?.title || "Terms of Service | Kraviona AI News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Terms and conditions governing the use of Kraviona AI News.",
  });
}

export default async function TermsPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "terms" }).lean(),
      getGlobalSettings(),
    ]);
    pageRaw = p;
    settings = s;
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="border-b-2 border-[var(--color-heading)] pb-5 mb-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2">
            Legal &amp; Governance
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--color-heading)]">
            {page?.title || "Terms of Service"}
          </h1>
        </div>

        {page?.contentHtml ? (
          <div
            className="prose-article text-base leading-relaxed space-y-6 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div className="prose-article text-base leading-relaxed space-y-6 text-[var(--color-body-text)]">
            <p>
              Welcome to Kraviona AI News. By accessing or interacting with our publication, you agree to comply with and be bound by the following editorial terms.
            </p>

            <h2 className="font-display font-bold text-lg text-[var(--color-heading)] mt-6">1. Code Snippets &amp; Licensing</h2>
            <p>
              Unless explicitly stated otherwise, original editorial reporting and brand assets remain the intellectual property of Kraviona AI News, while accompanying tutorial code snippets are provided under permissive open-source terms where indicated.
            </p>

            <h2 className="font-display font-bold text-lg text-[var(--color-heading)] mt-6">2. Accuracy &amp; Disclaimers</h2>
            <p>
              While our editorial staff rigorously verifies model evaluations, research findings, and technology benchmarks, the field of artificial intelligence evolves rapidly. Articles represent documented snapshots at publication time and should be independently validated for mission-critical deployments.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
