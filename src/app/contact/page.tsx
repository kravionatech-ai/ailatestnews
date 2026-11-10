import { Metadata } from "next";
import { Mail } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ContactForm } from "@/components/contact/contact-form";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "contact" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/contact",
    title: page?.seo?.metaTitle || page?.title || "Contact Editorial Desk | Kraviona AI News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Get in touch with the Kraviona AI News editorial desk, submit AI research tips, or inquire about media and partnership opportunities.",
  });
}

export default async function ContactPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "contact" }).lean(),
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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8 pb-5 border-b-2 border-[var(--color-heading)]">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-2">
            <Mail className="h-3.5 w-3.5" />
            <span>Kraviona Newsroom // Inquiries &amp; Tips</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold tracking-tight text-[var(--color-heading)]">
            {page?.title || "Contact the Editorial Desk"}
          </h1>
          <p className="mt-2.5 text-sm text-[var(--color-muted-text)] leading-relaxed">
            {page?.excerpt ||
              "Have a technical correction, research preprint tip, or editorial pitch? Connect directly with our editors."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm mb-8 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}

        <ContactForm />
      </div>
    </PublicShell>
  );
}
