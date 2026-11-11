import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicShell } from "@/components/layout/public-shell";
import { ArticleAnalyticsTracker } from "@/components/blog/article-analytics-tracker";
import { UpNextSlideup } from "@/components/interactive/up-next-slideup";
import { ArticleLayoutDispatcher } from "@/components/blog/article-layouts/article-layout-dispatcher";
import { getPostBySlug, getAllPostSlugs } from "@/lib/db/queries/posts";
import { getCommentsByPost } from "@/lib/db/queries/comments";
import { getActiveDesignTokens } from "@/lib/design-tokens/service";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";
import type { ArticleLayoutTemplate } from "@/lib/design-tokens/types";

export interface PostPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{
    preview?: string;
    token?: string;
    template?: string;
    [key: string]: string | string[] | undefined;
  }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = await getAllPostSlugs();
    return posts.map((p: { slug: string }) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isPreview =
    resolvedSearchParams.preview === "true" ||
    resolvedSearchParams.preview === "1" ||
    Boolean(resolvedSearchParams.token);
  const previewToken =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
      : undefined;

  const data = await getPostBySlug(slug, isPreview, previewToken);

  if (!data?.post) {
    return { title: "Post Not Found | Kraviona AI News" };
  }

  const post = data.post;
  return buildEntityMetadata({
    entityType: "post",
    entitySeo: post.seo,
    path: `/blog/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt,
    category: post.category?.name,
    author: post.author?.name,
    coverImage: post.coverImage,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
  });
}

export default async function SinglePostPage({
  params,
  searchParams,
}: PostPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const isPreview =
    resolvedSearchParams.preview === "true" ||
    resolvedSearchParams.preview === "1" ||
    Boolean(resolvedSearchParams.token);
  const previewToken =
    typeof resolvedSearchParams.token === "string"
      ? resolvedSearchParams.token
      : undefined;

  const data = await getPostBySlug(slug, isPreview, previewToken);

  if (!data?.post) {
    notFound();
  }

  const { post, relatedPosts, latestPosts = [], prevPost = null, nextPost = null } = data;
  const comments = await getCommentsByPost(String(post._id));
  const tokens = await getActiveDesignTokens();

  // Template resolution hierarchy:
  // query param override -> post model override -> active design token default -> fallback
  const templateOverride = resolvedSearchParams.template as
    | ArticleLayoutTemplate
    | undefined;
  const selectedTemplate: ArticleLayoutTemplate =
    templateOverride ||
    (post as { layoutTemplate?: ArticleLayoutTemplate }).layoutTemplate ||
    tokens?.article?.defaultTemplate ||
    "standard-editorial";

  const siteUrl = getSiteUrl();
  const rawPubDate = post.publishedAt || post.createdAt;
  const parsedPubDate = rawPubDate ? new Date(rawPubDate) : null;
  const validPublishIso =
    parsedPubDate && !isNaN(parsedPubDate.getTime())
      ? parsedPubDate.toISOString()
      : undefined;

  const rawModDate = post.updatedAt || rawPubDate;
  const parsedModDate = rawModDate ? new Date(rawModDate) : null;
  const validModifiedIso =
    parsedModDate && !isNaN(parsedModDate.getTime())
      ? parsedModDate.toISOString()
      : validPublishIso;

  const rawAuthorName = post.author?.name?.trim();
  const rawAuthorRole = post.author?.role?.trim();
  const isGenericAuthRole =
    !rawAuthorRole || /^(admin|user|subscriber)$/i.test(rawAuthorRole);
  const isOrgAuthor =
    Boolean(rawAuthorName) &&
    /(editorial\s*team|newsroom|editorial\s*desk)/i.test(rawAuthorName!);
  const authorSameAs = [
    post.author?.website,
    post.author?.socialLinks?.twitter,
    post.author?.socialLinks?.github,
    post.author?.socialLinks?.linkedin,
  ].filter(Boolean);

  const authorSchema = rawAuthorName
    ? isOrgAuthor
      ? {
          "@type": "Organization",
          name: rawAuthorName,
          ...(post.author?.slug ? { url: `${siteUrl}/author/${post.author.slug}` } : {}),
        }
      : {
          "@type": "Person",
          name: rawAuthorName,
          ...(post.author?.slug ? { url: `${siteUrl}/author/${post.author.slug}` } : {}),
          ...(!isGenericAuthRole ? { jobTitle: rawAuthorRole } : {}),
          ...(post.author?.bio ? { description: post.author.bio } : {}),
          ...(post.author?.image
            ? {
                image: {
                  "@type": "ImageObject",
                  url: post.author.image,
                },
              }
            : {}),
          ...(authorSameAs.length > 0 ? { sameAs: authorSameAs } : {}),
        }
    : {
        "@type": "NewsMediaOrganization",
        "@id": `${siteUrl}/#organization`,
        name: "Kraviona AI News",
        url: siteUrl,
      };

  const tagKeywords =
    Array.isArray(post.tags) && post.tags.length > 0
      ? post.tags
          .map((t: { name?: string }) => t?.name?.trim())
          .filter(Boolean)
          .join(", ")
      : undefined;

  // 1. JSON-LD Article Schema (NewsArticle vs TechArticle)
  const schemaType = post.seo?.schemaType || "NewsArticle";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: post.seo?.metaTitle || post.title,
    ...(post.seo?.metaDescription || post.excerpt
      ? { description: post.seo?.metaDescription || post.excerpt }
      : {}),
    url: `${siteUrl}/blog/${post.slug}`,
    inLanguage: post.locale || "en",
    isAccessibleForFree: true,
    ...(post.coverImage
      ? {
          image: [
            {
              "@type": "ImageObject",
              url: post.coverImage,
              ...(post.coverImageCaption || post.coverImageAlt
                ? { caption: post.coverImageCaption || post.coverImageAlt }
                : {}),
            },
          ],
        }
      : {}),
    ...(validPublishIso ? { datePublished: validPublishIso } : {}),
    ...(validModifiedIso ? { dateModified: validModifiedIso } : {}),
    author: authorSchema,
    publisher: {
      "@type": "NewsMediaOrganization",
      "@id": `${siteUrl}/#organization`,
      name: "Kraviona AI News",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
      },
    },
    ...(post.category?.name ? { articleSection: post.category.name } : {}),
    ...(tagKeywords ? { keywords: tagKeywords } : {}),
    isPartOf: { "@id": `${siteUrl}/#website` },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  };

  // 2. JSON-LD BreadcrumbList Schema
  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Articles",
        item: `${siteUrl}/blog`,
      },
      ...(post.category
        ? [
            {
              "@type": "ListItem",
              position: 3,
              name: post.category.name,
              item: `${siteUrl}/category/${post.category.slug}`,
            },
            {
              "@type": "ListItem",
              position: 4,
              name: post.title,
              item: `${siteUrl}/blog/${post.slug}`,
            },
          ]
        : [
            {
              "@type": "ListItem",
              position: 3,
              name: post.title,
              item: `${siteUrl}/blog/${post.slug}`,
            },
          ]),
    ],
  };

  // 3. JSON-LD FAQPage Schema (if post has faqs or schemaOverrides)
  let faqJsonLd: Record<string, unknown> | null = null;
  if (post.faqs && Array.isArray(post.faqs) && post.faqs.length > 0) {
    faqJsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: post.faqs.map(
        (f: { question: string; answer: string }) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })
      ),
    };
  } else if (
    post.seo?.schemaOverrides &&
    typeof post.seo.schemaOverrides === "string" &&
    post.seo.schemaOverrides.trim().startsWith("{")
  ) {
    try {
      const parsedOverride = JSON.parse(post.seo.schemaOverrides);
      if (parsedOverride["@type"] === "FAQPage") {
        faqJsonLd = parsedOverride;
      }
    } catch {
      // safe fallback
    }
  }

  return (
    <PublicShell headlines={latestPosts}>
      {/* Client Analytics Tracker */}
      <ArticleAnalyticsTracker postId={String(post._id)} slug={post.slug} />

      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}

      {/* Delegate cleanly to ArticleLayoutDispatcher */}
      <ArticleLayoutDispatcher
        post={post}
        relatedPosts={relatedPosts}
        latestPosts={latestPosts}
        prevPost={prevPost}
        nextPost={nextPost}
        comments={comments}
        tokens={tokens}
        template={selectedTemplate}
      />

      {/* Continuous Reading Slide-up Drawer (for templates without embedded slideup) */}
      {selectedTemplate === "minimal-reading" && (
        <UpNextSlideup
          currentSlug={post.slug}
          nextPost={nextPost || relatedPosts?.[0] || null}
        />
      )}
    </PublicShell>
  );
}