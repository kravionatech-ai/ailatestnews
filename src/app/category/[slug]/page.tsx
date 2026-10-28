import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Calendar,
  Clock,
  Eye,
  Rss,
  Share2,
  Cpu,
  CheckCircle2,
  HelpCircle,
  Mail,
  ArrowRight,
  Tag as TagIcon,
} from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { PostCard } from "@/components/blog/post-card";
import { getCategoryBySlug, getAllCategories, getAllTags } from "@/lib/db/queries/taxonomies";
import { getPublishedPosts } from "@/lib/db/queries/posts";
import { formatDate } from "@/lib/utils";
import { buildEntityMetadata, getSiteUrl } from "@/lib/seo/fallback";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) return { title: "Category Not Found | AI Latest News" };

  return buildEntityMetadata({
    entityType: "category",
    entitySeo: category.seo,
    path: `/category/${category.slug}`,
    title: category.name,
    category: category.name,
    excerpt: category.description || category.introHtml?.replace(/<[^>]+>/g, " ").slice(0, 160),
    coverImage: category.image,
  });
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) notFound();

  // Fetch category posts, trending posts, all categories for sidebar, and tags for sub-topics
  const [{ posts }, { posts: trendingPosts }, allCategories, allTags] = await Promise.all([
    getPublishedPosts({
      categorySlug: slug,
      limit: 15,
      sort: "latest",
    }),
    getPublishedPosts({
      limit: 4,
      sort: "popular",
    }),
    getAllCategories(),
    getAllTags(),
  ]);

  const siteUrl = getSiteUrl();
  const leadPost = posts[0];
  const secondaryPosts = posts.slice(1);

  // Sub-topics relevant to this category (top 6 tags)
  const topicTags = allTags.slice(0, 6);

  // Default rich intro if not configured in DB
  const categoryIntro =
    category.introHtml ||
    `<p>Welcome to <strong>${category.name}</strong> on AI Latest News. We provide rigorous, hands-on reporting on foundation models, algorithmic breakthroughs, and sovereign Indian AI initiatives. Our team stress-tests every release across local developer workflows, pricing models, and Indic language benchmarks.</p>`;

  // Category FAQs
  const categoryFaqs = category.faqs && category.faqs.length > 0 ? category.faqs : [
    {
      question: `How frequently is the ${category.name} hub updated?`,
      answer: `Our editorial team monitors arXiv preprints, model repositories, and developer releases continuously, publishing verified reports and benchmark updates multiple times each week.`,
    },
    {
      question: `Are all ${category.name} benchmarks tested on Indian hardware and pricing?`,
      answer: `Yes. Whenever pricing or latency benchmarks are cited, we calculate direct Indian Rupee (INR) costs, GST compliance, and local cloud latency via Indian datacenter regions.`,
    },
    {
      question: `Can researchers and startups submit news tips for ${category.name}?`,
      answer: `Absolutely. Indian AI researchers, founders, and engineers can submit whitepapers, benchmark data, and release announcements via our Editorial Desk for independent verification.`,
    },
  ];

  // Schema.org JSON-LD structured data
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
            name: "Categories",
            item: `${siteUrl}/blog`,
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
        name: `${category.name} - AI Latest News`,
        description: category.description,
        url: `${siteUrl}/category/${category.slug}`,
      },
      {
        "@type": "FAQPage",
        mainEntity: categoryFaqs.map((faq: { question: string; answer: string }) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <PublicShell>
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] mb-6 flex-wrap"
        >
          <Link href="/" className="hover:text-[var(--foreground)] transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href="/blog" className="hover:text-[var(--foreground)] transition-colors">
            Categories
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-[var(--foreground)]">{category.name}</span>
        </nav>

        {/* High-Impact Category Hero Header */}
        <header className="rounded-3xl border border-[var(--border)] bg-gradient-to-br from-white via-slate-50/50 to-indigo-50/20 p-6 sm:p-10 mb-10 shadow-xs relative overflow-hidden">
          {/* Ambient decorative glow */}
          <div
            className="absolute -right-20 -top-20 w-80 h-80 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ backgroundColor: category.color || "#4f46e5" }}
          />

          <div className="relative z-10 max-w-4xl space-y-4">
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-2xs"
                style={{ backgroundColor: category.color || "#4f46e5" }}
              >
                <Layers className="h-3.5 w-3.5" /> Pillar Hub
              </span>
              <span className="rounded-full bg-white border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--foreground-secondary)] shadow-2xs">
                {posts.length} In-Depth Dispatches
              </span>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Active Coverage
              </span>
            </div>

            {/* Title (H1) */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[var(--foreground)] leading-tight">
              {category.name}
            </h1>

            {/* Subtitle / Excerpt */}
            {category.description && (
              <p className="text-base sm:text-lg text-[var(--foreground-secondary)] font-medium leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Rich 100-150 Word Editorial Context */}
            <div
              className="pt-2 text-xs sm:text-sm text-[var(--foreground-muted)] leading-relaxed prose-sm max-w-3xl"
              dangerouslySetInnerHTML={{ __html: categoryIntro }}
            />

            {/* Sub-Topic / Entity Tag Pills */}
            <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-1">
                <TagIcon className="h-3 w-3" /> Related Topics:
              </span>
              {topicTags.map((t: { _id: string; name: string; slug: string }) => (
                <Link
                  key={t._id}
                  href={`/tag/${t.slug}`}
                  className="rounded-lg bg-white border border-[var(--border)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground-secondary)] hover:border-indigo-400 hover:text-indigo-600 transition-colors shadow-3xs"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Main Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          {/* Main Feed Column (8 cols) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Featured Lead Story Showcase */}
            {leadPost && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" /> Lead Story in {category.name}
                  </h2>
                  <span className="text-[11px] text-[var(--foreground-muted)]">
                    Editorially Featured
                  </span>
                </div>

                <article className="group relative rounded-3xl border border-[var(--border)] bg-white overflow-hidden shadow-xs hover:shadow-md transition-all duration-300">
                  {leadPost.coverImage && (
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                      <Image
                        src={leadPost.coverImage}
                        alt={leadPost.title}
                        fill
                        unoptimized
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-103"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="inline-block rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider shadow-sm mb-2">
                          {category.name}
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black leading-tight drop-shadow-sm">
                          <Link href={`/blog/${leadPost.slug}`}>
                            <span className="absolute inset-0" />
                            {leadPost.title}
                          </Link>
                        </h3>
                      </div>
                    </div>
                  )}

                  <div className="p-6 space-y-3">
                    <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed line-clamp-3">
                      {leadPost.excerpt}
                    </p>

                    <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--foreground-muted)]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[var(--foreground)]">
                          {leadPost.author?.name || "Editorial Team"}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(leadPost.publishedAt || leadPost.createdAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        {leadPost.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {leadPost.readingTime} min read
                          </span>
                        )}
                        {typeof leadPost.views === "number" && leadPost.views >= 100 && (
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {leadPost.views.toLocaleString()} reads
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            )}

            {/* Secondary Stories Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                  Latest Dispatches ({secondaryPosts.length})
                </h2>
                <span className="text-[11px] text-[var(--foreground-muted)]">
                  Sorted by Most Recent
                </span>
              </div>

              {secondaryPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {secondaryPosts.map((post: any) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              ) : !leadPost ? (
                <div className="rounded-3xl border border-dashed border-[var(--border)] p-12 text-center space-y-3 bg-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-[var(--foreground)]">
                    No articles published in {category.name} yet
                  </h3>
                  <p className="text-xs text-[var(--foreground-muted)] max-w-md mx-auto">
                    Our journalists are currently researching and verifying briefs for this topic. Check back shortly or browse other categories.
                  </p>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] hover:underline pt-2"
                  >
                    Browse all dispatches <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </section>

            {/* Category FAQ Section */}
            <section className="rounded-3xl border border-[var(--border)] bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3">
                <HelpCircle className="h-4 w-4 text-[var(--accent)]" />
                <h2 className="text-base font-extrabold text-[var(--foreground)]">
                  Frequently Asked Questions about {category.name}
                </h2>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {categoryFaqs.map((faq: { question: string; answer: string }, idx: number) => (
                  <div key={idx} className="py-3.5 space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--foreground)] flex items-start gap-2">
                      <span className="text-[var(--accent)] font-mono">Q:</span>
                      {faq.question}
                    </h3>
                    <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed pl-5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar Column (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Trending in Topic Widget */}
            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-rose-600" /> Trending AI Stories
                </h3>
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  High Traffic
                </span>
              </div>

              <div className="divide-y divide-[var(--border)]">
                {trendingPosts.map((post: any, idx: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="py-3 flex items-start gap-3 group block"
                  >
                    <span className="text-lg font-black text-slate-300 group-hover:text-[var(--accent)] transition-colors shrink-0 font-mono">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--foreground-muted)]">
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        <span>•</span>
                        <span>{post.readingTime || 5}m read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Dispatch Card */}
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/40 p-6 shadow-2xs space-y-3.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xs">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-extrabold text-[var(--foreground)]">
                Get the {category.name} Briefing
              </h3>
              <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                Direct insights on breakthrough AI models, benchmark analyses, and Indian sovereign compute updates delivered every Tuesday.
              </p>
              <form action="/newsletter" method="GET" className="space-y-2">
                <input
                  type="email"
                  required
                  placeholder="your.email@company.com"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs outline-none focus:border-indigo-600"
                />
                <button
                  type="submit"
                  className="w-full rounded-xl bg-indigo-600 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Subscribe to Briefing
                </button>
              </form>
              <span className="text-[10px] text-[var(--foreground-muted)] block text-center">
                Strict privacy. Zero spam. Unsubscribe anytime.
              </span>
            </div>

            {/* Other Active Pillars Widget */}
            <div className="rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)]">
                Explore Other Topical Hubs
              </h3>
              <div className="space-y-2">
                {allCategories
                  .filter((c: { slug: string }) => c.slug !== slug)
                  .map((c: { _id: string; slug: string; name: string; color?: string; postCount?: number }) => (
                    <Link
                      key={c._id}
                      href={`/category/${c.slug}`}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.color || "#4f46e5" }}
                        />
                        <span className="text-xs font-semibold text-[var(--foreground)] group-hover:text-indigo-600 transition-colors">
                          {c.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--foreground-muted)]">
                        {c.postCount || 0}
                      </span>
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
