"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db/connection";
import { Page, AuditLog, Redirect } from "@/lib/db/models";
import { auth } from "@/lib/auth/auth";
import { slugify } from "@/lib/utils";
import { triggerSeoRevalidation } from "@/lib/seo/revalidate-and-ping";
import type { ISeoMetadata } from "@/lib/seo/types";

export async function ensureCorePagesExist() {
  await connectDB();
  const corePages = [
    {
      title: "AI Latest News - Home",
      slug: "home",
      excerpt: "Latest AI news, model launches, tools, and comparisons explained for India.",
      template: "landing",
      status: "published",
      showInMenu: true,
      showInFooter: true,
      order: 1,
      seo: {
        metaTitle: "AI Latest News | News, Tools and Guides, Explained for India",
        metaDescription:
          "India's dedicated artificial intelligence intelligence portal. In-depth coverage of LLMs, model releases, tool evaluations, and enterprise AI.",
        schemaType: "WebPage",
        sitemap: { include: true, priority: 1.0, changefreq: "daily" },
      },
    },
    {
      title: "All Articles & Dispatches",
      slug: "blog",
      excerpt: "Chronological and filterable repository of all published AI dispatches and guides.",
      template: "directory",
      status: "published",
      showInMenu: true,
      showInFooter: true,
      order: 2,
      seo: {
        metaTitle: "All Articles & Dispatches | AI Latest News",
        metaDescription:
          "Browse comprehensive AI articles, model benchmark teardowns, tools guides, and Indian sovereign compute intelligence.",
        schemaType: "CollectionPage",
        sitemap: { include: true, priority: 0.9, changefreq: "daily" },
      },
    },
    {
      title: "About AI Latest News",
      slug: "about",
      excerpt: "About the AI Latest News editorial team, mission, and technology journalism standards.",
      template: "default",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 3,
      seo: {
        metaTitle: "About AI Latest News | Editorial Mission & Standards",
        metaDescription:
          "Learn about AI Latest News, India's dedicated artificial intelligence editorial platform, model benchmark standards, and technology journalism values.",
        schemaType: "AboutPage",
        sitemap: { include: true, priority: 0.7, changefreq: "monthly" },
      },
    },
    {
      title: "Editorial Policy & Standards",
      slug: "editorial-policy",
      excerpt: "Our commitment to independent, verified artificial intelligence reporting.",
      template: "legal",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 4,
      seo: {
        metaTitle: "Editorial Policy & Standards | AI Latest News",
        metaDescription:
          "Read the editorial guidelines, benchmarking rigor, and journalistic integrity standards of AI Latest News.",
        schemaType: "WebPage",
        sitemap: { include: true, priority: 0.6, changefreq: "monthly" },
      },
    },
    {
      title: "Contact Editorial Desk",
      slug: "contact",
      excerpt: "Get in touch with our journalists, submit tip-offs, or inquire about partnerships.",
      template: "default",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 5,
      seo: {
        metaTitle: "Contact Editorial Desk | AI Latest News",
        metaDescription:
          "Contact the AI Latest News editorial team in India, submit AI research tips, or pitch news dispatches.",
        schemaType: "ContactPage",
        sitemap: { include: true, priority: 0.6, changefreq: "monthly" },
      },
    },
    {
      title: "AI Tools Directory",
      slug: "ai-tools",
      excerpt: "Curated directory of evaluated and benchmarked artificial intelligence tools.",
      template: "directory",
      status: "published",
      showInMenu: true,
      showInFooter: true,
      order: 6,
      seo: {
        metaTitle: "AI Tools Directory 2026 | Best AI Software Ranked",
        metaDescription:
          "Explore verified AI tools for coding, productivity, image generation, and workflow automation evaluated on Indian workflows.",
        schemaType: "CollectionPage",
        sitemap: { include: true, priority: 0.8, changefreq: "weekly" },
      },
    },
    {
      title: "Model Launches Timeline",
      slug: "model-launches",
      excerpt: "Chronological tracker of frontier foundation models and open weights releases.",
      template: "directory",
      status: "published",
      showInMenu: true,
      showInFooter: true,
      order: 7,
      seo: {
        metaTitle: "AI Model Launches Tracker 2026 | Frontier & Open Weights",
        metaDescription:
          "Real-time timeline and benchmark comparisons for recent AI model releases from OpenAI, Anthropic, DeepSeek, and Indian labs.",
        schemaType: "CollectionPage",
        sitemap: { include: true, priority: 0.8, changefreq: "weekly" },
      },
    },
    {
      title: "India AI Ecosystem Hub",
      slug: "india-ai",
      excerpt: "Dedicated coverage of India's sovereign compute mission, BharatGen, and local startups.",
      template: "landing",
      status: "published",
      showInMenu: true,
      showInFooter: true,
      order: 8,
      seo: {
        metaTitle: "India AI Hub | Sovereign Compute, Sarvam, Krutrim & Policy",
        metaDescription:
          "In-depth reporting on IndiaAI Mission, GPU procurement clusters, Sarvam, Krutrim, and indigenous Indic AI technologies.",
        schemaType: "CollectionPage",
        sitemap: { include: true, priority: 0.8, changefreq: "weekly" },
      },
    },
    {
      title: "AI Intelligence Newsletter",
      slug: "newsletter",
      excerpt: "Curated weekly AI dispatches and benchmark digests.",
      template: "landing",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 9,
      seo: {
        metaTitle: "AI Latest News Intelligence Newsletter",
        metaDescription:
          "Curated weekly AI dispatches, foundation model benchmark reports, and Indian compute intelligence delivered directly to your inbox.",
        schemaType: "WebPage",
        sitemap: { include: true, priority: 0.6, changefreq: "monthly" },
      },
    },
    {
      title: "Search AI Archives",
      slug: "search",
      excerpt: "Search engine and inquiry index across all AI models, tools, and dispatches.",
      template: "default",
      status: "published",
      showInMenu: false,
      showInFooter: false,
      order: 10,
      seo: {
        metaTitle: "Search AI News, Models, Tools & Benchmarks | AI Latest News",
        metaDescription:
          "Search the AI Latest News archive for breaking AI stories, Indian compute mission updates, model releases, and technical comparisons.",
        schemaType: "SearchResultsPage",
        sitemap: { include: false, priority: 0.5, changefreq: "weekly" },
      },
    },
    {
      title: "Publication Timeline Archive",
      slug: "archive",
      excerpt: "Chronological publication timeline grouped by year and month.",
      template: "default",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 11,
      seo: {
        metaTitle: "Publication Archive | AI Latest News",
        metaDescription:
          "Explore our chronological publication timeline of AI dispatches, foundation model launches, and Indian AI benchmarks.",
        schemaType: "CollectionPage",
        sitemap: { include: true, priority: 0.5, changefreq: "weekly" },
      },
    },
    {
      title: "Privacy Policy",
      slug: "privacy",
      excerpt: "User data protection and privacy compliance details.",
      template: "legal",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 12,
      seo: {
        metaTitle: "Privacy Policy | AI Latest News",
        metaDescription: "Our commitment to reader privacy and transparent data practices.",
        schemaType: "WebPage",
        sitemap: { include: true, priority: 0.3, changefreq: "yearly" },
      },
    },
    {
      title: "Terms of Service",
      slug: "terms",
      excerpt: "Terms governing use of AI Latest News services and publications.",
      template: "legal",
      status: "published",
      showInMenu: false,
      showInFooter: true,
      order: 13,
      seo: {
        metaTitle: "Terms of Service | AI Latest News",
        metaDescription:
          "Terms and conditions governing the use of AI Latest News articles and code snippets.",
        schemaType: "WebPage",
        sitemap: { include: true, priority: 0.3, changefreq: "yearly" },
      },
    },
  ];

  for (const pageData of corePages) {
    const existing = await Page.findOne({ slug: pageData.slug });
    if (!existing) {
      await Page.create(pageData);
    }
  }
}

export async function createPageAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || title;
  const slug = slugify(rawSlug);
  const excerpt = (formData.get("excerpt") as string)?.trim() || "";
  const contentHtml = (formData.get("contentHtml") as string) || "";
  const template = (formData.get("template") as string) || "default";
  const status = (formData.get("status") as string) || "published";
  const showInMenu = formData.get("showInMenu") === "true";
  const showInFooter = formData.get("showInFooter") === "true";
  const order = Number(formData.get("order") || 0);

  const blocksRaw = formData.get("blocks") as string;
  const blocks = blocksRaw ? JSON.parse(blocksRaw) : [];

  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  if (!seoPayload.metaTitle) seoPayload.metaTitle = title;
  if (!seoPayload.metaDescription) seoPayload.metaDescription = excerpt;
  if (!seoPayload.schemaType) seoPayload.schemaType = "WebPage";

  if (!title || !slug) {
    return { success: false, error: "Title and slug are required" };
  }

  const existing = await Page.findOne({ slug });
  if (existing) {
    return { success: false, error: "A page with this slug already exists" };
  }

  const page = await Page.create({
    title,
    slug,
    excerpt,
    contentHtml,
    blocks,
    template,
    status,
    showInMenu,
    showInFooter,
    order,
    seo: seoPayload,
  });

  await AuditLog.create({
    user: session.user.id,
    action: "create",
    resource: "Page",
    resourceId: page._id,
    details: { title, slug, template },
  });

  const pagePath = slug === "home" ? "/" : `/${slug}`;
  await triggerSeoRevalidation({
    path: pagePath,
    forceIndexNow: status === "published",
  });

  revalidatePath("/admin/pages");
  revalidatePath(pagePath);

  return { success: true, page: JSON.parse(JSON.stringify(page)) };
}

export async function updatePageAction(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();

  const page = await Page.findById(id);
  if (!page) return { success: false, error: "Page not found" };

  const title = (formData.get("title") as string)?.trim();
  const rawSlug = (formData.get("slug") as string)?.trim() || title;
  const slug = slugify(rawSlug);
  const excerpt = (formData.get("excerpt") as string)?.trim() || "";
  const contentHtml = (formData.get("contentHtml") as string) || "";
  const template = (formData.get("template") as string) || page.template;
  const status = (formData.get("status") as string) || page.status;
  const showInMenu = formData.get("showInMenu") === "true";
  const showInFooter = formData.get("showInFooter") === "true";
  const order = Number(formData.get("order") || 0);

  const blocksRaw = formData.get("blocks") as string;
  const blocks = blocksRaw ? JSON.parse(blocksRaw) : page.blocks || [];

  const oldSlug = page.slug;
  if (oldSlug && oldSlug !== slug && oldSlug !== "home") {
    const existingRedirect = await Redirect.findOne({ from: `/${oldSlug}` });
    if (!existingRedirect) {
      await Redirect.create({
        from: `/${oldSlug}`,
        to: `/${slug}`,
        type: 301,
        createdBy: session.user.id,
        note: `Auto-generated when page '${page.title}' was renamed to '${slug}'`,
      });
    }
  }

  const seoRaw = formData.get("seo") as string;
  let seoPayload: ISeoMetadata = page.seo || {};
  if (seoRaw) {
    try {
      seoPayload = JSON.parse(seoRaw);
    } catch {
      // fallback
    }
  }

  page.title = title;
  page.slug = slug;
  page.excerpt = excerpt;
  page.contentHtml = contentHtml;
  page.blocks = blocks;
  page.template = template as typeof page.template;
  page.status = status as typeof page.status;
  page.showInMenu = showInMenu;
  page.showInFooter = showInFooter;
  page.order = order;
  page.seo = seoPayload;

  await page.save();

  await AuditLog.create({
    user: session.user.id,
    action: "update",
    resource: "Page",
    resourceId: page._id,
    details: { title, slug, template, slugChanged: oldSlug !== slug },
  });

  const pagePath = slug === "home" ? "/" : `/${slug}`;
  await triggerSeoRevalidation({
    path: pagePath,
    forceIndexNow: status === "published",
  });

  revalidatePath("/admin/pages");
  revalidatePath(pagePath);

  return { success: true, page: JSON.parse(JSON.stringify(page)) };
}

export async function deletePageAction(id: string) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  const page = await Page.findById(id);
  if (!page) return { success: false, error: "Page not found" };

  if (page.slug === "home") {
    return { success: false, error: "The Home page cannot be deleted." };
  }

  await Page.findByIdAndDelete(id);

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "Page",
    resourceId: id,
    details: { title: page.title, slug: page.slug },
  });

  revalidatePath("/admin/pages");
  return { success: true };
}

export async function bulkDeletePagesAction(ids: string[]) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  await connectDB();
  // Ensure home page is never deleted
  await Page.deleteMany({ _id: { $in: ids }, slug: { $ne: "home" } });

  await AuditLog.create({
    user: session.user.id,
    action: "delete",
    resource: "Page",
    details: { bulkAction: "delete", count: ids.length },
  });

  revalidatePath("/admin/pages");
  return { success: true };
}
