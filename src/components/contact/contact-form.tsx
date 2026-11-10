"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactMessageAction } from "@/actions/contact";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const fd = new FormData(e.currentTarget);
    const res = await submitContactMessageAction(fd);

    setLoading(false);
    if (res.success) {
      setSubmitted(true);
    } else {
      setErrorMessage(res.error || "Failed to deliver message. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 p-8 text-center text-emerald-900 dark:text-emerald-200 animate-in fade-in-50">
        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600 dark:text-emerald-400 mb-3" />
        <h3 className="font-display text-lg font-bold">Transmission Received</h3>
        <p className="mt-1.5 text-xs opacity-90">
          Thank you for reaching out to Kraviona AI News. An editor will review your message within 24 business hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 sm:p-8 shadow-xs space-y-4"
    >
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Alex Rivera"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-3.5 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="alex@company.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-3.5 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          required
          placeholder="AI news tip / Research inquiry / Editorial pitch"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-3.5 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5">
          Message Body
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Provide detailed context, arXiv link, or benchmark methodology..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] p-3.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none focus:border-[var(--accent)]"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            <Send className="h-4 w-4" /> Dispatch Message
          </>
        )}
      </button>
    </form>
  );
}
