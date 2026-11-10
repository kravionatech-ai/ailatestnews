import { Metadata } from "next";
import { BookOpen, Code2, Cpu, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "about" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/about",
    title: page?.seo?.metaTitle || page?.title || "About Kraviona AI News | Editorial Mission & Standards",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Learn about Kraviona AI News — an international artificial intelligence, technology, research, and innovation intelligence publication.",
  });
}

export default async function AboutPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "about" }).lean(),
      getGlobalSettings(),
    ]);
    pageRaw = p;
    settings = s;
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  const pillars = [
    {
      icon: Cpu,
      title: "Zero Fluff Architecture",
      desc: "We focus on verified system design, memory footprints, algorithmic complexity, and scalable distributed patterns.",
    },
    {
      icon: Code2,
      title: "Executable & Verified",
      desc: "Every code snippet is verified against current LTS runtimes and modern compiler constraints. If it doesn't run, we don't publish it.",
    },
    {
      icon: ShieldCheck,
      title: "Zero-CLS, WCAG AA Accessibility",
      desc: "Our reading interface is built for performance. Instant server rendering, minimal hydration overhead, and pristine typography.",
    },
  ];

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="border-b-2 border-[var(--color-heading)] pb-6 mb-8">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-3">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Kraviona Editorial Charter // Mission</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-[1.1]">
            {page?.title || "AI, Technology, Research & Innovation Intelligence"}
          </h1>

          <p className="mt-4 text-base sm:text-lg font-serif text-[var(--color-body-text)] leading-relaxed">
            {page?.excerpt ||
              "Kraviona AI News bridges frontier foundation-model research and real-world engineering deployment. We deliver verified reporting, deep technical analysis, and independent benchmarks for builders, researchers, and technology leaders worldwide."}
          </p>
        </div>

        {page?.contentHtml ? (
          <div
            className="prose-article text-base my-8 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <>
            <div className="my-10 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary-surface)] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
                      {p.title}
                    </h2>
                    <p className="text-xs leading-relaxed text-[var(--color-muted-text)]">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="prose-article text-base text-[var(--color-body-text)] leading-relaxed space-y-5">
              <h2>Verified Research &amp; Independent Benchmarks</h2>
              <p>
                Our reporting prioritizes verified reproducibility over press release hype. When new frontier models, agentic frameworks, or silicon architectures launch, our technical editors evaluate context windows, latency, inference economics, and production reliability for real engineering teams.
              </p>

              <h2>Peer Review &amp; Primary Sources</h2>
              <p>
                We welcome submissions and tips from AI researchers, founders, and systems engineers. Every claim is corroborated by primary sources—official model cards, arXiv preprints, open-weight repositories, or public filings—before publication.
              </p>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
