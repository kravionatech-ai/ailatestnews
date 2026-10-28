import Link from "next/link";
import { BookOpen } from "lucide-react";

export interface SiteIntroProps {
  title?: string;
  contentHtml?: string;
}

export function SiteIntroSection({
  title = "Independent Intelligence for India's AI Ecosystem",
  contentHtml,
}: SiteIntroProps = {}) {
  return (
    <section className="my-12 sm:my-16 rounded-3xl border border-[var(--border)] bg-gradient-to-r from-slate-50 via-white to-indigo-50/30 p-6 sm:p-10 shadow-2xs">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-700">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
            About AI Latest News
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--foreground)] mb-4">
          {title}
        </h2>

        {contentHtml ? (
          <div
            className="prose prose-sm text-sm sm:text-base text-[var(--foreground-secondary)] leading-relaxed space-y-3"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <div className="prose prose-sm text-sm sm:text-base text-[var(--foreground-secondary)] leading-relaxed space-y-3">
            <p>
              <strong>AI Latest News</strong> (ailatestnews.in) is India&apos;s premier digital publication dedicated exclusively to artificial intelligence, foundation model engineering, and sovereign computing infrastructure. As global frontier labs compete on reasoning and multimodal architectures, our mission is to deliver fast, rigorous, and unbiased analysis tailored specifically for Indian software developers, startup founders, policy makers, and students.
            </p>

            <p>
              Our reporting is structured into six comprehensive hubs: breaking global developments in{" "}
              <Link href="/category/ai-news" className="font-semibold text-[var(--accent)] hover:underline">
                AI News
              </Link>
              ; architecture and parameter teardowns in{" "}
              <Link href="/category/model-launches" className="font-semibold text-[var(--accent)] hover:underline">
                Model Launches
              </Link>
              ; vetted developer workflows and productivity software in{" "}
              <Link href="/category/ai-tools" className="font-semibold text-[var(--accent)] hover:underline">
                AI Tools
              </Link>
              ; in-depth coverage of the ₹10,372 crore IndiaAI Mission and domestic models like Sarvam and Krutrim in{" "}
              <Link href="/category/india-ai" className="font-semibold text-[var(--accent)] hover:underline">
                India AI
              </Link>
              ; rigorous head-to-head benchmarks in{" "}
              <Link href="/category/guides-and-comparisons" className="font-semibold text-[var(--accent)] hover:underline">
                Guides and Comparisons
              </Link>
              ; and production deployment architectures in{" "}
              <Link href="/category/enterprise-ai" className="font-semibold text-[var(--accent)] hover:underline">
                Enterprise AI
              </Link>
              . We believe high-tier technical knowledge should be universally accessible across the subcontinent.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
