import Link from "next/link";
import Image from "next/image";
import { Building2, ArrowRight, Clock, ShieldCheck } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EnterpriseAiSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="my-12 sm:my-16 rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50/40 p-6 sm:p-10 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200 mb-2">
            <Building2 className="h-3.5 w-3.5 text-indigo-600" />
            Enterprise AI &amp; Prompt Engineering
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            Enterprise AI Architecture
          </h2>
          <p className="text-xs sm:text-sm text-[var(--foreground-muted)] mt-1">
            Production deployment patterns, prompt engineering frameworks, and foundational model concepts
          </p>
        </div>
        <Link
          href="/category/enterprise-ai"
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:underline self-start sm:self-end"
        >
          View Enterprise Hub <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => {
          return (
            <article
              key={post._id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all"
            >
              <div>
                {post.coverImage && (
                  <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[var(--background-secondary)] mb-4">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute top-2.5 left-2.5 z-10 rounded-md bg-indigo-600/95 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1">
                      <ShieldCheck className="h-2.5 w-2.5" /> Enterprise Guide
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="font-bold text-indigo-700 uppercase tracking-wider text-[11px]">
                    Production Architecture
                  </span>
                </div>

                <h3 className="font-bold text-base sm:text-lg text-[var(--foreground)] tracking-tight group-hover:text-indigo-700 transition-colors leading-snug line-clamp-2">
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
                    {post.readingTime} min read
                  </span>
                )}
                <span className="font-semibold text-indigo-700 group-hover:underline flex items-center gap-1">
                  Read Full Guide <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
