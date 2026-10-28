import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { TwitterIcon, GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { getAuthorBySlug } from "@/lib/db/queries/taxonomies";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { buildEntityMetadata } from "@/lib/seo/fallback";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) return { title: "Author Not Found | AI Latest News" };

  return buildEntityMetadata({
    entityType: "author",
    path: `/author/${slug}`,
    author: author.name,
    title: author.name,
    excerpt: author.bio || `Read technical AI dispatches, foundation model analyses, and articles published by ${author.name} on AI Latest News.`,
    coverImage: author.image,
  });
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) notFound();

  const { posts } = await getPublishedPosts({
    authorSlug: slug,
    limit: 12,
  });

  return (
    <PublicShell>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Articles
        </Link>

        {/* Author Bio Banner */}
        <div className="mb-12 rounded-3xl border border-[var(--border)] bg-gradient-to-br from-white to-[var(--background-secondary)] p-8 sm:p-10 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {author.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.image}
              alt={author.name}
              className="h-24 w-24 rounded-full object-cover border-2 border-[var(--accent)]"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-light)] text-[var(--accent)] font-bold text-3xl">
              {author.name.charAt(0)}
            </div>
          )}

          <div className="flex-1">
            <span className="rounded-full bg-[var(--background-tertiary)] px-3 py-1 text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
              {author.role}
            </span>
            <h1 className="mt-2 text-3xl font-extrabold text-[var(--foreground)]">
              {author.name}
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)] max-w-2xl leading-relaxed">
              {author.bio ||
                "Senior engineer and technical writer contributing to architecture, systems design, and cloud performance."}
            </p>

            <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {author.socialLinks?.twitter && (
                <a
                  href={author.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                >
                  <TwitterIcon className="h-4 w-4" />
                </a>
              )}
              {author.socialLinks?.github && (
                <a
                  href={author.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
              )}
              {author.socialLinks?.linkedin && (
                <a
                  href={author.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)]"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-6">
          Published Articles ({posts.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: { _id: string; title: string; slug: string; excerpt: string }) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-sm text-[var(--foreground-muted)]">
            No articles published by this author yet.
          </div>
        )}
      </div>
    </PublicShell>
  );
}
