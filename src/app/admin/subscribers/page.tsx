import { Download, Users, Mail, CheckCircle2 } from "lucide-react";
import { connectDB } from "@/lib/db/connection";
import { Subscriber } from "@/lib/db/models";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSubscribersPage() {
  await connectDB();

  const subscribers = await Subscriber.find()
    .sort({ createdAt: -1 })
    .lean();

  const activeCount = subscribers.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            Newsletter Subscribers
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            {activeCount} active readers receiving weekly technical dispatches.
          </p>
        </div>

        <a
          href="/api/subscribers/export"
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all shadow-2xs self-start sm:self-auto"
        >
          <Download className="h-4 w-4" /> Export CSV
        </a>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-white shadow-2xs overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">
              <th className="p-4">Subscriber</th>
              <th className="p-4">Status</th>
              <th className="p-4">Origin Source</th>
              <th className="p-4">Subscribed Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {subscribers.map((sub) => (
              <tr key={sub._id.toString()} className="hover:bg-[var(--background-secondary)] transition-colors">
                <td className="p-4">
                  <p className="font-semibold text-[var(--foreground)]">
                    {sub.email}
                  </p>
                  {sub.name && (
                    <span className="text-[10px] text-[var(--foreground-muted)]">
                      {sub.name}
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                      sub.status === "active"
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" /> {sub.status}
                  </span>
                </td>
                <td className="p-4 text-[var(--foreground-secondary)]">
                  {sub.source || "organic-website"}
                </td>
                <td className="p-4 text-[var(--foreground-muted)]">
                  {formatDate(sub.subscribedAt || sub.createdAt)}
                </td>
              </tr>
            ))}

            {subscribers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-xs text-[var(--foreground-muted)]">
                  <Mail className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  No email subscribers registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
