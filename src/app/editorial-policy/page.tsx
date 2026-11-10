import { Metadata } from "next";
import { ShieldCheck, Scale, Cpu, FileCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  let page: any = null;
  try {
    await connectDB();
    page = await Page.findOne({ slug: "editorial-policy" }).lean();
  } catch (err) {
    // Graceful fallback
  }

  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/editorial-policy",
    title: page?.seo?.metaTitle || page?.title || "Editorial Policy & Verification Standards | Kraviona AI News",
    excerpt:
      page?.seo?.metaDescription ||
      page?.excerpt ||
      "Read Kraviona AI News's independent benchmarking standards, conflict-of-interest policies, and fact-checking protocols.",
  });
}

export default async function EditorialPolicyPage() {
  let pageRaw: any = null;
  let settings: any = {};

  try {
    await connectDB();
    const [p, s] = await Promise.all([
      Page.findOne({ slug: "editorial-policy" }).lean(),
      getGlobalSettings(),
    ]);
    pageRaw = p;
    settings = s;
  } catch (err) {
    settings = await getGlobalSettings();
  }

  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--accent)] mb-3">
          <Scale className="h-3.5 w-3.5" />
          <span>Journalistic Integrity // Kraviona Standards</span>
        </div>

        <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-[var(--color-heading)] leading-[1.1] mb-4">
          {page?.title || "Editorial Policy & Technical Verification Standards"}
        </h1>

        <p className="text-base sm:text-lg font-serif text-[var(--color-body-text)] leading-relaxed mb-8 pb-6 border-b-2 border-[var(--color-heading)]">
          {page?.excerpt ||
            "Kraviona AI News maintains strict journalistic independence from cloud providers, foundation model labs, and venture-backed accelerator programs."}
        </p>

        {page?.contentHtml ? (
          <div
            className="prose-article text-base leading-relaxed space-y-6 text-[var(--color-body-text)]"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div className="prose-article text-base text-[var(--color-body-text)] leading-relaxed space-y-6">
            <h3>1. Independent Model Benchmarking</h3>
            <p>
              We evaluate foundation models, multimodal checkpoints, and local quantization runtimes on reproducible hardware baselines. We never accept sponsored benchmark modifications, curated prompts, or cherry-picked evaluation runs.
            </p>

            <h3>2. Sponsored Content &amp; Disclosures</h3>
            <p>
              Any collaborative or sponsored content is clearly marked with a persistent disclosure badge at the top of the article. Editorial reviews, comparisons, and rankings cannot be bought or influenced by commercial agreements.
            </p>

            <h3>3. Code &amp; Repositories</h3>
            <p>
              Tutorials, architectural guides, and implementation snippets must reference verifiable repositories or reproducible environments without undisclosed dependencies.
            </p>

            <h3>4. Corrections &amp; Updates</h3>
            <p>
              When a factual or technical error is discovered, we correct the article promptly and append an explicit correction notice detailing what was updated and the timestamp of revision.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
