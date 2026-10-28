import { Image as ImageIcon, Upload, Copy, ExternalLink } from "lucide-react";
import { connectDB } from "@/lib/db/connection";
import { Media } from "@/lib/db/models";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  await connectDB();
  const mediaItems = await Media.find().sort({ createdAt: -1 }).lean();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            Media &amp; CDN Assets
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            Optimized AVIF/WebP assets, Cloudinary integration, and blurhash placeholders.
          </p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow-2xs hover:bg-[var(--accent-hover)] transition-all self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" /> Upload Asset
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {mediaItems.map((item) => (
          <div
            key={item._id.toString()}
            className="group rounded-2xl border border-[var(--border)] bg-white p-3 shadow-2xs space-y-2 hover:border-[var(--accent)] transition-all"
          >
            <div className="aspect-video w-full rounded-xl bg-slate-100 overflow-hidden relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.alt || item.filename}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="text-xs">
              <p className="font-semibold text-[var(--foreground)] truncate">
                {item.filename}
              </p>
              <span className="text-[10px] text-[var(--foreground-muted)] block">
                {item.format?.toUpperCase()} • {Math.round((item.size || 0) / 1024)} KB
              </span>
            </div>
          </div>
        ))}

        {mediaItems.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--foreground-muted)]">
            <ImageIcon className="h-8 w-8 mx-auto text-slate-300 mb-2" />
            No uploaded media assets yet.
          </div>
        )}
      </div>
    </div>
  );
}
