import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, Calendar, Flag } from "lucide-react";
import { formatDate } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IndiaAiSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 border-b border-slate-200" aria-label="India AI Desk">
      {/* Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Flag className="h-3.5 w-3.5 text-rose-600" />
            <span>Desk 02 // Sovereign Compute &amp; India AI Mission</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            India AI &amp; Sovereign Infrastructure
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Tracking the ₹10,372 Cr IndiaAI Mission, domestic GPU clusters, and Indic frontier models.
          </p>
        </div>
        <Link
          href="/category/india-ai"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors self-start sm:self-end shrink-0"
        >
          <span>India AI Archive</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of 3 In-Depth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {posts.map((post) => {
          const dateVal = post.publishedAt || post.createdAt;
          return (
            <article
              key={post._id}
              className="group relative flex flex-col justify-between rounded-xl bg-white transition-all"
            >
              <div>
                {/* Cover Image */}
                {post.coverImage && (
                  <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-slate-100 border border-slate-200 mb-4 shadow-2xs">
                    <Image
                      src={post.coverImage}
                      alt={post.coverImageAlt || post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-102"
                    />
                    <div className="absolute top-2.5 left-2.5 z-10 rounded-md bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                      Indic AI
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-700">
                    Sovereign Tech
                  </span>
                  {dateVal && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(dateVal)}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base sm:text-lg text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" />
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                {post.readingTime && (
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min read
                  </span>
                )}
                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  Read Report <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
