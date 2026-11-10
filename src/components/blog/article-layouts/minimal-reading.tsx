import Image from "next/image";
import { ReadingProgress } from "./widgets/reading-progress";
import { Reactions } from "./widgets/reactions";
import { CommentSection } from "./widgets/comment-section";
import { ArticleBreadcrumbs } from "./widgets/breadcrumbs";
import { AuthorNewsroomCard } from "./widgets/author-card";
import { RelatedPostsGrid } from "./widgets/related-posts";
import { formatDate } from "@/lib/utils";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { ArticleLayoutProps } from "./types";

export function MinimalReadingLayout({
  post,
  comments = [],
  relatedPosts = [],
  tokens = DEFAULT_DESIGN_TOKENS,
}: ArticleLayoutProps) {
  const cfg = tokens?.article || DEFAULT_DESIGN_TOKENS.article;
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt)
    : new Date(post.createdAt || Date.now());

  return (
    <>
      {cfg.showStickyProgress && <ReadingProgress />}

      <article className="mx-auto max-w-[720px] px-4 sm:px-6 py-12 sm:py-20">
        <ArticleBreadcrumbs category={post.category} title={post.title} className="mb-6 opacity-70" />

        {/* Minimal Understated Header */}
        <header className="mb-12">
          {post.category && (
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-primary-accent)]">
              {post.category.name}
            </span>
          )}

          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-tight">
            {post.title}
          </h1>

          <div className="mt-4 flex items-center gap-3 text-xs text-[var(--color-muted-text)] font-sans">
            <span className="font-medium text-[var(--color-heading)]">
              {post.author?.name || "Kraviona AI Editorial Team"}
            </span>
            <span>•</span>
            <span>{formatDate(publishDate)}</span>
            <span>•</span>
            <span>{post.readingTime || 5} min read</span>
          </div>
        </header>

        {/* Minimal Hero Visual (if provided) */}
        {post.coverImage && (
          <figure className="mb-10">
            <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-[var(--color-secondary-surface)] border border-[var(--color-border)]">
              <Image
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
            </div>
            {post.coverImageCaption && (
              <figcaption className="mt-2 text-center text-xs text-[var(--color-muted-text)]">
                {post.coverImageCaption}
              </figcaption>
            )}
          </figure>
        )}

        {/* Pure Prose Body */}
        <div
          className="prose-article max-w-none text-[var(--color-body-text)] text-lg font-serif leading-[1.85]"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>Essay content coming soon.</p>" }}
        />

        {/* Post-Reading Engagement (Appears after completion) */}
        {cfg.showReactions && (
          <div className="mt-12 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
            <Reactions postId={String(post._id)} />
            <span className="font-mono text-xs text-[var(--color-muted-text)]">
              Thanks for reading
            </span>
          </div>
        )}

        {/* Author Bio (Minimal Variant) */}
        {cfg.showAuthorBio && post.author && (
          <AuthorNewsroomCard author={post.author} variant="minimal" className="mt-8" />
        )}

        {/* Discussion */}
        {post.allowComments !== false && (
          <div className="mt-12">
            <CommentSection postId={String(post._id)} initialComments={comments as any} />
          </div>
        )}

        {/* Related Posts */}
        {cfg.showRelatedPosts && (
          <RelatedPostsGrid relatedPosts={relatedPosts} />
        )}
      </article>
    </>
  );
}

export default MinimalReadingLayout;
