"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { subscribeNewsletterAction } from "@/actions/newsletter";

export function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("email", email);

    try {
      const res = await subscribeNewsletterAction(formData);
      if (res.success) {
        setStatus({ type: "success", msg: res.message || "Thank you for subscribing!" });
        setEmail("");
      } else {
        setStatus({ type: "error", msg: res.error || "Failed to subscribe" });
      }
    } catch {
      setStatus({ type: "error", msg: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="newsletter"
      className="scroll-mt-24 my-16 rounded-3xl border border-indigo-100 bg-gradient-to-b from-white via-indigo-50/20 to-[var(--background-secondary)] p-8 sm:p-12 text-center shadow-xs"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mb-4 shadow-2xs">
        <Mail className="h-6 w-6" />
      </div>
      <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60 mb-3">
        <Sparkles className="h-3.5 w-3.5" />
        Weekly India AI Digest
      </div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
        Never Miss an AI Breakthrough in India
      </h2>
      <p className="mt-2 text-sm text-[var(--foreground-secondary)] max-w-lg mx-auto leading-relaxed">
        Join 15,000+ Indian engineers, founders, and researchers receiving our weekly teardowns of new foundation models, GPU compute subsidies, and local tooling. Zero spam.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 max-w-md mx-auto"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-indigo-100 transition-all shadow-2xs"
          aria-label="Email address for AI newsletter"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto flex-shrink-0 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-2xs hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Joining..." : "Subscribe"}
        </button>
      </form>

      {status && (
        <div
          className={`mt-4 inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-xl ${
            status.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {status.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      <p className="mt-3 text-[11px] text-[var(--foreground-muted)]">
        By subscribing, you agree to our <a href="/privacy" className="underline hover:text-indigo-600">Privacy Policy</a>. Unsubscribe anytime in 1 click.
      </p>
    </section>
  );
}
