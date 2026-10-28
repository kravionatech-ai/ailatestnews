"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Calendar, Flame, TrendingUp, BookOpen } from "lucide-react";
import { formatDate, formatRelativeTime } from "@/lib/utils";

export interface HeroProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  featuredPost?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  secondaryPosts?: any[];
  badge?: string;
  title?: string;
  subtitle?: string;
  onOpenChat?: () => void;
}

export function Hero({
  featuredPost,
  secondaryPosts = [],
  badge = "India's Sovereign AI & Generative Tech Hub",
  title = "Latest AI News, Tools and Launches, Explained for India",
  subtitle = "Independent reporting, hands-on model evaluations, and sovereign compute analysis.",
  onOpenChat,
}: HeroProps = {}) {
  // Fallback if no featured post is loaded yet
  const leadPost = featuredPost || secondaryPosts[0] || null;
  const wirePosts = featuredPost ? secondaryPosts.slice(0, 3) : secondaryPosts.slice(1, 4);

  const trendingTopics = [
    { label: "IndiaAI 10k GPUs", href: "/blog/india-10000-gpus-national-ai-mission-tender" },
    { label: "DeepSeek-R1", href: "/blog/deepseek-r1-disrupts-global-ai-economics-silicon-valley-india" },
    { label: "Claude 5.5", href: "/blog/anthropic-claude-opus-5-5-sonnet-5-5-release" },
    { label: "Gemini 4 Argon", href: "/blog/google-deepmind-gemini-4-argon-1-million-output-tokens" },
    { label: "Sarvam Defence MoU", href: "/blog/sarvam-ai-five-year-defence-pact-indian-armed-forces" },
    { label: "L&T Vyoma Datacenter", href: "/blog/l-and-t-breaks-ground-52mw-ai-datacenter-chennai-vyoma" },
  ];

  return (
    <section className="border-b border-slate-200 bg-white pt-6 pb-10" aria-label="Lead Editorial Stories">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Trending In-Focus Topics Bar ── */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-slate-100 pb-3 text-xs">
          <span className="flex items-center gap-1 font-mono text-[11px] font-black uppercase tracking-wider text-rose-600 shrink-0">
            <Flame className="h-3.5 w-3.5 fill-current" />
            In Focus:
          </span>
          <div className="flex items-center gap-2 text-slate-600 font-medium whitespace-nowrap">
            {trendingTopics.map((topic, i) => (
              <span key={topic.label} className="flex items-center gap-2">
                <Link
                  href={topic.href}
                  className="rounded-md bg-slate-100/80 hover:bg-slate-200/80 hover:text-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors"
                >
                  #{topic.label}
                </Link>
                {i < trendingTopics.length - 1 && <span className="text-slate-300">·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* ── Magazine Grid: Lead Story (8 cols) + The Wire (4 cols) ── */}
        {leadPost ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 1. Main Cover Investigation (8 cols) */}
            <article className="lg:col-span-8 group relative flex flex-col justify-between">
              <div>
                {/* Large Photo */}
                {leadPost.coverImage && (
                  <div className="relative aspect-16/9 w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200 mb-5 shadow-2xs">
                    <Image
                      src={leadPost.coverImage}
                      alt={leadPost.coverImageAlt || leadPost.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                      <span className="rounded-md bg-slate-900/90 backdrop-blur-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-xs">
                        {leadPost.category?.name || "Featured Story"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Editorial Kicker & Date */}
                <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-slate-500 mb-2.5">
                  <span className="font-bold text-indigo-600">Special Dispatch</span>
                  <span>·</span>
                  <span>{formatDate(leadPost.publishedAt || leadPost.createdAt)}</span>
                  {leadPost.readingTime && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 normal-case font-sans">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {leadPost.readingTime} min read
                      </span>
                    </>
                  )}
                </div>

                {/* Main Editorial Headline */}
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] group-hover:text-indigo-600 transition-colors">
                  <Link href={`/blog/${leadPost.slug}`}>
                    <span className="absolute inset-0 z-0" />
                    {leadPost.title}
                  </Link>
                </h1>

                {/* Excerpt / Lead Paragraph */}
                <p className="mt-3.5 text-base sm:text-lg text-slate-600 leading-relaxed font-normal line-clamp-3">
                  {leadPost.excerpt}
                </p>

                {/* Author Byline */}
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] font-mono">
                      AI
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {leadPost.author?.name || "AI Latest News Editorial Team"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Senior Technology Desk
                      </span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <span>Full Analysis</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </article>

            {/* 2. The Frontline Wire (4 cols): Developing Secondary Stories */}
            <aside className="lg:col-span-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-600" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 font-mono">
                    The Developing Wire
                  </h2>
                </div>
                <Link href="/blog" className="text-[11px] font-bold text-indigo-600 hover:underline">
                  All Dispatches →
                </Link>
              </div>

              <div className="divide-y divide-slate-200/80">
                {wirePosts.map((post) => {
                  const dateVal = post.publishedAt || post.createdAt;
                  return (
                    <article key={post._id} className="py-4 first:pt-1 last:pb-1 group relative">
                      <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        <span className="font-bold text-indigo-600">{post.category?.name || "Update"}</span>
                        <span>{formatRelativeTime(dateVal)}</span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                        <Link href={`/blog/${post.slug}`}>
                          <span className="absolute inset-0 z-0" />
                          {post.title}
                        </Link>
                      </h3>

                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {post.excerpt}
                      </p>

                      <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                        {post.readingTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {post.readingTime} min
                          </span>
                        )}
                        <span>·</span>
                        <span className="font-semibold text-slate-700 group-hover:text-indigo-600">
                          Read dispatch →
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>
          </div>
        ) : (
          /* Editorial Headline Fallback */
          <div className="text-center py-10 max-w-2xl mx-auto space-y-3">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
            <p className="text-slate-600 text-sm leading-relaxed">{subtitle}</p>
          </div>
        )}
      </div>
    </section>
  );
}
