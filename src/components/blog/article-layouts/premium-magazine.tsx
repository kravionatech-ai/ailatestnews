import Image from "next/image";
import { Calendar, Clock } from "lucide-react";
import { ReadingProgress } from "./widgets/reading-progress";
import { KeyTakeawaysBox } from "./widgets/key-takeaways-box";
import { UpNextSlideup } from "./widgets/up-next-slideup";
import { CommentSection } from "./widgets/comment-section";
import { ArticleBreadcrumbs } from "./widgets/breadcrumbs";
import { AuthorNewsroomCard } from "./widgets/author-card";
import { FloatingEngagementDock } from "./widgets/floating-dock";
import { RelatedPostsGrid } from "./widgets/related-posts";
import { EditorialStandardsBox } from "./widgets/editorial-standards";
import { PrevNextArticleNav } from "./widgets/prev-next-nav";
import { KravionaNewsletter } from "@/components/home/kraviona/newsletter-banner";
import { formatDate } from "@/lib/utils";
import { DEFAULT_DESIGN_TOKENS } from "@/lib/design-tokens/defaults";
import { ArticleLayoutProps } from "./types";

export function PremiumMagazineLayout({
  post,
  comments = [],
  relatedPosts = [],
  prevPost = null,
  nextPost = null,
  tokens = DEFAULT_DESIGN_TOKENS,
}: ArticleLayoutProps) {
  const cfg = tokens?.article || DEFAULT_DESIGN_TOKENS.article;
  const publishDate = post.publishedAt
    ? new Date(post.publishedAt)
    : new Date(post.createdAt || Date.now());

  return (
    <>
      {cfg.showStickyProgress && <ReadingProgress />}

      {/* Immersive Full-Bleed Hero Header */}
      <div className="relative w-full min-h-[60vh] lg:min-h-[70vh] flex items-end bg-[var(--color-primary-dark)] overflow-hidden">
        {post.coverImage && (
          <div className="absolute inset-0 z-0">
            <Image
              src={post.coverImage}
              alt={post.coverImageAlt || post.title}
              fill
              priority
              sizes="100vw"
              className="object-cover opacity-40 scale-105 filter blur-xs"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary-dark)] via-[var(--color-primary-dark)]/70 to-transparent" />
          </div>
        )}

        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16 pt-32 w-full text-center sm:text-left">
          <ArticleBreadcrumbs
            category={post.category}
            title={post.title}
            className="mb-6 text-white/80 justify-center sm:justify-start"
          />

          {post.category && (
            <span className="inline-block font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-secondary-accent)] bg-[var(--color-primary-dark)]/80 border border-[var(--color-secondary-accent)]/30 px-3 py-1 rounded-full mb-4">
              {post.category.name}
            </span>
          )}

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] drop-shadow-md">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-6 text-lg sm:text-2xl font-serif text-white/90 max-w-3xl leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-4 text-xs text-white/80 justify-center sm:justify-start">
            <div className="flex items-center gap-2">
              {post.author?.image ? (
                <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/30">
                  <Image
                    src={post.author.image}
                    alt={post.author.name || "Author"}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-accent)] font-bold text-white text-sm">
                  {post.author?.name?.charAt(0) || "A"}
                </div>
              )}
              <span className="font-bold text-white">{post.author?.name || "Editorial Staff"}</span>
            </div>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[var(--color-secondary-accent)]" />
              {formatDate(publishDate)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[var(--color-secondary-accent)]" />
              {post.readingTime || 7} min read
            </span>
          </div>
        </div>
      </div>

      {/* Centered Magazine Reading Body */}
      <article className="mx-auto max-w-3xl px-4 sm:px-6 py-12">
        {cfg.showKeyTakeaways && (
          <div className="mb-10">
            <KeyTakeawaysBox
              title={post.title}
              excerpt={post.excerpt || ""}
              points={post.keyTakeaways}
            />
          </div>
        )}

        {/* Prose with Magazine Drop Cap */}
        <div
          className="prose-article max-w-none text-[var(--color-body-text)] text-lg sm:text-xl font-serif leading-[1.85] first-letter:float-left first-letter:text-5xl first-letter:sm:text-6xl first-letter:font-serif first-letter:font-black first-letter:mr-3.5 first-letter:text-[var(--color-heading)] first-letter:leading-none"
          dangerouslySetInnerHTML={{ __html: post.contentHtml || "<p>Article details coming soon.</p>" }}
        />

        {/* In-Body Newsletter Subscription */}
        <div className="my-12">
          <KravionaNewsletter variant="sidebar" source={`magazine:${post.slug}`} />
        </div>

        {/* Editorial Standards Box */}
        <EditorialStandardsBox className="my-10" />

        {/* Author Newsroom Bio */}
        {cfg.showAuthorBio && post.author && (
          <AuthorNewsroomCard author={post.author} className="mt-12" />
        )}

        {/* Previous / Next Navigation */}
        <PrevNextArticleNav prevPost={prevPost} nextPost={nextPost} />

        {/* Comments Section */}
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

export default PremiumMagazineLayout;
