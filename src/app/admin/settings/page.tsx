import { connectDB } from "@/lib/db/connection";
import Setting from "@/lib/db/models/setting.model";
import { SettingsEditor } from "@/components/admin/settings/settings-editor";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await connectDB();
  const rawSettings = await Setting.findOne().lean();

  const settings = rawSettings
    ? JSON.parse(JSON.stringify(rawSettings))
    : {
        siteName: "AI Latest News",
        tagline: "AI news, tools and guides, explained for India",
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://ainews.kraviona.com",
        separator: "|",
        defaultOgImage:
          "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
        language: "en-IN",
        timezone: "Asia/Kolkata",
        templates: {
          post: {
            titleTemplate: "{title} {separator} {site}",
            descriptionTemplate: "{excerpt}",
          },
          category: {
            titleTemplate: "{category} News, Tools & Guides {separator} {site}",
            descriptionTemplate:
              "Comprehensive coverage of {category}: breaking news, model benchmarks, and developer guides.",
          },
          tag: {
            titleTemplate: "{title} AI Updates & Articles {separator} {site}",
            descriptionTemplate:
              "Latest news, articles and technical breakdowns tagged with #{title} on {site}.",
          },
          page: {
            titleTemplate: "{title} {separator} {site}",
            descriptionTemplate: "{excerpt}",
          },
          author: {
            titleTemplate: "{author}, AI Author {separator} {site}",
            descriptionTemplate:
              "Read technical articles, model evaluations, and research by {author} at {site}.",
          },
        },
        organization: {
          name: "AI Latest News",
          url: "https://ainews.kraviona.com",
          description: "India's premier artificial intelligence intelligence platform.",
          email: "kravionatech@gmail.com",
          socialProfiles: [
            "https://twitter.com/kraviona",
            "https://linkedin.com/company/kraviona",
            "https://github.com/kravionatech-ai",
          ],
        },
        verification: {},
        indexNow: {
          apiKey: "ailatestnews_indexnow_key_2026",
          autoSubmitOnPublish: true,
        },
      };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Global System &amp; SEO Configuration
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Configure site identity, canonical domains, automated metadata fallback templates, schema metadata, and crawler directives.
        </p>
      </div>

      <SettingsEditor initialSettings={settings} />
    </div>
  );
}
