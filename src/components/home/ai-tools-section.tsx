import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Wrench, Clock, ExternalLink } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AiToolsSection({ posts }: { posts: any[] }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 border-b border-slate-200" aria-label="AI Tools Desk">
      {/* Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-slate-900">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <Wrench className="h-3.5 w-3.5 text-slate-900" />
            <span>Desk 03 // Developer Gear &amp; Software Evaluations</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            Developer Tooling &amp; Workflows
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Hands-on evaluations of local LLM runners, AI code refactoring assistants, and agentic environments.
          </p>
        </div>
        <Link
          href="/category/ai-tools"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-slate-900 hover:text-indigo-600 transition-colors self-start sm:self-end shrink-0"
        >
          <span>All Tools</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Grid of 3 In-Depth Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {posts.map((post, idx) => {
          const isFree = idx % 2 === 0;
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
                    <div className="absolute top-2.5 right-2.5 z-10 rounded-md bg-slate-900/90 backdrop-blur-xs px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
                      {isFree ? "Open Source" : "Evaluated"}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-mono text-[11px] font-semibold text-slate-700">
                    Developer Workflow
                  </span>
                  <span className="text-[11px]">
                    {post.readingTime ? `${post.readingTime} min review` : "Guide"}
                  </span>
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
                    {post.readingTime} min
                  </span>
                )}
                <span className="font-semibold text-slate-900 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all inline-flex items-center gap-1">
                  Read Evaluation <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
