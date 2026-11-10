import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Hash,
  ChevronRight,
  TrendingUp,
  ArrowRight,
  Cpu,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { KravionaNewsletter } from "@/components/home/kraviona/newsletter-banner";
import { getTagBySlug, getAllCategories } from "@/lib/db/queries/taxonomies";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) return { title: "Tag Not Found | Kraviona AI News" };

  return buildEntityMetadata({
    entityType: "tag",
    entitySeo: tag.seo,
    path: `/tag/${tag.slug}`,
    title: tag.name,
    excerpt:
      tag.seo?.metaDescription ||
      tag.description ||
      `Browse verified AI articles, benchmarks, and news tagged with #${tag.name} on Kraviona AI News.`,
  });
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);

  if (!tag) notFound();

  const [{ posts }, { posts: trendingPosts }, allCategories, settings] = await Promise.all([
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
    getGlobalSettings(),
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
        name: `#${tag.name} Dispatches - Kraviona AI News`,
        description: tag.description || `Articles tagged with #${tag.name}`,
        url: `${siteUrl}/tag/${tag.slug}`,
      },
    ],
  };

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-[var(--color-muted-text)] mb-6"
        >
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <Link href="/blog" className="hover:text-[var(--accent)] transition-colors">
            Topics
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="font-semibold text-[var(--color-heading)]">#{tag.name}</span>
        </nav>

        {/* Tag Hero Header */}
        <header className="rounded-2xl border border-[var(--border)] border-t-4 border-t-[var(--accent)] bg-[var(--color-card-background)] p-6 sm:p-10 mb-10 shadow-xs">
          <div className="max-w-3xl space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#101820] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                <Hash className="h-3 w-3 text-[#E05A42]" /> Topic Index
              </span>
              <span className="rounded-md bg-[var(--color-secondary-surface)] border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--color-heading)]">
                {posts.length} Dispatches
              </span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)]">
              #{tag.name}
            </h1>

            {tag.description ? (
              <p className="text-base text-[var(--color-body-text)] leading-relaxed">
                {tag.description}
              </p>
            ) : (
              <p className="text-sm text-[var(--color-muted-text)] leading-relaxed">
                Curated technical dispatches, benchmark teardowns, and verified release updates associated with <strong className="text-[var(--color-heading)]">#{tag.name}</strong>.
              </p>
            )}
          </div>
        </header>

        {/* Content & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          <main className="lg:col-span-8 space-y-8">
            {leadPost && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[var(--color-heading)] pb-2">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
                    Lead Story in #{tag.name}
                  </h2>
                </div>
                <PostCard post={leadPost} featured />
              </section>
            )}

            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-heading)]">
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
                <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center space-y-3 bg-[var(--color-card-background)]">
                  <Cpu className="h-10 w-10 text-[var(--accent)] mx-auto" />
                  <h3 className="text-base font-bold text-[var(--color-heading)]">
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
            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-heading)] flex items-center gap-1.5 border-b border-[var(--border)] pb-3">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" /> Trending Stories
              </h3>
              <div className="divide-y divide-[var(--border)]">
                {trendingPosts.map((post: any, idx: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="py-3 flex items-start gap-3 group block"
                  >
                    <span className="text-base font-black text-[var(--color-muted-text)] group-hover:text-[var(--accent)] font-mono transition-colors">
                      0{idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] line-clamp-2 transition-colors">
                      {post.title}
                    </h4>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter */}
            <KravionaNewsletter variant="sidebar" source="tag-page" />

            {/* Other Categories */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-4">
              <h3 className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-heading)]">
                Browse Coverage Hubs
              </h3>
              <div className="space-y-2">
                {allCategories.map((c: { _id: string; slug: string; name: string; postCount?: number }) => (
                  <Link
                    key={c._id}
                    href={`/category/${c.slug}`}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--color-secondary-surface)] transition-colors"
                  >
                    <span className="text-xs font-semibold text-[var(--color-heading)]">{c.name}</span>
                    <span className="text-[11px] font-mono text-[var(--color-muted-text)]">{c.postCount || 0}</span>
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
