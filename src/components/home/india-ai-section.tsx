import Link from "next/link";
import Image from "next/image";
import { Flag, ArrowRight, Clock, Calendar } from "lucide-react";
import { formatDate } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function IndiaAiSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-12 sm:my-16 rounded-3xl border border-amber-200/70 bg-gradient-to-b from-amber-50/30 via-white to-orange-50/20 p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200 mb-2">
            <Flag className="h-3.5 w-3.5 text-orange-600" />
            Sovereign Compute &amp; Indic NLP
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            India AI Ecosystem
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            Tracking the ₹10,372 Cr IndiaAI Mission, domestic GPUs, and Indic foundation models
          </p>
        </div>
        <Link
          href="/category/india-ai"
          className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:underline self-start sm:self-end"
        >
          Explore India AI Hub <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const dateVal = post.publishedAt || post.createdAt;
          return (
            <article
              key={post._id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all"
            >
              <div>
                {post.coverImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--background-secondary)] mb-4">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 z-10 rounded-md bg-orange-600/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Indic AI
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
                  <span className="font-semibold text-orange-700">
                    Sovereign Tech
                  </span>
                  {dateVal && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(dateVal)}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] tracking-tight group-hover:text-amber-700 transition-colors leading-snug line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" />
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                {post.readingTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readingTime} min
                  </span>
                )}
                <span className="font-semibold text-amber-700 group-hover:underline flex items-center gap-1">
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
