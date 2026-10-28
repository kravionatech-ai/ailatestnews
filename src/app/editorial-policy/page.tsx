import { Metadata } from "next";
import { ShieldCheck, Scale, Cpu, FileCheck } from "lucide-react";
import { PublicShell } from "@/components/layout/public-shell";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { buildEntityMetadata } from "@/lib/seo/fallback";
import { getGlobalSettings } from "@/lib/db/queries/settings";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  await connectDB();
  const page = await Page.findOne({ slug: "editorial-policy" }).lean();
  return buildEntityMetadata({
    entityType: "page",
    entitySeo: page?.seo,
    path: "/editorial-policy",
    title: page?.seo?.metaTitle || page?.title || "Editorial Policy & Benchmarking Rigor | AI Latest News",
    excerpt:
      page?.seo?.metaDescription ||
      page?.excerpt ||
      "Read our independent benchmarking standards, conflict-of-interest policies, and fact-checking protocols.",
  });
}

export default async function EditorialPolicyPage() {
  await connectDB();
  const [pageRaw, settings] = await Promise.all([
    Page.findOne({ slug: "editorial-policy" }).lean(),
    getGlobalSettings(),
  ]);
  const page: any = pageRaw ? JSON.parse(JSON.stringify(pageRaw)) : null;

  return (
    <PublicShell navLinks={settings.navigation} footerConfig={settings.footer}>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          <Scale className="h-3.5 w-3.5 text-slate-900" />
          <span>Journalistic Integrity // Standards</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.12] mb-4">
          {page?.title || "Editorial Policy & Technical Verification Standards"}
        </h1>

        <p className="text-lg font-serif text-slate-700 leading-relaxed mb-8 pb-6 border-b border-slate-200">
          {page?.excerpt ||
            "AI Latest News maintains strict journalistic independence from cloud providers, foundation model labs, and venture-backed accelerator programs."}
        </p>

        {page?.contentHtml ? (
          <div
            className="prose-article text-sm leading-relaxed space-y-6"
            dangerouslySetInnerHTML={{ __html: page.contentHtml }}
          />
        ) : (
          <div className="prose-article text-base text-slate-800 leading-relaxed space-y-6">
            <h3>1. Independent Model Benchmarking</h3>
            <p>
              We evaluate foundation models, multimodal checkpoints, and local quantization runtimes on identical hardware clusters located in Indian datacenters. We never accept sponsored benchmark modifications, curated prompts, or cherry-picked evaluation runs.
            </p>

            <h3>2. Sponsored Content &amp; Disclosures</h3>
            <p>
              Any collaborative or sponsored content is clearly marked with a persistent disclosure badge at the top of the article. Editorial reviews, comparisons, and rankings cannot be bought or influenced by commercial agreements.
            </p>

            <h3>3. Code &amp; Repositories</h3>
            <p>
              Tutorials, architectural guides, and implementation snippets must provide verifiable GitHub repositories or Google Colab notebooks that execute cleanly in current Python LTS runtimes without hidden dependencies.
            </p>

            <h3>4. Corrections &amp; Updates</h3>
            <p>
              When a factual or technical error is discovered, we correct the article immediately and append an explicit correction notice detailing what was updated and the timestamp of revision.
            </p>
          </div>
        )}
      </div>
    </PublicShell>
  );
}
