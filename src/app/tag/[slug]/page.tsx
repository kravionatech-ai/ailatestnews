import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Hash,
  ChevronRight,
  TrendingUp,
  Mail,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { getTagBySlug, getAllCategories } from "@/lib/db/queries/taxonomies";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) return { title: "Tag Not Found | AI Latest News" };

  return buildEntityMetadata({
    entityType: "tag",
    entitySeo: tag.seo,
    path: `/tag/${tag.slug}`,
    title: tag.name,
    excerpt:
      tag.seo?.metaDescription ||
      tag.description ||
      `Browse verified AI articles, benchmarks, and news tagged with #${tag.name} on AI Latest News.`,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) notFound();

  const [{ posts }, { posts: trendingPosts }, allCategories] = await Promise.all([
    getPublishedPosts({
      tagSlug: slug,
      limit: 15,
      sort: "latest",
    }),
    getPublishedPosts({
      limit: 4,
      sort: "popular",
    }),
    getAllCategories(),
  ]);

  const siteUrl = getSiteUrl();
  const leadPost = posts[0];
  const secondaryPosts = posts.slice(1);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
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
            name: "Tags",
            item: `${siteUrl}/blog`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `#${tag.name}`,
            item: `${siteUrl}/tag/${tag.slug}`,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `#${tag.name} Dispatches - AI Latest News`,
        description: tag.description || `Articles tagged with #${tag.name}`,
        url: `${siteUrl}/tag/${tag.slug}`,
      },
    ],
  };

  return (
    <PublicShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-6"
        >
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href="/blog" className="hover:text-[var(--foreground)] transition-colors">
            Topics
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-[var(--foreground)]">#{tag.name}</span>
        </nav>

        {/* Tag Hero Header */}
        <header className="rounded-2xl border border-slate-900 bg-white p-6 sm:p-10 mb-10 shadow-2xs">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                <Hash className="h-3 w-3" /> Topic Index
              </span>
              <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700">
                {posts.length} Dispatches
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
              #{tag.name}
            </h1>

            {tag.description ? (
              <p className="text-base text-slate-700 leading-relaxed">
                {tag.description}
              </p>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed">
                Curated technical dispatches, benchmark teardowns, and verified release updates associated with the <strong>#{tag.name}</strong> entity.
              </p>
            )}
          </div>
        </header>

        {/* Content & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <main className="lg:col-span-8 space-y-8">
            {leadPost && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
                    Lead Story in #{tag.name}
                  </h2>
                </div>
                <PostCard post={leadPost} featured />
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                  All Dispatches ({secondaryPosts.length})
                </h2>
              </div>

              {secondaryPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {secondaryPosts.map((post: any) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              ) : !leadPost ? (
                <div className="rounded-3xl border border-dashed border-[var(--border)] p-12 text-center space-y-3 bg-white">
                  <Cpu className="h-10 w-10 text-indigo-600 mx-auto" />
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    No articles tagged with #{tag.name} yet
                  </h3>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)] hover:underline"
                  >
                    Browse all dispatches <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : null}
            </section>
          </main>

          <aside className="lg:col-span-4 space-y-6">
            {/* Trending */}
            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5 border-b pb-3">
                <TrendingUp className="h-3.5 w-3.5 text-rose-600" /> Trending Stories
              </h3>
              <div className="divide-y divide-[var(--border)]">
                {trendingPosts.map((post: any, idx: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="py-3 flex items-start gap-3 group block"
                  >
                    <span className="text-base font-black text-slate-300 group-hover:text-indigo-600 font-mono">
                      0{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-[var(--foreground)] group-hover:text-indigo-600 line-clamp-2">
                      {post.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 p-6 shadow-2xs space-y-3">
              <Mail className="h-5 w-5 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                Weekly AI Intelligence
              </h3>
              <p className="text-xs text-[var(--foreground-secondary)]">
                Essential Indian AI developments, model benchmarks, and open weights releases delivered straight to your inbox.
              </p>
              <form action="/newsletter" method="GET" className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-white p-2 text-xs outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Other Categories */}
            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Browse Pillar Hubs
              </h3>
              <div className="space-y-2">
                {allCategories.map((c: { _id: string; slug: string; name: string; postCount?: number }) => (
                  <Link
                    key={c._id}
                    href={`/category/${c.slug}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors"
                  >
                    <span className="text-xs font-semibold text-[var(--foreground)]">{c.name}</span>
                    <span className="text-[11px] font-mono text-[var(--foreground-muted)]">{c.postCount || 0}</span>
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}
