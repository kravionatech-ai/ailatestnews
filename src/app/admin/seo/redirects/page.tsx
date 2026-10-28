import { connectDB } from "@/lib/db/connection";
import { Redirect } from "@/lib/db/models";
import { RedirectsManager } from "@/components/admin/seo/redirects-manager";

export const dynamic = "force-dynamic";

export default async function AdminRedirectsPage() {
  await connectDB();
  const rawRedirects = await Redirect.find().sort({ createdAt: -1 }).lean();

  const redirects = rawRedirects.map((r: any) => ({
    _id: r._id.toString(),
    from: r.from,
    to: r.to,
    type: r.type,
    hits: r.hits || 0,
    isActive: r.isActive,
    note: r.note || "",
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
          Redirects &amp; 301 Engine
        </h1>
        <p className="text-xs text-[var(--foreground-muted)] mt-1">
          Manage permanent 301 and temporary 302 HTTP redirects, preserve link equity, and prevent broken 404 links.
        </p>
      </div>

      <RedirectsManager initialRedirects={redirects} />
    </div>
  );
}
