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
  await connectDB();
  const page = await Page.findOne({ slug: "contact" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/contact",
    title: page?.seo?.metaTitle || page?.title || "Contact Editorial Desk | AI Latest News",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Get in touch with the AI Latest News editorial team, submit AI research tips, or inquire about partnership opportunities.",
  });
}

export default async function ContactPage() {
  await connectDB();
  const [pageRaw, settings] = await Promise.all([
    Page.findOne({ slug: "contact" }).lean(),
    getGlobalSettings(),
  ]);
  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] mb-4">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
            {page?.title || "Contact the Editorial Desk"}
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            {page?.excerpt ||
              "Have a technical correction, research preprint tip, or editorial proposal? We'd love to hear from you."}
          </p>
        </div>

        {page?.contentHtml && (
          <div
            className="prose-article text-sm mb-8"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        )}

        <ContactForm />
      </div>
    </PublicShell>
  );
}
