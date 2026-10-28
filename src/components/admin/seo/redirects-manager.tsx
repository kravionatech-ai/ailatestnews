"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  createRedirectAction,
  deleteRedirectAction,
  toggleRedirectAction,
} from "@/actions/redirects";

interface RedirectItem {
  _id: string;
  from: string;
  to: string;
  type: 301 | 302;
  hits: number;
  isActive: boolean;
  note?: string;
  createdAt: string;
}

interface RedirectsManagerProps {
  initialRedirects: RedirectItem[];
}

export function RedirectsManager({ initialRedirects }: RedirectsManagerProps) {
  const router = useRouter();
  const [redirects, setRedirects] = useState<RedirectItem[]>(initialRedirects);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [type, setType] = useState<"301" | "302">("301");
  const [note, setNote] = useState("");

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("from", from);
    formData.set("to", to);
    formData.set("type", type);
    formData.set("note", note);

    startTransition(async () => {
      const res = await createRedirectAction(formData);
      if (res.success) {
        setFrom("");
        setTo("");
        setNote("");
        setFeedback({ type: "success", message: `Redirect for "${from}" created successfully.` });
        setTimeout(() => setFeedback(null), 4000);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to create redirect." });
      }
    });
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const res = await toggleRedirectAction(id);
      if (res.success) {
        setRedirects((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isActive: res.isActive ?? !r.isActive } : r))
        );
        router.refresh();
      }
    });
  };

  const handleDelete = (id: string, path: string) => {
    if (!confirm(`Are you sure you want to delete the redirect for "${path}"?`)) return;
    startTransition(async () => {
      const res = await deleteRedirectAction(id);
      if (res.success) {
        setRedirects((prev) => prev.filter((r) => r._id !== id));
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Feedback banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-semibold transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Create Redirect Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Plus className="h-4 w-4 text-indigo-600" />
          Create New URL Redirect
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Source Path (From)
              </label>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="/old-path or /category/old-slug"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Target Destination (To)
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="/new-path or https://external.com"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Redirect Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "301" | "302")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="301">301 Permanent</option>
                <option value="302">302 Temporary</option>
              </select>
            </div>

            <div className="sm:col-span-2 pt-5">
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPending ? (
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Plus className="h-3.5 w-3.5" />
                )}
                <span>Add Rule</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Internal Note / Context (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Migrated post slug during pillar restructuring"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </form>
      </div>

      {/* Redirects Table */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-bold text-slate-900">Active Redirect Rules ({initialRedirects.length})</span>
          </div>
          <span className="text-xs text-slate-500">Auto 301 rules are generated on slug edits</span>
        </div>

        {initialRedirects.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No active redirect rules found. Create one above or rename any post/category slug to generate auto-redirects.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Source (From)</th>
                  <th className="px-4 py-3">Destination (To)</th>
                  <th className="px-4 py-3">Status Code</th>
                  <th className="px-4 py-3">Hits</th>
                  <th className="px-4 py-3">State</th>
                  <th className="px-4 py-3">Note</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {initialRedirects.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{r.from}</td>
                    <td className="px-4 py-3 font-mono text-indigo-600">
                      <a href={r.to} target="_blank" rel="noreferrer" className="hover:underline inline-flex items-center gap-1">
                        {r.to} <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.type === 301 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">{r.hits || 0}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleToggle(r._id)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                          r.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{r.note || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(r._id, r.from)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete redirect"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
