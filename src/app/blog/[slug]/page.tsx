import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Calendar,
  Clock,
  Eye,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { ShareButtons } from "@/components/blog/share-buttons";
import { AskAIButton } from "@/components/blog/ask-ai-button";
import { Reactions } from "@/components/blog/reactions";
import { CommentSection } from "@/components/blog/comment-section";
import { PostCard } from "@/components/blog/post-card";
import { ArticleAnalyticsTracker } from "@/components/blog/article-analytics-tracker";
import { ReadingControlsBar } from "@/components/interactive/reading-controls-bar";
import { KeyTakeawaysBox } from "@/components/interactive/key-takeaways-box";
import { CommunityPollWidget } from "@/components/interactive/community-poll-widget";
import { UpNextSlideup } from "@/components/interactive/up-next-slideup";
import { getPostBySlug, getAllPostSlugs } from "@/lib/db/queries/posts";
import { getCommentsByPost } from "@/lib/db/queries/comments";
import { formatDate } from "@/lib/utils";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const posts = await getAllPostSlugs();
    return posts.map((p: { slug: string }) => ({ slug: p.slug }));
  } catch (error) {
    return [];
  }
}

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
  const publishDate = post.publishedAt ? new Date(post.publishedAt) : new Date(post.createdAt);
  const updatedDate = post.updatedAt ? new Date(post.updatedAt) : publishDate;
  const isUpdated = updatedDate.getTime() - publishDate.getTime() > 86400000; // More than 24h difference

  // JSON-LD NewsArticle Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": post.seo?.schemaType || "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    image: post.coverImage ? [post.coverImage] : [`${siteUrl}/logo.png`],
    datePublished: publishDate.toISOString(),
    dateModified: updatedDate.toISOString(),
    author: {
      "@type": "Person",
      name: post.author?.name || "AI Latest News Editorial Team",
      url: post.author?.slug ? `${siteUrl}/author/${post.author.slug}` : `${siteUrl}/about`,
      jobTitle: post.author?.role || "Technology Journalist & Systems Engineer",
    },
    publisher: {
      "@type": "NewsMediaOrganization",
      name: "AI Latest News",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
        width: 512,
        height: 512,
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

  return (
    <PublicShell>
      {/* Client Analytics Tracker */}
      <ArticleAnalyticsTracker postId={String(post._id)} slug={post.slug} />

      {/* Reading Progress Bar */}
      <ReadingProgress />

      {/* Structured Data Scripts */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
          <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <Link href="/blog" className="hover:text-slate-900 transition-colors">Articles</Link>
          {post.category && (
            <>
              <ChevronRight className="h-3 w-3 text-slate-400" />
              <Link href={`/category/${post.category.slug}`} className="hover:text-slate-900 transition-colors">
                {post.category.name}
              </Link>
            </>
          )}
        </nav>

        {/* Editorial Article Header */}
        <header className="max-w-4xl mb-8">
          {post.category && (
            <div className="mb-3">
              <Link
                href={`/category/${post.category.slug}`}
                className="font-mono text-xs font-bold uppercase tracking-wider text-rose-600 hover:text-rose-700 transition-colors"
              >
                {post.category.name}
              </Link>
            </div>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-slate-900 leading-[1.12]">
            {post.title}
          </h1>

          <p className="mt-4 text-lg sm:text-xl font-serif text-slate-700 leading-relaxed">
            {post.excerpt}
          </p>

          {/* Author Byline & Timestamps Row */}
          <div className="mt-6 pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              {post.author?.image ? (
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-slate-200 shrink-0">
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-mono font-bold text-sm text-white shrink-0">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={post.author?.slug ? `/author/${post.author.slug}` : "/about"}
                    className="font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                  >
                    By {post.author?.name || "AI Latest News Editorial Staff"}
                  </Link>
                  <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {post.author?.role || "Staff Editor"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Published {formatDate(publishDate)}
                  </span>
                  {isUpdated && (
                    <span className="text-slate-400">
                      (Updated {formatDate(updatedDate)})
                    </span>
                  )}
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readingTime} min read
                    </span>
                  )}
                  {typeof post.views === "number" && post.views >= 10 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views.toLocaleString()} reads
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <AskAIButton title={post.title} slug={post.slug} />
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        </header>

        {/* Reading Controls Toolbar */}
        <ReadingControlsBar
          postId={String(post._id)}
          slug={post.slug}
          title={post.title}
          readingTime={post.readingTime || 6}
        />

        {/* 12-Column Editorial Grid (8 cols main article + 4 cols sticky sidebar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main Article Column (lg:col-span-8) */}
          <div className="lg:col-span-8">
            {/* Featured Hero Photo */}
            {post.coverImage && (
              <figure className="mb-8">
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 shadow-2xs">
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2.5 text-xs text-slate-500 flex items-center justify-between px-1">
                  <span>{post.coverImageAlt || post.title}</span>
                  <span className="font-mono text-[10px] uppercase text-slate-400">
                    Source: Verified Primary Asset
                  </span>
                </figcaption>
              </figure>
            )}

            {/* 60-Second Executive Briefing */}
            <KeyTakeawaysBox
              title={post.title}
              excerpt={post.excerpt}
            />

            {/* Editorial Trust & Primary Source Verification Banner */}
            <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700 flex items-start gap-3 shadow-2xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  Primary Source Verified &amp; Fact-Checked
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  All claims, architectural disclosures, benchmark numbers, and policy statements cited in this dispatch are corroborated with primary documentation (official whitepapers, GitHub source weights, or Indian government gazettes).
                </p>
              </div>
            </div>

            {/* Prose Body */}
            <div
              className="prose-article prose-slate max-w-none text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>Dispatch details coming soon.</p>" }}
            />

            {/* Tags / Entity Taxonomy Strip */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
                  Topics:
                </span>
                {post.tags.map((tag: { _id: string; slug: string; name: string }) => (
                  <Link
                    key={tag._id}
                    href={`/tag/${tag.slug}`}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-mono font-medium text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors shadow-2xs"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Bottom Reactions & Engagement Strip */}
            <div className="mt-8 flex items-center justify-between border-y border-slate-200 py-3">
              <Reactions postId={post._id} />
              <div className="flex items-center gap-2">
                <AskAIButton title={post.title} slug={post.slug} />
                <ShareButtons title={post.title} slug={post.slug} />
              </div>
            </div>

            {/* Author Newsroom Bio Card */}
            {post.author && (
              <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row gap-5 items-start shadow-2xs">
                {post.author.image ? (
                  <div className="relative h-14 w-14 overflow-hidden rounded-full border border-slate-200 shrink-0">
                    <Image
                      src={post.author.image}
                      alt={post.author.name || "Author"}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 font-mono font-bold text-white text-lg shrink-0">
                    {post.author.name?.charAt(0) || "A"}
                  </div>
                )}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">
                      About {post.author.name}
                    </h3>
                    <span className="font-mono text-[10px] uppercase text-slate-500">
                      {post.author.role || "Technology Journalist"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {post.author.bio ||
                      "Technical editor and systems researcher covering foundation models, GPU compute economics, and sovereign AI initiatives across India."}
                  </p>
                  {post.author.slug && (
                    <Link
                      href={`/author/${post.author.slug}`}
                      className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-slate-900 hover:text-indigo-600 transition-colors pt-1"
                    >
                      View all dispatches by {post.author.name} →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Comments */}
            {post.allowComments !== false && (
              <div className="mt-10">
                <CommentSection postId={post._id} initialComments={comments} />
              </div>
            )}
          </div>

          {/* Sticky Sidebar: Table of Contents & Editorial Dispatches (lg:col-span-4) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              <TableOfContents />

              {/* Newsroom Mission Quick Box */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-2 pb-2 border-b border-slate-100">
                  <BookOpen className="h-3.5 w-3.5 text-slate-900" />
                  <span>Editorial Standards</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  AI Latest News enforces strict technical verification protocols. We never accept sponsored benchmark modifications, undisclosed commercial partnerships, or unverified claims.
                </p>
                <Link
                  href="/editorial-policy"
                  className="mt-3 inline-block font-mono text-[11px] font-bold uppercase text-slate-900 hover:text-indigo-600 underline"
                >
                  Read Editorial Policy →
                </Link>
              </div>

              {/* Community Reader Poll in Sidebar */}
              <CommunityPollWidget
                pollId={`poll-${post.slug}`}
                question="Will open-weight reasoning models (DeepSeek, Llama) replace closed APIs in your stack by 2027?"
              />
            </div>
          </aside>
        </div>

        {/* Recommended Reading Strip */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-slate-200" aria-label="Related Dispatches">
            <div className="flex items-end justify-between mb-8 pb-3 border-b border-slate-900">
              <div>
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Related Intelligence
                </span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                  Recommended Reading
                </h2>
              </div>
              <Link
                href="/blog"
                className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors"
              >
                All Articles →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {relatedPosts.map((r: { _id: string; title: string; slug: string; excerpt: string; readingTime?: number; views?: number; publishedAt?: Date; author?: { name: string; image?: string }; category?: { name: string; slug: string } }) => (
                <PostCard key={r._id} post={r} />
              ))}
            </div>
          </section>
        )}
      </article>

      {/* Continuous Reading Slide-up Drawer */}
      <UpNextSlideup
        currentSlug={post.slug}
        nextPost={relatedPosts?.[0] || null}
      />
    </PublicShell>
  );
}