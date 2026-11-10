import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  HelpCircle,
  ArrowRight,
  Tag as TagIcon,
  ShieldCheck,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { NewsCard } from "@/components/blog/cards/news-card";
import { KravionaNewsletter } from "@/components/home/kraviona/newsletter-banner";
import { getCategoryBySlug, getAllCategories, getAllTags } from "@/lib/db/queries/taxonomies";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { getGlobalSettings } from "@/lib/db/queries/settings";
import { resolveCategoryOrTopic } from "@/lib/categories/queries";
import { EXPLORE_CATEGORIES_LIST, VIRTUAL_TOPIC_DESKS } from "@/lib/categories/topics";
import { formatDate } from "@/lib/utils";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  try {
    const categories = await getAllCategories();
    const dbSlugs = categories.map((c: { slug: string }) => c.slug);
    const virtualSlugs = Object.keys(VIRTUAL_TOPIC_DESKS);
    const merged = Array.from(new Set([...dbSlugs, ...virtualSlugs]));
    return merged.map((slug) => ({ slug }));
  } catch {
    return Object.keys(VIRTUAL_TOPIC_DESKS).map((slug) => ({ slug }));
  }
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const dbCat = await getCategoryBySlug(slug);
  const virtual = VIRTUAL_TOPIC_DESKS[slug];
  const target = dbCat || virtual;

  if (!target) return { title: "Category Not Found | Kraviona AI News" };

  return buildEntityMetadata({
    entityType: "category",
    entitySeo: dbCat?.seo,
    path: `/category/${slug}`,
    title: `${target.name} — Kraviona AI News Intelligence & Reporting`,
    category: target.name,
    excerpt:
      target.description ||
      target.introHtml?.replace(/<[^>]+>/g, " ").slice(0, 160),
    coverImage: dbCat?.image,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(resolvedSearch.page || "1", 10) || 1);

  const [resolved, trendingRes, allCategories, allTags, settings] = await Promise.all([
    resolveCategoryOrTopic(slug, currentPage, 9),
    getPublishedPosts({ limit: 5, sort: "popular" }),
    getAllCategories(),
    getAllTags(),
    getGlobalSettings(),
  ]);

  if (!resolved) notFound();

  const { category, posts, pagination } = resolved;
  const trendingPosts = trendingRes.posts || [];
  const siteUrl = getSiteUrl();

  const leadPost = currentPage === 1 ? posts[0] : null;
  const gridPosts = currentPage === 1 ? posts.slice(1) : posts;
  const topicTags = allTags.slice(0, 6);

  const categoryIntro =
    category.introHtml ||
    `<p>Welcome to <strong>${category.name}</strong> at Kraviona AI News. Our editors deliver independent, primary-source intelligence on frontier model architectures, engineering tooling, global policy, and computational infrastructure.</p>`;

  const categoryFaqs =
    category.faqs && category.faqs.length > 0
      ? category.faqs
      : [
          {
            question: `How frequently is the ${category.name} desk updated?`,
            answer: `Our correspondents monitor frontier preprints, major model repositories, and industry releases continuously, publishing verified dispatches every week.`,
          },
          {
            question: `How does Kraviona AI News verify claims in ${category.name}?`,
            answer: `Every published report cites primary documentation, model cards, benchmark methodology, and independent verification before going live.`,
          },
        ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
          {
            "@type": "ListItem",
            position: 2,
            name: "Categories",
            item: `${siteUrl}/archive`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: `${siteUrl}/category/${category.slug}`,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        name: `${category.name} — Kraviona AI News`,
        description: category.description,
        url: `${siteUrl}/category/${category.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: categoryFaqs.map((faq: { question: string; answer: string }) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <PublicShell
      navLinks={settings?.navigation}
      footerConfig={settings?.footer}
      headlines={trendingPosts}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-mono text-[var(--color-muted-text)] mb-6 flex-wrap"
        >
          <Link href="/" className="hover:text-[var(--accent)] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/archive" className="hover:text-[var(--accent)] transition-colors">
            Categories
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-bold text-[var(--color-heading)]">{category.name}</span>
        </nav>

        {/* Editorial Category Introduction Banner */}
        <header className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-10 mb-10 shadow-xs">
          <div className="max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#101820] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                <Layers className="h-3 w-3 text-[#D94F35]" /> Intelligence Desk
              </span>
              <span className="rounded-md bg-[var(--color-main-background)] border border-[var(--border)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--color-heading)]">
                {pagination.total} Dispatches
              </span>
              <span className="rounded-md bg-[var(--accent)]/10 border border-[var(--accent)]/25 px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--accent)] flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified Reporting
              </span>
            </div>

            <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-tight">
              {category.name}
            </h1>

            {category.description && (
              <p className="text-base sm:text-lg text-[var(--color-heading)]/85 font-medium leading-relaxed">
                {category.description}
              </p>
            )}

            <div
              className="pt-3 text-sm text-[var(--color-muted-text)] leading-relaxed max-w-3xl border-t border-[var(--border)]"
              dangerouslySetInnerHTML={{ __html: categoryIntro }}
            />

            {topicTags.length > 0 && (
              <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] flex items-center gap-1">
                  <TagIcon className="h-3 w-3 text-[var(--accent)]" /> Related Topics:
                </span>
                {topicTags.map((t: { _id: string; name: string; slug: string }) => (
                  <Link
                    key={t._id}
                    href={`/tag/${t.slug}`}
                    className="rounded-md bg-[var(--color-main-background)] border border-[var(--border)] px-2.5 py-1 font-mono text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Main 12-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Primary Column (8 cols) */}
          <div className="lg:col-span-8 space-y-10 min-w-0">
            {/* Featured Story (Page 1) */}
            {leadPost && (
              <section aria-label="Featured Story" className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                  <h2 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                    Featured Story · {category.name}
                  </h2>
                  <span className="font-mono text-[11px] text-[var(--color-muted-text)]">
                    Lead Coverage
                  </span>
                </div>

                <article className="group relative rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] overflow-hidden shadow-xs hover:border-[var(--accent)] hover:shadow-md transition-all duration-300">
                  {leadPost.coverImage && (
                    <div className="relative aspect-16/9 w-full overflow-hidden bg-[var(--color-secondary-surface)] border-b border-[var(--border)]">
                      <Image
                        src={leadPost.coverImage}
                        alt={leadPost.coverImageAlt || leadPost.title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-[var(--color-muted-text)]">
                      <span className="font-bold uppercase tracking-wider text-[var(--accent)]">
                        {leadPost.category?.name || category.name}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(leadPost.publishedAt || leadPost.createdAt)}
                      </span>
                      {leadPost.readingTime && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {leadPost.readingTime} min read
                          </span>
                        </>
                      )}
                    </div>

                    <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors leading-tight">
                      <Link href={`/blog/${leadPost.slug}`}>
                        <span className="absolute inset-0 z-0" aria-hidden="true" />
                        {leadPost.title}
                      </Link>
                    </h3>

                    {leadPost.excerpt && (
                      <p className="text-sm sm:text-base text-[var(--color-muted-text)] leading-relaxed line-clamp-3">
                        {leadPost.excerpt}
                      </p>
                    )}

                    <div className="pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted-text)]">
                      <span className="font-bold text-[var(--color-heading)]">
                        By {leadPost.author?.name || "Kraviona Editorial Staff"}
                      </span>

                      <div className="flex items-center gap-3 font-mono text-[11px]">
                        {typeof leadPost.views === "number" && leadPost.views >= 10 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {leadPost.views.toLocaleString()} reads
                          </span>
                        )}
                        <span className="font-bold text-[var(--accent)]">Read →</span>
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            )}

            {/* Latest Articles Grid */}
            <section aria-label="Latest Articles" className="space-y-5">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
                <h2 className="font-mono text-xs font-black uppercase tracking-[0.14em] text-[var(--color-heading)]">
                  Latest Articles in {category.name}
                </h2>
                <span className="font-mono text-[11px] text-[var(--color-muted-text)]">
                  Page {pagination.page} of {pagination.pages}
                </span>
              </div>

              {gridPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {gridPosts.map((post: any) => (
                    <NewsCard
                      key={post._id}
                      post={post}
                      variant="classic-editorial"
                      showBadges={true}
                      showExcerpt={true}
                    />
                  ))}
                </div>
              ) : !leadPost ? (
                <div className="rounded-xl border border-dashed border-[var(--border)] p-12 text-center space-y-3 bg-[var(--color-card-background)]">
                  <h3 className="font-display text-base font-bold text-[var(--color-heading)]">
                    No dispatches published in {category.name} yet
                  </h3>
                  <p className="text-xs text-[var(--color-muted-text)] max-w-md mx-auto">
                    Our correspondents are compiling new briefings for this beat. Explore our archive or browse other intelligence desks.
                  </p>
                  <Link
                    href="/archive"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)] hover:underline pt-2"
                  >
                    Browse All Dispatches <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}

              {/* Clean Server-Side Pagination */}
              {pagination.pages > 1 && (
                <nav
                  aria-label="Category pagination"
                  className="pt-6 border-t border-[var(--border)] flex items-center justify-between gap-4"
                >
                  {pagination.hasPrev ? (
                    <Link
                      href={`/category/${category.slug}?page=${pagination.page - 1}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] hover:border-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition-colors"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)]/50 px-4 py-2 text-xs font-bold text-[var(--color-muted-text)] opacity-50 cursor-not-allowed">
                      <ChevronLeft className="h-3.5 w-3.5" />
                      <span>Previous</span>
                    </span>
                  )}

                  <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pg) => (
                      <Link
                        key={pg}
                        href={`/category/${category.slug}?page=${pg}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold transition-colors ${
                          pg === pagination.page
                            ? "bg-[var(--accent)] text-white"
                            : "border border-[var(--border)] bg-[var(--color-card-background)] text-[var(--color-heading)] hover:border-[var(--accent)]"
                        }`}
                      >
                        {pg}
                      </Link>
                    ))}
                  </div>

                  {pagination.hasNext ? (
                    <Link
                      href={`/category/${category.slug}?page=${pagination.page + 1}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] hover:border-[var(--accent)] px-4 py-2 text-xs font-bold text-[var(--color-heading)] transition-colors"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)]/50 px-4 py-2 text-xs font-bold text-[var(--color-muted-text)] opacity-50 cursor-not-allowed">
                      <span>Next</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </nav>
              )}
            </section>

            {/* Category FAQ Section */}
            <section className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <HelpCircle className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="font-mono text-xs font-black uppercase tracking-wider text-[var(--color-heading)]">
                  Desk Briefings &amp; Methodology · {category.name}
                </h2>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {categoryFaqs.map((faq: { question: string; answer: string }, idx: number) => (
                  <div key={idx} className="py-3.5 space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--color-heading)] flex items-start gap-2">
                      <span className="text-[var(--accent)] font-mono">Q:</span>
                      {faq.question}
                    </h3>
                    <p className="text-xs text-[var(--color-muted-text)] leading-relaxed pl-5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Editorial Sidebar (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending Stories */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="font-mono text-[11px] font-black uppercase tracking-wider text-[var(--color-heading)] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" /> Trending Now
                </h3>
                <span className="font-mono text-[10px] text-[var(--color-muted-text)] uppercase">
                  Most Read
                </span>
              </div>

              <div className="space-y-4">
                {trendingPosts.slice(0, 5).map((post: any, idx: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="flex items-start gap-3 group pb-3 border-b border-[var(--border)] last:border-b-0 last:pb-0"
                  >
                    <span className="text-xl font-editorial font-black text-[var(--accent)] shrink-0 leading-none mt-0.5 w-7">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h4 className="font-display text-xs font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--color-muted-text)] font-mono">
                        <span>{formatDate(post.publishedAt || post.createdAt, { month: "short", day: "numeric" })}</span>
                        <span>·</span>
                        <span>{post.readingTime || 5} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Subscription */}
            <KravionaNewsletter variant="sidebar" source={`category:${category.slug}`} />

            {/* Related Categories / Explore Desks */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4">
              <h3 className="font-mono text-[11px] font-black uppercase tracking-wider text-[var(--color-heading)] pb-2.5 border-b border-[var(--border)]">
                Related Categories
              </h3>

              <div className="flex flex-wrap gap-2">
                {EXPLORE_CATEGORIES_LIST.filter((c) => c.slug !== slug).map((cat) => (
                  <Link
                    key={cat.slug}
                    href={cat.href}
                    className="rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] hover:text-[var(--accent)] px-3 py-1.5 text-xs font-semibold text-[var(--color-heading)] transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>

              {allCategories.length > 0 && (
                <div className="pt-3 border-t border-[var(--border)] space-y-1.5">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] block mb-2">
                    Core Archives
                  </span>
                  {allCategories
                    .filter((c: { slug: string }) => c.slug !== slug)
                    .map((c: { _id: string; slug: string; name: string; postCount?: number }) => (
                      <Link
                        key={c._id}
                        href={`/category/${c.slug}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--color-main-background)] transition-colors group"
                      >
                        <span className="text-xs font-semibold text-[var(--color-heading)] group-hover:text-[var(--accent)]">
                          {c.name}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--color-muted-text)]">
                          {c.postCount || 0}
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </PublicShell>
  );
}
