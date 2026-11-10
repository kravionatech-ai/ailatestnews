"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { subscribeNewsletterAction } from "@/actions/newsletter";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import { cn } from "@/lib/utils";

export interface NewsletterSectionProps {
  config?: HomepageSectionConfig;
  title?: string;
  subtitle?: string;
  kicker?: string;
  className?: string;
}

export function NewsletterSection({
  config,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  className,
}: NewsletterSectionProps = {}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const kicker = config?.kicker || kickerProp || "The Morning Wire // Curated Intelligence";
  const title = config?.title || titleProp || "The AI Latest News Daily Dispatch";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Join 15,000+ Indian engineers, founders, and researchers receiving verified morning briefings on new model weights, IndiaAI GPU tenders, and local tooling.";

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
        setStatus({
          type: "success",
          msg: res.message || "Thank you for subscribing to the Daily Dispatch.",
        });
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
      className={cn(
        "scroll-mt-24 my-10 sm:my-14 rounded-2xl border border-[var(--color-secondary-dark,#111C2E)] bg-[var(--color-primary-dark,#080D19)] p-8 sm:p-12 text-center text-white shadow-md relative overflow-hidden",
        className
      )}
      aria-label="Daily AI Intelligence Dispatch"
    >
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-secondary-accent,#34D399)] mb-3">
          <Mail className="h-3.5 w-3.5" />
          <span>{kicker}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
          {title}
        </h2>

        <p className="mt-3 text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          {subtitle}
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
            placeholder="Enter your email address"
            className="w-full rounded-xl border border-slate-700 bg-slate-900/90 px-4 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-[var(--color-primary-accent,#10B981)] focus:ring-1 focus:ring-[var(--color-primary-accent,#10B981)] transition-all"
            aria-label="Email address for AI newsletter"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto shrink-0 rounded-xl bg-[var(--color-primary-accent,#10B981)] hover:bg-[var(--color-accent-hover,#059669)] px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-950 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {loading ? "Joining..." : "Get Wire"}
          </button>
        </form>

        {status && (
          <div
            className={cn(
              "mt-4 inline-flex items-center gap-2 text-xs px-3.5 py-1.5 rounded-xl border",
              status.type === "success"
                ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                : "bg-rose-950 text-rose-300 border-rose-800"
            )}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span>{status.msg}</span>
          </div>
        )}

        <p className="mt-4 text-[11px] text-slate-400">
          Published Monday through Friday at 07:00 IST. Zero promotional spam. Unsubscribe in 1 click.
        </p>
      </div>
    </section>
  );
}

// Backward-compatibility alias
export { NewsletterSection as NewsletterBox };
