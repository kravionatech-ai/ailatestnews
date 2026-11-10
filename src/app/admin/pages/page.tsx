import Link from "next/link";
import { Plus, Edit3, ExternalLink, Trash2, Layers, Globe } from "lucide-react";
import { connectDB } from "@/lib/db/connection";
import { Page } from "@/lib/db/models";
import { formatDate } from "@/lib/utils";
import { deletePageAction, ensureCorePagesExist } from "@/actions/pages";

export const dynamic = "force-dynamic";

export default async function AdminPagesPage() {
  await connectDB();
  await ensureCorePagesExist();

  const pages = await Page.find().sort({ order: 1, title: 1 }).lean();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--color-heading)]">
            Standalone Pages Hub
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1">
            Author and govern standalone pages (Home, About, Editorial Policy, Tools, Timeline) with dedicated SEO metadata.
          </p>
        </div>

        <Link
          href="/admin/pages/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="h-4 w-4" /> New Page
        </Link>
      </div>

      {/* Pages Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--color-secondary-surface)] text-[var(--color-muted-text)] uppercase tracking-wider font-semibold">
                <th className="p-4">Page Title &amp; Slug</th>
                <th className="p-4">Template</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">SEO Score</th>
                <th className="p-4">Navigation</th>
                <th className="p-4">Last Updated</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {pages.map((p) => {
                const seoScore = p.seo?.seoScore ?? 85;
                const publicUrl = p.slug === "home" ? "/" : `/${p.slug}`;

                async function handleDelete() {
                  "use server";
                  await deletePageAction(p._id.toString());
                }

                return (
                  <tr
                    key={p._id.toString()}
                    className="hover:bg-[var(--color-secondary-surface)]/50 transition-colors group"
                  >
                    <td className="p-4 max-w-sm">
                      <Link
                        href={`/admin/pages/${p._id.toString()}/edit`}
                        className="font-bold text-[var(--color-heading)] hover:text-[var(--accent)] transition-colors block"
                      >
                        {p.title}
                      </Link>
                      <span className="text-[10px] text-[var(--color-muted-text)] font-mono">
                        {publicUrl}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="rounded-lg bg-[var(--color-secondary-surface)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-body-text)] capitalize">
                        {p.template}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] capitalize border ${
                          p.status === "published"
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                            : "bg-[var(--color-secondary-surface)] text-[var(--color-muted-text)] border-[var(--border)]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center font-extrabold text-[11px] px-2 py-0.5 rounded-full ${
                          seoScore >= 80
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                            : "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {seoScore}
                      </span>
                    </td>

                    <td className="p-4 text-[10px] text-[var(--color-muted-text)]">
                      {p.showInMenu && <span className="mr-1.5 font-medium text-[var(--accent)]">Header</span>}
                      {p.showInFooter && <span className="font-medium text-[var(--color-body-text)]">Footer</span>}
                      {!p.showInMenu && !p.showInFooter && <span>Unlinked</span>}
                    </td>

                    <td className="p-4 text-[var(--color-muted-text)]">
                      {formatDate(p.updatedAt || p.createdAt)}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-[var(--color-muted-text)] hover:text-sky-600 hover:bg-sky-500/10 transition-colors"
                          title="View Live Page"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>

                        <Link
                          href={`/admin/pages/${p._id.toString()}/edit`}
                          className="p-1.5 rounded-lg text-[var(--color-muted-text)] hover:text-[var(--accent)] hover:bg-[var(--color-secondary-surface)] transition-colors"
                          title="Edit Page & SEO"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Link>

                        {p.slug !== "home" && (
                          <form action={handleDelete}>
                            <button
                              type="submit"
                              className="p-1.5 rounded-lg text-[var(--color-muted-text)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete Page"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
