import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Clock, Eye, ChevronRight } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons } from "@/components/blog/share-buttons";
import { AskAIButton } from "@/components/blog/ask-ai-button";
import { Reactions } from "@/components/blog/reactions";
import { CommentSection } from "@/components/blog/comment-section";
import { PostCard } from "@/components/blog/post-card";
import { ArticleAnalyticsTracker } from "@/components/blog/article-analytics-tracker";
import { getPostBySlug } from "@/lib/db/queries/posts";
import { getCommentsByPost } from "@/lib/db/queries/comments";
import { formatDate } from "@/lib/utils";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPostBySlug(slug);

  if (!data?.post) {
    return { title: "Post Not Found | AI Latest News" };
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

export default async function SinglePostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const data = await getPostBySlug(slug);

  if (!data?.post) {
    notFound();
  }

  const { post, relatedPosts } = data;
  const comments = await getCommentsByPost(post._id);

  const siteUrl = getSiteUrl();

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": post.seo?.schemaType || "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      "@type": "Person",
      name: post.author?.name || "AI Latest News Editorial Team",
      url: post.author?.slug ? `${siteUrl}/author/${post.author.slug}` : undefined,
    },
    publisher: {
      "@type": "Organization",
      name: "AI Latest News",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
  };

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
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${siteUrl}/blog/${post.slug}`,
      },
    ],
  };

  return (
    <PublicShell>
      {/* Privacy-safe Client Analytics Tracker */}
      <ArticleAnalyticsTracker postId={String(post._id)} slug={post.slug} />

      {/* Reading Progress Indicator */}
      <ReadingProgress />

      {/* JSON-LD Schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-[var(--foreground-muted)]">
          <Link href="/" className="hover:text-[var(--foreground)]">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/blog" className="hover:text-[var(--foreground)]">Articles</Link>
          {post.category && (
            <>
              <ChevronRight className="h-3 w-3" />
              <Link href={`/category/${post.category.slug}`} className="hover:text-[var(--foreground)]">
                {post.category.name}
              </Link>
            </>
          )}
        </nav>

        {/* Article Header */}
        <header className="max-w-4xl mb-10">
          <div className="flex items-center gap-2 mb-4">
            {post.category && (
              <Link
                href={`/category/${post.category.slug}`}
                className="rounded-lg bg-[var(--accent-light)] px-3 py-1 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
              >
                {post.category.name}
              </Link>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.15]">
            {post.title}
          </h1>

          <p className="mt-4 text-lg text-[var(--foreground-secondary)] leading-relaxed">
            {post.excerpt}
          </p>

          {/* Metadata row */}
          <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--foreground-muted)]">
            <div className="flex items-center gap-3">
              {post.author?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.author.image}
                  alt={post.author.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--background-tertiary)] font-bold text-sm text-[var(--foreground)]">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )}
              <div>
                <p className="font-semibold text-[var(--foreground)] text-sm">
                  {post.author?.name || "Staff Engineer"}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {post.publishedAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(post.publishedAt)}
                    </span>
                  )}
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readingTime} min read
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views || 0} views
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AskAIButton title={post.title} slug={post.slug} />
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        </header>

        {/* Content Layout with sticky TOC */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Main Article Body */}
          <div className="lg:col-span-3">
            {post.coverImage && (
              <div className="mb-10 overflow-hidden rounded-3xl border border-[var(--border)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-auto max-h-[500px] object-cover"
                />
              </div>
            )}

            {/* Prose HTML */}
            <div
              className="prose-article prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>No content written yet.</p>" }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase text-[var(--foreground-muted)] mr-2">
                  Tags:
                </span>
                {post.tags.map((tag: { _id: string; slug: string; name: string }) => (
                  <Link
                    key={tag._id}
                    href={`/tag/${tag.slug}`}
                    className="rounded-lg border border-[var(--border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--foreground-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Applaud Reactions */}
            <div className="mt-8 flex items-center justify-between border-y border-[var(--border)] py-2">
              <Reactions postId={post._id} />
              <div className="flex flex-wrap items-center gap-3">
              <AskAIButton title={post.title} slug={post.slug} />
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
            </div>

            {/* Author Bio Box */}
            {post.author && (
              <div className="mt-12 rounded-3xl border border-[var(--border)] bg-[var(--background-secondary)] p-6 sm:p-8 flex flex-col sm:flex-row gap-5 items-start">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] font-bold text-xl flex-shrink-0">
                  {post.author.name?.charAt(0) || "A"}
                </div>
                <div>
                  <h4 className="text-base font-bold text-[var(--foreground)]">
                    Written by {post.author.name}
                  </h4>
                  <p className="mt-1.5 text-xs text-[var(--foreground-secondary)] leading-relaxed">
                    {post.author.bio ||
                      "Core contributor and technical editor specializing in distributed systems, performance optimization, and Next.js platforms."}
                  </p>
                  {post.author.slug && (
                    <Link
                      href={`/author/${post.author.slug}`}
                      className="mt-3 inline-block text-xs font-bold text-[var(--accent)] hover:underline"
                    >
                      View all articles by {post.author.name} →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            {post.allowComments !== false && (
              <CommentSection postId={post._id} initialComments={comments} />
            )}
          </div>

          {/* Sticky Sidebar (Table of contents) */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <TableOfContents />
            </div>
          </aside>
        </div>

        {/* Related Posts */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[var(--border)]">
            <h3 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-6">
              Recommended Reading
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((r: { _id: string; title: string; slug: string; excerpt: string; readingTime?: number; views?: number; publishedAt?: Date; author?: { name: string; image?: string }; category?: { name: string; slug: string } }) => (
                <PostCard key={r._id} post={r} />
              ))}
            </div>
          </section>
        )}
      </article>
    </PublicShell>
  );
}
