import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Globe, BookOpen } from "lucide-react";
import { TwitterIcon, GithubIcon, LinkedinIcon } from "@/components/ui/icons";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { getAuthorBySlug } from "@/lib/db/queries/taxonomies";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) return { title: "Author Not Found | Kraviona AI News" };

  return buildEntityMetadata({
    entityType: "author",
    path: `/author/${slug}`,
    author: author.name,
    title: `${author.name} — Author Archive & Biography`,
    excerpt: author.bio || `Read technical AI dispatches, foundation model analyses, and articles published by ${author.name} on Kraviona AI News.`,
    coverImage: author.image,
  });
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) notFound();

  const [{ posts }, settings] = await Promise.all([
    getPublishedPosts({
      authorSlug: slug,
      limit: 15,
    }),
    getGlobalSettings(),
  ]);

  const siteUrl = getSiteUrl();

  // JSON-LD ProfilePage schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: author.name,
      jobTitle: author.role || "Technology Journalist & Technical Editor",
      description: author.bio,
      image: author.image,
      url: `${siteUrl}/author/${slug}`,
      sameAs: [
        author.website,
        author.socialLinks?.twitter,
        author.socialLinks?.github,
        author.socialLinks?.linkedin,
      ].filter(Boolean),
    },
  };

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-muted-text)] hover:text-[var(--accent)] mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Articles
        </Link>

        {/* Author Bio Banner */}
        <div className="mb-12 rounded-2xl border border-[var(--border)] border-t-4 border-t-[var(--accent)] bg-[var(--color-card-background)] p-6 sm:p-10 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {author.image ? (
            <div className="relative h-24 w-24 rounded-full overflow-hidden border border-[var(--border)] shrink-0">
              <Image
                src={author.image}
                alt={author.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#101820] text-[#F5F4EF] font-mono font-bold text-3xl shrink-0">
              {author.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 space-y-2.5">
            <span className="inline-block rounded-md bg-[var(--color-secondary-surface)] border border-[var(--border)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
              {author.role || "Contributing Journalist"}
            </span>
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[var(--color-heading)]">
              {author.name}
            </h1>
            <p className="text-sm text-[var(--color-body-text)] max-w-2xl leading-relaxed">
              {author.bio ||
                "Senior technology journalist and researcher covering foundation models, AI engineering systems, and global innovation intelligence."}
            </p>

            <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 pt-2">
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-muted-text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-xs"
                  aria-label="Author Website"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
              {author.socialLinks?.twitter && (
                <a
                  href={author.socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-muted-text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-xs"
                  aria-label="Twitter Profile"
                >
                  <TwitterIcon className="h-4 w-4" />
                </a>
              )}
              {author.socialLinks?.github && (
                <a
                  href={author.socialLinks.github}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-muted-text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-xs"
                  aria-label="GitHub Profile"
                >
                  <GithubIcon className="h-4 w-4" />
                </a>
              )}
              {author.socialLinks?.linkedin && (
                <a
                  href={author.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-muted-text)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors shadow-xs"
                  aria-label="LinkedIn Profile"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-8 pb-3 border-b-2 border-[var(--color-heading)]">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] block mb-1">
              Byline Archive
            </span>
            <h2 className="font-editorial text-2xl font-bold text-[var(--color-heading)]">
              Published Dispatches ({posts.length})
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post: any) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>

        {posts.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--color-card-background)] p-12 text-center text-sm text-[var(--color-muted-text)]">
            No published articles found for this author.
          </div>
        )}
      </div>
    </PublicShell>
  );
}