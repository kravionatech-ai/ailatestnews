import { Metadata } from "next";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "terms" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/terms",
    title: page?.seo?.metaTitle || page?.title || "Terms of Service | AI Latest News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Terms and conditions governing the use of AI Latest News.",
  });
}

export default async function TermsPage() {
  await connectDB();
  const [pageRaw, settings] = await Promise.all([
    Page.findOne({ slug: "terms" }).lean(),
    getGlobalSettings(),
  ]);
  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-8">
          {page?.title || "Terms of Service"}
        </h1>

        {page?.contentHtml ? (
          <div
            className="prose-article text-sm leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div className="prose-article text-sm leading-relaxed space-y-6">
            <p>
              Welcome to AI Latest News. By accessing or interacting with our platform, you agree to comply with and be bound by the following editorial terms.
            </p>

            <h3 className="font-bold text-base text-[var(--foreground)] mt-6">1. Code Snippets &amp; Licensing</h3>
            <p>
              All source code samples, snippets, and architectural boilerplate published on AI Latest News are provided under the MIT License unless explicitly designated otherwise. You are free to adapt, execute, and embed them within personal and commercial software.
            </p>

            <h3 className="font-bold text-base text-[var(--foreground)] mt-6">2. Accuracy &amp; Disclaimers</h3>
            <p>
              While our editorial staff rigorously tests every model evaluation and compute benchmark, the field of artificial intelligence evolves rapidly. Articles represent research snapshots at publication date and should be independently validated for mission-critical deployments.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
