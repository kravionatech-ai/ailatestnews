import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Layers,
  ChevronRight,
  TrendingUp,
  Calendar,
  Clock,
  Eye,
  HelpCircle,
  Mail,
  ArrowRight,
  Tag as TagIcon,
  ShieldCheck,
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
    title: `${category.name} — Latest AI News, Dispatches & Analysis`,
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
          className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap"
        >
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <Link href="/blog" className="hover:text-slate-900 transition-colors">
            Categories
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-semibold text-slate-900">{category.name}</span>
        </nav>

        {/* High-Impact Newsroom Beat Desk Header (Clean, 1px Border, No Neon Blur Blobs) */}
        <header className="rounded-2xl border border-slate-900 bg-white p-6 sm:p-10 mb-10 shadow-2xs">
          <div className="max-w-4xl space-y-4">
            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-wider text-white">
                <Layers className="h-3 w-3" /> Beat Desk
              </span>
              <span className="rounded-md bg-slate-100 border border-slate-200 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-700">
                {posts.length} Published Dispatches
              </span>
              <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Active Coverage
              </span>
            </div>

            {/* Title (H1) */}
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
              {category.name}
            </h1>

            {/* Subtitle / Excerpt */}
            {category.description && (
              <p className="text-base sm:text-lg text-slate-700 font-medium leading-relaxed">
                {category.description}
              </p>
            )}

            {/* Editorial Context */}
            <div
              className="pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl border-t border-slate-100"
              dangerouslySetInnerHTML={{ __html: categoryIntro }}
            />

            {/* Sub-Topic Entity Pills */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <TagIcon className="h-3 w-3" /> Topics:
              </span>
              {topicTags.map((t: { _id: string; name: string; slug: string }) => (
                <Link
                  key={t._id}
                  href={`/tag/${t.slug}`}
                  className="rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 font-mono text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 transition-colors"
                >
                  #{t.name}
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Main Two-Column Editorial Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Main Feed Column (8 cols) */}
          <main className="lg:col-span-8 space-y-10">
            {/* Featured Lead Story Showcase */}
            {leadPost && (
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-rose-600">
                    Lead Investigation in {category.name}
                  </h2>
                  <span className="font-mono text-[11px] text-slate-400">
                    Featured Dispatch
                  </span>
                </div>

                <article className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs hover:border-slate-400 transition-all duration-300">
                  {leadPost.coverImage && (
                    <div className="relative aspect-16/9 w-full overflow-hidden bg-slate-100 border-b border-slate-200">
                      <Image
                        src={leadPost.coverImage}
                        alt={leadPost.coverImageAlt || leadPost.title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-102"
                      />
                    </div>
                  )}

                  <div className="p-6 sm:p-8 space-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900">
                        {category.name}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-[11px]">
                        <Calendar className="h-3 w-3" />
                        {formatDate(leadPost.publishedAt || leadPost.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      <Link href={`/blog/${leadPost.slug}`}>
                        <span className="absolute inset-0 z-0" />
                        {leadPost.title}
                      </Link>
                    </h3>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
                      {leadPost.excerpt}
                    </p>

                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        By {leadPost.author?.name || "Editorial Staff"}
                      </span>

                      <div className="flex items-center gap-3">
                        {leadPost.readingTime && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Clock className="h-3 w-3" />
                            {leadPost.readingTime} min read
                          </span>
                        )}
                        {typeof leadPost.views === "number" && leadPost.views >= 10 && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Eye className="h-3 w-3" />
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
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                  All Dispatches in {category.name} ({secondaryPosts.length})
                </h2>
                <span className="font-mono text-[11px] text-slate-400">
                  Chronological Stream
                </span>
              </div>

              {secondaryPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {secondaryPosts.map((post: any) => (
                    <PostCard key={post._id} post={post} />
                  ))}
                </div>
              ) : !leadPost ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center space-y-3 bg-white">
                  <h3 className="text-base font-bold text-slate-900">
                    No articles published in {category.name} yet
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Our journalists are currently researching briefs for this topic. Check back shortly or browse other categories.
                  </p>
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 pt-2"
                  >
                    Browse all dispatches <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : null}
            </section>

            {/* Category FAQ Section */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4 shadow-2xs">
              <div className="flex items-center gap-2 border-b border-slate-900 pb-3">
                <HelpCircle className="h-4 w-4 text-slate-900" />
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900">
                  Frequently Asked Questions // {category.name}
                </h2>
              </div>

              <div className="divide-y divide-slate-100">
                {categoryFaqs.map((faq: { question: string; answer: string }, idx: number) => (
                  <div key={idx} className="py-3.5 space-y-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-start gap-2">
                      <span className="text-indigo-600 font-mono">Q:</span>
                      {faq.question}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed pl-5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar Column (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            {/* The Most Read in Topic */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-rose-600" /> The Most Read
                </h3>
                <span className="font-mono text-[10px] text-slate-400 uppercase">
                  This Week
                </span>
              </div>

              <div className="space-y-4">
                {trendingPosts.map((post: any, idx: number) => (
                  <Link
                    key={post._id}
                    href={`/blog/${post.slug}`}
                    className="flex items-start gap-3 group block pb-3 border-b border-slate-100 last:border-b-0 last:pb-0"
                  >
                    <span className="text-xl font-black text-slate-300 group-hover:text-slate-900 transition-colors shrink-0 font-mono leading-none mt-0.5 w-7">
                      0{idx + 1}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                        <span>{formatDate(post.publishedAt || post.createdAt)}</span>
                        <span>·</span>
                        <span>{post.readingTime || 5}m read</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Dispatch Card */}
            <div className="rounded-xl border border-slate-900 bg-slate-950 p-6 text-white shadow-2xs space-y-3.5">
              <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-400">
                <Mail className="h-3.5 w-3.5" />
                <span>The {category.name} Wire</span>
              </div>
              <h3 className="text-sm font-black text-white">
                Get the Weekly Intelligence Dispatch
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Direct insights on breakthrough AI models, benchmark analyses, and Indian sovereign compute updates.
              </p>
              <form action="/newsletter" method="GET" className="space-y-2">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Enter email address"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-rose-500"
                />
                <button
                  type="submit"
                  className="w-full rounded-lg bg-white py-2 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
              <span className="text-[10px] text-slate-400 block text-center">
                Strict privacy. Zero spam. Unsubscribe in 1 click.
              </span>
            </div>

            {/* Other Active Desks */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100">
                All Beat Desks
              </h3>
              <div className="space-y-1.5">
                {allCategories
                  .filter((c: { slug: string }) => c.slug !== slug)
                  .map((c: { _id: string; slug: string; name: string; postCount?: number }) => (
                    <Link
                      key={c._id}
                      href={`/category/${c.slug}`}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group"
                    >
                      <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
                        {c.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
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