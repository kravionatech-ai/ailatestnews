import { connectDB } from "@/lib/db/connection";
import Setting from "@/lib/db/models/setting.model";
import { SettingsEditor } from "@/components/admin/settings/settings-editor";
import {
  getSiteHostname,
  getSiteUrl,
  replaceLegacyHostText,
  resolveEffectiveSiteUrl,
  rewriteLegacyOriginUrl,
} from "@/lib/seo/domain";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await connectDB();
  const rawSettings = await Setting.findOne().lean();
  const activeSiteUrl = getSiteUrl();
  const activeHost = getSiteHostname(activeSiteUrl);

  const parsedRaw: Record<string, any> | null = rawSettings
    ? JSON.parse(JSON.stringify(rawSettings))
    : null;

  if (parsedRaw) {
    parsedRaw.siteUrl = resolveEffectiveSiteUrl(parsedRaw.siteUrl, activeSiteUrl);
    if (parsedRaw.defaultOgImage) {
      parsedRaw.defaultOgImage = rewriteLegacyOriginUrl(parsedRaw.defaultOgImage, activeSiteUrl);
    }
    if (parsedRaw.organization) {
      parsedRaw.organization.url = resolveEffectiveSiteUrl(parsedRaw.organization.url, activeSiteUrl);
      if (parsedRaw.organization.logo) {
        parsedRaw.organization.logo = rewriteLegacyOriginUrl(parsedRaw.organization.logo, activeSiteUrl);
      }
    }
    if (parsedRaw.footer?.copyrightText) {
      parsedRaw.footer.copyrightText = replaceLegacyHostText(
        parsedRaw.footer.copyrightText,
        activeSiteUrl
      );
    }
  }

  const settings = parsedRaw || {
    siteName: "Kraviona AI News",
    tagline: "AI, Technology, Research and Innovation Intelligence",
    siteUrl: activeSiteUrl,
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
      name: "Kraviona AI News",
      url: activeSiteUrl,
      description: "Kraviona AI News — Independent AI, technology, and research intelligence publication.",
      email: "kravionatech@gmail.com",
      socialProfiles: [
        "https://twitter.com/kraviona",
        "https://linkedin.com/company/kraviona",
        "https://github.com/kravionatech-ai",
      ],
    },
    footer: {
      copyrightText: `Kraviona AI News (${activeHost}). All rights reserved.`,
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
        <h1 className="font-display text-2xl font-bold text-[var(--color-heading)]">
          Global System &amp; SEO Configuration
        </h1>
        <p className="text-xs text-[var(--color-muted-text)] mt-1">
          Configure site identity, canonical domains, automated metadata fallback templates, schema metadata, and crawler directives.
        </p>
      </div>

      <SettingsEditor initialSettings={settings} />
    </div>
  );
}
