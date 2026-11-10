import Image from "next/image";
import { Terminal, ShieldCheck, Database, Calendar, Clock } from "lucide-react";
import { ReadingProgress } from "./widgets/reading-progress";
import { ReadingControlsBar } from "./widgets/reading-controls-bar";
import { KeyTakeawaysBox } from "./widgets/key-takeaways-box";
import { UpNextSlideup } from "./widgets/up-next-slideup";
import { Reactions } from "./widgets/reactions";
import { CommentSection } from "./widgets/comment-section";
import { ArticleBreadcrumbs } from "./widgets/breadcrumbs";
import { AuthorNewsroomCard } from "./widgets/author-card";
import { TableOfContentsWidget, extractHeadingsFromHtml } from "./widgets/table-of-contents";
import { TabletArticleAccordion } from "./widgets/tablet-article-accordion";
import { EditorialStandardsBox } from "./widgets/editorial-standards";
import { FloatingEngagementDock } from "./widgets/floating-dock";
import { RelatedPostsGrid } from "./widgets/related-posts";
import { LatestNewsSidebarWidget } from "./widgets/latest-news-sidebar";
import { PrevNextArticleNav } from "./widgets/prev-next-nav";
import { KravionaNewsletter } from "@/components/home/kraviona/newsletter-banner";
import { formatDate } from "@/lib/utils";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { ArticleLayoutProps } from "./types";

export function WideArticleLayout({
  post,
  comments = [],
  relatedPosts = [],
  latestPosts = [],
  prevPost = null,
  nextPost = null,
  tokens = DEFAULT_DESIGN_TOKENS,
}: ArticleLayoutProps) {
  const cfg = tokens?.article || DEFAULT_DESIGN_TOKENS.article;
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt)
    : new Date(post.createdAt || Date.now());
  const extractedHeadings = extractHeadingsFromHtml(post.contentHtml);

  return (
    <>
      {cfg.showStickyProgress && <ReadingProgress />}

      <article className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ArticleBreadcrumbs category={post.category} title={post.title} className="mb-4" />

        {/* Technical Banner Header */}
        <header className="mb-8 p-6 sm:p-8 rounded-2xl bg-[var(--color-primary-dark)] text-white border border-[var(--color-border)] shadow-md">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-[var(--color-secondary-accent)] bg-white/10 border border-[var(--color-secondary-accent)]/30 px-2.5 py-0.5 rounded">
              <Terminal className="h-3 w-3" /> Technical Architecture &amp; Benchmark
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-sky-300 bg-white/10 border border-sky-400/30 px-2.5 py-0.5 rounded">
              <Database className="h-3 w-3" /> Reproducible Specs
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-base sm:text-lg text-white/90 font-sans max-w-4xl leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 pt-4 border-t border-white/20 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-white/80">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">By {post.author?.name || "Technical Staff"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> {formatDate(publishDate)}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> {post.readingTime || 8} min read
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[var(--color-secondary-accent)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Peer-Verified Methodology
            </span>
          </div>
        </header>

        {/* Reading Controls Toolbar */}
        {cfg.showReadingControls && (
          <ReadingControlsBar
            postId={String(post._id)}
            slug={post.slug}
            title={post.title}
            readingTime={post.readingTime || 8}
          />
        )}

        {/* 9+3 Technical Architecture Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Expanded 9-Column Main Body */}
          <div className="lg:col-span-9">
            {/* Wide Technical Hero Visual */}
            {post.coverImage && (
              <figure className="mb-8">
                <div className="relative aspect-21/9 sm:aspect-16/7 w-full overflow-hidden rounded-2xl bg-[var(--color-primary-dark)] border border-[var(--color-border)]">
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 1000px"
                    className="object-cover"
                  />
                </div>
              </figure>
            )}

            {/* Key Findings Box */}
            {cfg.showKeyTakeaways && (
              <KeyTakeawaysBox
                title={post.title}
                excerpt={post.excerpt || ""}
                points={post.keyTakeaways}
              />
            )}

            {/* Mobile/Tablet TOC */}
            {cfg.showTableOfContents && (
              <TabletArticleAccordion initialHeadings={extractedHeadings} />
            )}

            {/* Wide Technical Prose with Full-Width Tables */}
            <div
              className="prose-article max-w-none text-[var(--color-body-text)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>Benchmark evaluation report coming soon.</p>" }}
            />

            {/* Reactions & Engagement */}
            {cfg.showReactions && (
              <div className="mt-8 flex items-center justify-between border-y border-[var(--color-border)] py-3">
                <Reactions postId={String(post._id)} />
              </div>
            )}

            {/* Author Newsroom Card */}
            {cfg.showAuthorBio && post.author && (
              <AuthorNewsroomCard author={post.author} className="mt-10" />
            )}

            {/* Previous / Next Article Navigation */}
            <PrevNextArticleNav prevPost={prevPost} nextPost={nextPost} />

            {/* Comments Section */}
            {post.allowComments !== false && (
              <div className="mt-10">
                <CommentSection postId={String(post._id)} initialComments={comments as any} />
              </div>
            )}
          </div>

          {/* Sticky 3-Column Utility Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              {cfg.showTableOfContents && (
                <TableOfContentsWidget initialHeadings={extractedHeadings} />
              )}
              <LatestNewsSidebarWidget posts={latestPosts.length > 0 ? latestPosts : relatedPosts} />
              <KravionaNewsletter variant="sidebar" source={`wide-article:${post.slug}`} />
              <EditorialStandardsBox />
            </div>
          </aside>
        </div>

        {/* Related Technical Posts */}
        {cfg.showRelatedPosts && (
          <RelatedPostsGrid relatedPosts={relatedPosts} title="Related Technical Intelligence" />
        )}
      </article>

      {/* Floating Engagement Dock */}
      {cfg.showReactions && (
        <FloatingEngagementDock
          postId={String(post._id)}
          slug={post.slug}
          title={post.title}
        />
      )}

      {/* Up Next Slideup */}
      <UpNextSlideup currentSlug={post.slug} nextPost={relatedPosts?.[0] as any || null} />
    </>
  );
}

export default WideArticleLayout;
