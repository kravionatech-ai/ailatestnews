import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, Eye, ShieldCheck } from "lucide-react";
import { ReadingProgress } from "./widgets/reading-progress";
import { ReadingControlsBar } from "./widgets/reading-controls-bar";
import { KeyTakeawaysBox } from "./widgets/key-takeaways-box";
import { UpNextSlideup } from "./widgets/up-next-slideup";
import { Reactions } from "./widgets/reactions";
import { CommentSection } from "./widgets/comment-section";
import { ArticleBreadcrumbs } from "./widgets/breadcrumbs";
import { AuthorNewsroomCard } from "./widgets/author-card";
import { TableOfContentsWidget } from "./widgets/table-of-contents";
import { extractHeadingsFromHtml } from "./widgets/toc-utils";
import { TabletArticleAccordion } from "./widgets/tablet-article-accordion";
import { EditorialStandardsBox } from "./widgets/editorial-standards";
import { RelatedPostsGrid } from "./widgets/related-posts";
import { LatestNewsSidebarWidget } from "./widgets/latest-news-sidebar";
import { PrevNextArticleNav } from "./widgets/prev-next-nav";
import { KravionaNewsletter } from "@/components/home/kraviona/newsletter-banner";
import { AskAIButton } from "@/components/blog/ask-ai-button";
import { ShareButtons } from "@/components/blog/share-buttons";
import { formatDate } from "@/lib/utils";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { ArticleLayoutProps } from "./types";

export function StandardEditorialLayout({
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
  const updatedDate = post.updatedAt ? new Date(post.updatedAt) : publishDate;
  const isUpdated = updatedDate.getTime() - publishDate.getTime() > 86400000;
  const extractedHeadings = extractHeadingsFromHtml(post.contentHtml);

  const sidebarLatest =
    latestPosts && latestPosts.length > 0 ? latestPosts : relatedPosts;

  return (
    <>
      {cfg.showStickyProgress && <ReadingProgress />}

      <article className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <ArticleBreadcrumbs category={post.category} title={post.title} className="mb-6" />

        {/* Article Header */}
        <header className="max-w-4xl mb-8">
          {post.category && (
            <div className="mb-4">
              <Link
                href={`/category/${post.category.slug}`}
                className="inline-flex items-center rounded-md bg-[var(--accent)] px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                {post.category.name}
              </Link>
            </div>
          )}

          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-[3.1rem] font-bold tracking-tight text-[var(--color-heading)] leading-[1.12]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg sm:text-xl text-[var(--color-muted-text)] leading-relaxed font-normal">
              {post.excerpt}
            </p>
          )}

          {/* Author & Publication Details */}
          <div className="mt-6 pt-5 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--color-muted-text)]">
            <div className="flex items-center gap-3.5">
              {post.author?.image ? (
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[var(--border)] shrink-0">
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#101820] font-mono font-bold text-sm text-white shrink-0">
                  {post.author?.name?.charAt(0) || "K"}
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={post.author?.slug ? `/author/${post.author.slug}` : "/about"}
                    className="font-bold text-sm text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors"
                  >
                    By {post.author?.name || "Kraviona AI News Editorial Staff"}
                  </Link>
                  <span className="text-[10px] font-mono uppercase bg-[var(--color-secondary-surface)] text-[var(--color-heading)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                    {post.author?.role || "Staff Correspondent"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] font-mono text-[var(--color-muted-text)]">
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/25 px-2 py-0.5 rounded">
                    <ShieldCheck className="h-3 w-3 text-[var(--accent)]" />
                    Fact-Checked
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {formatDate(publishDate)}
                  </span>
                  {isUpdated && <span>(Updated {formatDate(updatedDate)})</span>}
                  {post.readingTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.readingTime} min read
                    </span>
                  )}
                  {typeof post.views === "number" && post.views >= 10 && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> {post.views.toLocaleString()} reads
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

        {/* Reading Controls Bar */}
        {cfg.showReadingControls && (
          <ReadingControlsBar
            postId={String(post._id)}
            slug={post.slug}
            title={post.title}
            readingTime={post.readingTime || 6}
          />
        )}

        {/* 12-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main 8-Column Article Body */}
          <div className="lg:col-span-8 min-w-0">
            {post.coverImage && (
              <figure className="mb-8">
                <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-[var(--color-secondary-surface)] border border-[var(--border)] shadow-xs">
                  <Image
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 840px"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-2.5 text-xs text-[var(--color-muted-text)] flex flex-wrap items-center justify-between gap-2 px-1 font-mono">
                  <span>{post.coverImageCaption || post.coverImageAlt || post.title}</span>
                  <span className="text-[10px] uppercase opacity-75">
                    Kraviona Visual Desk
                  </span>
                </figcaption>
              </figure>
            )}

            {/* Key Takeaways */}
            {cfg.showKeyTakeaways && (
              <KeyTakeawaysBox
                title={post.title}
                excerpt={post.excerpt || ""}
                points={post.keyTakeaways}
              />
            )}

            {/* Tablet/Mobile Table of Contents Accordion */}
            {cfg.showTableOfContents && (
              <TabletArticleAccordion initialHeadings={extractedHeadings} />
            )}

            {/* Prose Content */}
            <div
              className="prose-article max-w-none"
              dangerouslySetInnerHTML={{
                __html: post.contentHtml || "<p>Dispatch details coming soon.</p>",
              }}
            />

            {/* Topics / Tags Strip */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)] mr-1">
                  Topics:
                </span>
                {post.tags.map((tag) => (
                  <Link
                    key={tag._id || tag.slug}
                    href={`/tag/${tag.slug}`}
                    className="rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1 text-xs font-mono font-medium text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    #{tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Reactions & Share Toolbar */}
            {cfg.showReactions && (
              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--border)] py-3.5">
                <Reactions postId={String(post._id)} />
                <div className="flex items-center gap-2">
                  <AskAIButton title={post.title} slug={post.slug} />
                  <ShareButtons title={post.title} slug={post.slug} />
                </div>
              </div>
            )}

            {/* Author Newsroom Bio Card */}
            {cfg.showAuthorBio && post.author && (
              <AuthorNewsroomCard author={post.author} className="mt-10" />
            )}

            {/* Previous / Next Article Navigation */}
            <PrevNextArticleNav prevPost={prevPost} nextPost={nextPost} />

            {/* Mobile/Tablet Newsletter Subscription Card */}
            <div className="block lg:hidden my-8">
              <KravionaNewsletter variant="sidebar" source={`article:${post.slug}`} />
            </div>

            {/* Comments Section */}
            {post.allowComments !== false && (
              <div className="mt-10">
                <CommentSection postId={String(post._id)} initialComments={comments as any} />
              </div>
            )}
          </div>

          {/* Desktop Sticky Editorial Sidebar (4 columns) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6">
              {cfg.showTableOfContents && (
                <TableOfContentsWidget initialHeadings={extractedHeadings} />
              )}
              <LatestNewsSidebarWidget posts={sidebarLatest} />
              <KravionaNewsletter variant="sidebar" source={`article-sidebar:${post.slug}`} />
              <EditorialStandardsBox />
            </div>
          </aside>
        </div>

        {/* Related Stories */}
        {cfg.showRelatedPosts && <RelatedPostsGrid relatedPosts={relatedPosts} />}
      </article>

      {/* Up Next Slideup */}
      <UpNextSlideup
        currentSlug={post.slug}
        nextPost={(nextPost as any) || (relatedPosts?.[0] as any) || null}
      />
    </>
  );
}

export default StandardEditorialLayout;
