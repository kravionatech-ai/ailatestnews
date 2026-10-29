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
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthorBySlug(slug);

  if (!author) return { title: "Author Not Found | AI Latest News" };

  return buildEntityMetadata({
    entityType: "author",
    path: `/author/${slug}`,
    author: author.name,
    title: `${author.name} — Author Archive & Biography`,
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
    limit: 15,
  });

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
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> All Articles
        </Link>

        {/* Author Bio Banner */}
        <div className="mb-12 rounded-2xl border border-slate-900 bg-white p-6 sm:p-10 shadow-2xs flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {author.image ? (
            <div className="relative h-24 w-24 rounded-full overflow-hidden border border-slate-200 shrink-0">
              <Image
                src={author.image}
                alt={author.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-slate-900 text-white font-mono font-bold text-3xl shrink-0">
              {author.name.charAt(0)}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <span className="inline-block rounded-md bg-slate-100 border border-slate-200 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-700">
              {author.role || "Contributing Journalist"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
              {author.name}
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              {author.bio ||
                "Senior technology journalist and researcher covering foundation models, GPU compute economics, and sovereign AI initiatives across India."}
            </p>

            <div className="mt-4 flex items-center justify-center sm:justify-start gap-2 pt-2">
              {author.website && (
                <a
                  href={author.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-colors shadow-2xs"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-colors shadow-2xs"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-colors shadow-2xs"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-colors shadow-2xs"
                  aria-label="LinkedIn Profile"
                >
                  <LinkedinIcon className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-8 pb-3 border-b border-slate-900">
          <div>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Byline Archive
            </span>
            <h2 className="text-2xl font-black text-slate-900">
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
          <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 bg-white">
            No published articles found for this author.
          </div>
        )}
      </div>
    </PublicShell>
  );
}