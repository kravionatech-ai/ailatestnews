import Link from "next/link";
import Image from "next/image";
import { Scale, ArrowRight, Clock, CheckCircle } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GuidesSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-12 sm:my-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 border border-violet-200/60 mb-2">
            <Scale className="h-3.5 w-3.5 text-violet-600" />
            Head-to-Head Benchmarks
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Guides &amp; Model Shootouts
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            Unbiased comparisons, token cost analysis, and actionable implementation tutorials
          </p>
        </div>
        <Link
          href="/category/guides-and-comparisons"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline self-start sm:self-end"
        >
          View all comparisons <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => {
          return (
            <article
              key={post._id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs hover:shadow-md hover:border-violet-300 transition-all"
            >
              <div>
                {/* Cover Image */}
                {post.coverImage && (
                  <div className="relative aspect-16/9 w-full overflow-hidden rounded-xl bg-[var(--background-secondary)] mb-4">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full bg-violet-700 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
                      <Scale className="h-3 w-3" /> Shootout &amp; Guide
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="font-bold text-violet-700 uppercase tracking-wider text-[11px]">
                    Detailed Comparison
                  </span>
                </div>

                <h3 className="font-bold text-lg sm:text-xl text-[var(--foreground)] tracking-tight group-hover:text-violet-700 transition-colors leading-snug line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" />
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-2.5 text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                {post.readingTime && (
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5 text-violet-600" />
                    {post.readingTime} min deep-dive
                  </span>
                )}
                <span className="font-semibold text-violet-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  View Full Verdict <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
