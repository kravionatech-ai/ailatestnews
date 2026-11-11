import Image from "next/image";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { ReadingProgress } from "./widgets/reading-progress";
import { ReadingControlsBar } from "./widgets/reading-controls-bar";
import { KeyTakeawaysBox } from "./widgets/key-takeaways-box";
import { CommunityPollWidget } from "./widgets/community-poll-widget";
import { UpNextSlideup } from "./widgets/up-next-slideup";
import { Reactions } from "./widgets/reactions";
import { CommentSection } from "./widgets/comment-section";
import { ArticleBreadcrumbs } from "./widgets/breadcrumbs";
import { AuthorNewsroomCard } from "./widgets/author-card";
import { TableOfContentsAccordion } from "./widgets/table-of-contents";
import { extractHeadingsFromHtml } from "./widgets/toc-utils";
import { EditorialStandardsBox } from "./widgets/editorial-standards";
import { RelatedPostsGrid } from "./widgets/related-posts";
import { AskAIButton } from "@/components/blog/ask-ai-button";
import { ShareButtons } from "@/components/blog/share-buttons";
import { formatDate } from "@/lib/utils";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { ArticleLayoutProps } from "./types";

export function WithoutSidebarLayout({
  post,
  comments = [],
  relatedPosts = [],
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

      <article className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <ArticleBreadcrumbs category={post.category} title={post.title} className="mb-6" />

        {/* Header */}
        <header className="mb-8">
          {post.category && (
            <div className="mb-3">
              <Link
                href={`/category/${post.category.slug}`}
                className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-primary-accent)] hover:underline transition-colors"
              >
                {post.category.name}
              </Link>
            </div>
          )}

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--color-heading)] leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-lg sm:text-xl font-serif text-[var(--color-body-text)] leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-4 text-xs text-[var(--color-muted-text)]">
            <div className="flex items-center gap-3">
              {post.author?.image ? (
                <div className="relative h-11 w-11 overflow-hidden rounded-full border border-[var(--color-border)] shrink-0">
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-primary-dark)] font-mono font-bold text-sm text-white shrink-0">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--color-heading)]">
                    By {post.author?.name || "Kraviona AI News"}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--color-primary-accent)] bg-[var(--color-primary-accent)]/10 px-1.5 py-0.5 rounded border border-[var(--color-primary-accent)]/20">
                    <ShieldCheck className="h-3 w-3" /> Fact-Checked
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px]">
                  <span>{formatDate(publishDate)}</span>
                  <span>•</span>
                  <span>{post.readingTime || 6} min read</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <AskAIButton title={post.title} slug={post.slug} />
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        </header>

        {/* Featured Visual */}
        {post.coverImage && (
          <figure className="mb-8">
            <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-[var(--color-secondary-surface)] border border-[var(--color-border)] shadow-2xs">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            {post.coverImageCaption && (
              <figcaption className="mt-2 text-xs text-[var(--color-muted-text)]">
                {post.coverImageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Reading Controls */}
        {cfg.showReadingControls && (
          <ReadingControlsBar
            postId={String(post._id)}
            slug={post.slug}
            title={post.title}
            readingTime={post.readingTime || 6}
          />
        )}

        {/* Key Takeaways */}
        {cfg.showKeyTakeaways && (
          <KeyTakeawaysBox
            title={post.title}
            excerpt={post.excerpt || ""}
            points={post.keyTakeaways}
          />
        )}

        {/* In-Body Table of Contents Accordion */}
        {cfg.showTableOfContents && (
          <div className="mb-8">
            <TableOfContentsAccordion initialHeadings={extractedHeadings} />
          </div>
        )}

        {/* Prose Body */}
        <div
          className="prose-article max-w-none text-[var(--color-body-text)] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>Dispatch details coming soon.</p>" }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)] mr-1">
              Topics:
            </span>
            {post.tags.map((tag) => (
              <Link
                key={tag._id || tag.slug}
                href={`/tag/${tag.slug}`}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card-background)] px-2.5 py-1 text-xs font-mono font-medium text-[var(--color-body-text)] hover:border-[var(--color-heading)] transition-colors shadow-2xs"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Bottom Reactions */}
        {cfg.showReactions && (
          <div className="mt-8 flex items-center justify-between border-y border-[var(--color-border)] py-3">
            <Reactions postId={String(post._id)} />
            <div className="flex items-center gap-2">
              <AskAIButton title={post.title} slug={post.slug} />
              <ShareButtons title={post.title} slug={post.slug} />
            </div>
          </div>
        )}

        {/* Sequential Bottom Engagement Stack (Relocated from sidebar) */}
        <div className="mt-12 space-y-8">
          {/* Reader Poll */}
          {cfg.showCommunityPoll && (
            <CommunityPollWidget
              pollId={`poll-${post.slug}`}
              question="Will open-weight reasoning models replace closed APIs in your production stack by 2027?"
            />
          )}

          {/* Standards Card */}
          <EditorialStandardsBox />

          {/* Author Newsroom Bio Card */}
          {cfg.showAuthorBio && post.author && (
            <AuthorNewsroomCard author={post.author} />
          )}

          {/* Discussion */}
          {post.allowComments !== false && (
            <CommentSection postId={String(post._id)} initialComments={comments as any} />
          )}
        </div>

        {/* Related Posts */}
        {cfg.showRelatedPosts && (
          <RelatedPostsGrid relatedPosts={relatedPosts} />
        )}
      </article>

      {/* Up Next Slideup */}
      <UpNextSlideup currentSlug={post.slug} nextPost={relatedPosts?.[0] as any || null} />
    </>
  );
}

export default WithoutSidebarLayout;
