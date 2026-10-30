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
    page = await Page.findOne({ slug: "privacy" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/privacy",
    title: page?.seo?.metaTitle || page?.title || "Privacy Policy | AI Latest News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Our commitment to reader privacy and transparent data practices.",
  });
}

export default async function PrivacyPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "privacy" }).lean(),
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] mb-8">
          {page?.title || "Privacy Policy"}
        </h1>

        {page?.contentHtml ? (
          <div
            className="prose-article text-sm leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div className="prose-article text-sm leading-relaxed space-y-6">
            <p>
              Last updated: October 2026. AI Latest News is committed to protecting the privacy of our readers and subscribers.
            </p>

            <h3 className="font-bold text-base text-[var(--foreground)] mt-6">1. Information Collection</h3>
            <p>
              We collect personal information solely when you voluntarily provide it to us, such as your email address when subscribing to our intelligence newsletter or submitting an article comment. We do not sell, rent, or lease reader data to third parties.
            </p>

            <h3 className="font-bold text-base text-[var(--foreground)] mt-6">2. Analytics &amp; Cookies</h3>
            <p>
              We utilize privacy-respecting, aggregated analytics to understand macro traffic patterns, top AI search queries, and reading durations. No personally identifiable tracking cookies are stored without consent.
            </p>

            <h3 className="font-bold text-base text-[var(--foreground)] mt-6">3. Data Security</h3>
            <p>
              Reader data is stored securely using enterprise-grade encryption in transit and at rest. You may request data erasure at any time by contacting our privacy compliance desk.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
