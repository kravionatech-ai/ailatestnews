import Link from "next/link";
import Image from "next/image";
import { Wrench, ArrowRight, ExternalLink, Sparkles } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AiToolsSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-12 sm:my-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60 mb-2">
            <Wrench className="h-3.5 w-3.5 text-emerald-600" />
            Curated Productivity Stack
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            AI Tools for Developers &amp; Students
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            Hands-on reviews of generative developer tools, local runners, and study assistants
          </p>
        </div>
        <Link
          href="/category/ai-tools"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent)] hover:underline self-start sm:self-end"
        >
          View all tools <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post, idx) => {
          // Dynamic badges for tool cards
          const isFree = idx % 2 === 0;
          return (
            <article
              key={post._id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all"
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
                    <div className="absolute top-2.5 right-2.5 z-10 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      {isFree ? "Free & Open" : "Curated Tool"}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                    Developer Tooling
                  </span>
                  <span className="text-[11px] text-[var(--foreground-muted)]">
                    {post.readingTime ? `${post.readingTime} min guide` : "Review"}
                  </span>
                </div>

                <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] tracking-tight group-hover:text-[var(--accent)] transition-colors leading-snug line-clamp-2">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0 z-0" />
                    {post.title}
                  </Link>
                </h3>

                <p className="mt-2 text-xs sm:text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>Read Tool Review</span>
                <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
