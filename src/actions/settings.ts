"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Setting, AuditLog } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";

export async function saveGlobalSettingsAction(formData: FormData) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized. Please log in as an administrator." };
    }

    await connectDB();

    const siteName = (formData.get("siteName") as string)?.trim() || "AI Latest News";
    const tagline =
      (formData.get("tagline") as string)?.trim() ||
      "AI news, tools and guides, explained for India";
    const siteUrl =
      (formData.get("siteUrl") as string)?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://ailatestnews.in";
    const separator = (formData.get("separator") as string)?.trim() || "|";
    const defaultOgImage =
      (formData.get("defaultOgImage") as string)?.trim() ||
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80";
    const logo = (formData.get("logo") as string)?.trim() || "";
    const favicon = (formData.get("favicon") as string)?.trim() || "/favicon.ico";
    const language = (formData.get("language") as string)?.trim() || "en-IN";
    const timezone = (formData.get("timezone") as string)?.trim() || "Asia/Kolkata";

    // SEO Templates
    const postTitleTemplate =
      (formData.get("postTitleTemplate") as string)?.trim() || "{title} {separator} {site}";
    const postDescTemplate =
      (formData.get("postDescTemplate") as string)?.trim() || "{excerpt}";
    const categoryTitleTemplate =
      (formData.get("categoryTitleTemplate") as string)?.trim() ||
      "{category} News, Tools & Guides {separator} {site}";
    const categoryDescTemplate =
      (formData.get("categoryDescTemplate") as string)?.trim() ||
      "Comprehensive coverage of {category}: breaking news, model benchmarks, and developer guides.";
    const tagTitleTemplate =
      (formData.get("tagTitleTemplate") as string)?.trim() ||
      "{title} AI Updates & Articles {separator} {site}";
    const tagDescTemplate =
      (formData.get("tagDescTemplate") as string)?.trim() ||
      "Latest news, articles and technical breakdowns tagged with #{title} on {site}.";
    const pageTitleTemplate =
      (formData.get("pageTitleTemplate") as string)?.trim() || "{title} {separator} {site}";
    const pageDescTemplate =
      (formData.get("pageDescTemplate") as string)?.trim() || "{excerpt}";
    const authorTitleTemplate =
      (formData.get("authorTitleTemplate") as string)?.trim() ||
      "{author}, AI Author {separator} {site}";
    const authorDescTemplate =
      (formData.get("authorDescTemplate") as string)?.trim() ||
      "Read technical articles, model evaluations, and research by {author} at {site}.";

    // Organization
    const orgName = (formData.get("orgName") as string)?.trim() || siteName;
    const orgUrl = (formData.get("orgUrl") as string)?.trim() || siteUrl;
    const orgDescription = (formData.get("orgDescription") as string)?.trim() || tagline;
    const orgEmail = (formData.get("orgEmail") as string)?.trim() || "editorial@ailatestnews.in";
    const socialRaw = (formData.get("socialProfiles") as string)?.trim() || "";
    const socialProfiles = socialRaw
      ? socialRaw.split("\n").map((s) => s.trim()).filter(Boolean)
      : [];

    // Verification & Integrations
    const googleVerification = (formData.get("googleVerification") as string)?.trim() || "";
    const bingVerification = (formData.get("bingVerification") as string)?.trim() || "";
    const indexNowApiKey = (formData.get("indexNowApiKey") as string)?.trim() || "";
    const autoIndexNow = formData.get("autoIndexNow") === "on" || formData.get("autoIndexNow") === "true";

    const analyticsId = (formData.get("analyticsId") as string)?.trim() || "";
    const robotsTxt = (formData.get("robotsTxt") as string)?.trim() || "";

    // Dynamic Navigation & Footer
    const navigationRaw = formData.get("navigation") as string;
    let navigation;
    if (navigationRaw) {
      try {
        navigation = JSON.parse(navigationRaw);
      } catch {
        // fallback
      }
    }

    const footerRaw = formData.get("footer") as string;
    let footer;
    if (footerRaw) {
      try {
        footer = JSON.parse(footerRaw);
      } catch {
        // fallback
      }
    }

    const updateDoc: any = {
      siteName,
      tagline,
      siteUrl,
      separator,
      defaultOgImage,
      logo,
      favicon,
      language,
      timezone,
      templates: {
        post: {
          titleTemplate: postTitleTemplate,
          descriptionTemplate: postDescTemplate,
          defaultSchemaType: "NewsArticle",
          defaultPriority: 0.8,
          defaultChangefreq: "daily",
        },
        category: {
          titleTemplate: categoryTitleTemplate,
          descriptionTemplate: categoryDescTemplate,
          defaultSchemaType: "CollectionPage",
          defaultPriority: 0.7,
          defaultChangefreq: "weekly",
        },
        tag: {
          titleTemplate: tagTitleTemplate,
          descriptionTemplate: tagDescTemplate,
          defaultSchemaType: "CollectionPage",
          defaultPriority: 0.6,
          defaultChangefreq: "weekly",
        },
        page: {
          titleTemplate: pageTitleTemplate,
          descriptionTemplate: pageDescTemplate,
          defaultSchemaType: "WebPage",
          defaultPriority: 0.7,
          defaultChangefreq: "monthly",
        },
        author: {
          titleTemplate: authorTitleTemplate,
          descriptionTemplate: authorDescTemplate,
          defaultSchemaType: "ProfilePage",
          defaultPriority: 0.6,
          defaultChangefreq: "monthly",
        },
      },
      organization: {
        name: orgName,
        url: orgUrl,
        logo: logo || `${siteUrl}/logo.png`,
        description: orgDescription,
        email: orgEmail,
        socialProfiles,
      },
      verification: {
        google: googleVerification,
        bing: bingVerification,
      },
      indexNow: {
        apiKey: indexNowApiKey,
        autoSubmitOnPublish: autoIndexNow,
      },
      analyticsId,
      robotsTxt,
    };

    if (navigation) {
      updateDoc.navigation = navigation;
    }
    if (footer) {
      updateDoc.footer = footer;
    }

    const savedSettings = await Setting.findOneAndUpdate({}, updateDoc, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    await AuditLog.create({
      user: session.user.id,
      action: "update",
      resource: "Setting",
      resourceId: savedSettings._id,
      details: { siteName, siteUrl },
    });

    // Revalidate affected cache paths
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
    revalidatePath("/feed.xml");

    return {
      success: true,
      settings: JSON.parse(JSON.stringify(savedSettings)),
      message: "Global settings successfully updated and revalidated.",
    };
  } catch (err: any) {
    console.error("[saveGlobalSettingsAction Error]", err);
    return { success: false, error: err.message || "Failed to update settings" };
  }
}
