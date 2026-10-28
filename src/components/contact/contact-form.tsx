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
      <div className="rounded-3xl border border-[var(--border)] bg-green-50 p-8 text-center text-green-800 animate-in fade-in-50">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-600 mb-3" />
        <h3 className="text-lg font-bold">Transmission Received</h3>
        <p className="mt-1 text-xs">
          Thank you for reaching out. An editor will review your message within 24 business hours.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[var(--border)] bg-white p-8 shadow-xs space-y-4"
    >
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
            Your Name
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Sarah Connor"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            placeholder="sarah@example.com"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
          Subject
        </label>
        <input
          type="text"
          name="subject"
          required
          placeholder="AI News tip / Research inquiry / Pitch"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--foreground-secondary)] mb-1">
          Message Body
        </label>
        <textarea
          name="message"
          required
          rows={5}
          placeholder="Provide detailed context, arXiv link, or benchmark methodology..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3.5 text-sm outline-none focus:border-[var(--accent)]"
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
