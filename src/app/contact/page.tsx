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
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Mail className="h-3.5 w-3.5 text-slate-900" />
            <span>Communication Desk // Inquiries &amp; Tips</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            {page?.title || "Contact the Newsroom Desk"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {page?.excerpt ||
              "Have a technical correction, research preprint tip, or editorial proposal? Connect directly with our editors."}
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
