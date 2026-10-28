import Link from "next/link";
import Image from "next/image";
import { Cpu, Calendar, ArrowRight, Layers } from "lucide-react";
import { formatDate } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ModelLaunchesSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-12 sm:my-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200/60 mb-2">
            <Cpu className="h-3.5 w-3.5 text-sky-600" />
            Foundation Models &amp; Open Weights
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            New Model Launches
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            Track weights releases, architecture disclosures, and benchmark results
          </p>
        </div>
        <Link
          href="/category/model-launches"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline self-start sm:self-end"
        >
          View all launches <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => {
          const dateVal = post.publishedAt || post.createdAt;
          return (
            <article
              key={post._id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all"
            >
              <div>
                {/* Cover Image */}
                {post.coverImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--background-secondary)] mb-4">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 z-10 rounded-md bg-slate-900/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                      Weights Release
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-[var(--foreground-muted)] mb-2">
                  <span className="inline-flex items-center gap-1 font-semibold text-sky-700">
                    <Layers className="h-3 w-3" />
                    Model Architecture
                  </span>
                  {dateVal && (
                    <span className="flex items-center gap-1 text-[11px]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(dateVal)}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" />
                    {post.title}
                  </Link>
                </h3>

                {/* One line summary */}
                <p className="mt-2 text-xs sm:text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--foreground-muted)]">
                <span className="font-semibold text-sky-600 group-hover:text-sky-700">
                  Read Technical Breakdown
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-sky-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
