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
    title: page?.seo?.metaTitle || page?.title || "Privacy Policy | Kraviona AI News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Kraviona AI News commitment to reader privacy and transparent data practices.",
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
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="border-b-2 border-[var(--color-heading)] pb-5 mb-8">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2">
            Legal &amp; Compliance
          </p>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--color-heading)]">
            {page?.title || "Privacy Policy"}
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
              Last updated: November 2026. Kraviona AI News is committed to protecting the privacy of our readers and subscribers.
            </p>

            <h2 className="font-display font-bold text-lg text-[var(--color-heading)] mt-6">1. Information Collection</h2>
            <p>
              We collect personal information solely when you voluntarily provide it to us, such as your email address when subscribing to our intelligence newsletter, contacting our newsroom, or submitting an article comment. We never sell, rent, or lease reader data to third parties.
            </p>

            <h2 className="font-display font-bold text-lg text-[var(--color-heading)] mt-6">2. Analytics &amp; Cookies</h2>
            <p>
              We utilize privacy-respecting, aggregated analytics to understand macro readership patterns, topic engagement, and site reliability. Essential session storage is used solely for authentication and editorial preferences such as dark mode.
            </p>

            <h2 className="font-display font-bold text-lg text-[var(--color-heading)] mt-6">3. Data Security</h2>
            <p>
              Reader data is stored securely using industry-standard encryption in transit and at rest. You may request data erasure at any time by contacting our editorial privacy desk.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
