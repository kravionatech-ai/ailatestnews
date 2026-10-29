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
    <section className="py-10 sm:py-14 border-b border-slate-200" aria-label="Editorial Standards and Charter">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          <BookOpen className="h-3.5 w-3.5 text-slate-900" />
          <span>Editorial Charter &amp; Mission</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 mb-4">
          {title}
        </h2>

        {contentHtml ? (
          <div
            className="prose prose-slate text-sm sm:text-base text-slate-700 leading-relaxed space-y-4"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        ) : (
          <div className="prose prose-slate text-sm sm:text-base text-slate-700 leading-relaxed space-y-4">
            <p>
              <strong>AI Latest News</strong> is India&apos;s premier independent digital publication dedicated exclusively to artificial intelligence, foundation model engineering, and sovereign computing infrastructure. As global frontier labs compete on reasoning and multimodal architectures, our mission is to deliver fast, rigorous, and verified reporting tailored specifically for Indian software developers, startup founders, policy makers, and researchers.
            </p>

            <p>
              Our reporting is organized into six specialized desks: breaking global developments in{" "}
              <Link href="/category/ai-news" className="font-semibold text-slate-900 underline hover:text-indigo-600">
                AI News
              </Link>
              ; architecture and parameter teardowns in{" "}
              <Link href="/category/model-launches" className="font-semibold text-slate-900 underline hover:text-indigo-600">
                Model Launches
              </Link>
              ; vetted developer workflows and productivity software in{" "}
              <Link href="/category/ai-tools" className="font-semibold text-slate-900 underline hover:text-indigo-600">
                AI Tools
              </Link>
              ; in-depth coverage of the ₹10,372 crore IndiaAI Mission and domestic models like Sarvam and Krutrim in{" "}
              <Link href="/category/india-ai" className="font-semibold text-slate-900 underline hover:text-indigo-600">
                India AI
              </Link>
              ; rigorous head-to-head benchmarks in{" "}
              <Link href="/category/guides-and-comparisons" className="font-semibold text-slate-900 underline hover:text-indigo-600">
                Guides and Comparisons
              </Link>
              ; and production deployment architectures in{" "}
              <Link href="/category/enterprise-ai" className="font-semibold text-slate-900 underline hover:text-indigo-600">
                Enterprise AI
              </Link>
              . All claims and benchmarks are backed by primary source documentation and reproducible tests.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
