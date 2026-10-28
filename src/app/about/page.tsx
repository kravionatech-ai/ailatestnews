import { Metadata } from "next";
import { BookOpen, Code2, Cpu, ShieldCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "about" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/about",
    title: page?.seo?.metaTitle || page?.title || "About AI Latest News | Editorial Mission & Standards",
    excerpt: page?.seo?.metaDescription || page?.excerpt || "Learn about AI Latest News, India's dedicated artificial intelligence editorial platform, model benchmark standards, and technology journalism values.",
  });
}

export default async function AboutPage() {
  await connectDB();
  const [pageRaw, settings] = await Promise.all([
    Page.findOne({ slug: "about" }).lean(),
    getGlobalSettings(),
  ]);
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
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-light)] text-[var(--accent)]">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            Our Mission
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.15]">
          {page?.title || "A Digital Publication Engineered for Real Builders"}
        </h1>

        <p className="mt-6 text-lg text-[var(--foreground-secondary)] leading-relaxed">
          {page?.excerpt ||
            "AI Latest News was founded to bridge the gap between high-level foundation model research and practical deployment for Indian developers, enterprises, and startups. We deliver rigorous, verified benchmarks and independent news dispatches."}
        </p>

        {page?.contentHtml ? (
          <div
            className="prose-article text-base my-8"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <>
            <div className="my-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              {pillars.map((p, idx) => {
                const Icon = p.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-3"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--background-secondary)] text-[var(--accent)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--foreground)]">
                      {p.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="prose-article text-base">
              <h2>Our Technology Stack</h2>
              <p>
                The platform itself is a showcase of state-of-the-art web engineering: Next.js App Router, React 19 Server Components, MongoDB Atlas with connection pooling, Auth.js RBAC, Lenis smooth scrolling, and dynamic next/og image synthesis.
              </p>

              <h2>Contributing &amp; Peer Review</h2>
              <p>
                We welcome technical contributions from staff engineers, researchers, and open-source maintainers. All submissions undergo double-blind technical review before publication.
              </p>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
