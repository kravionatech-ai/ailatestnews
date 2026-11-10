"use client";

import { useState } from "react";
import { Mail, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { subscribeNewsletterAction } from "@/actions/newsletter";
import { cn } from "@/lib/utils";

interface NewsletterBannerProps {
  variant?: "banner" | "sidebar";
  source?: string;
  className?: string;
}

export function KravionaNewsletter({
  variant = "banner",
  source = "homepage",
  className,
}: NewsletterBannerProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");

    try {
      const formData = new FormData();
      formData.append("email", email.trim());
      formData.append("source", source);
      const res = await subscribeNewsletterAction(formData);
      if (res.success) {
        setStatus("success");
        setMessage(res.message || "Subscribed to Kraviona AI News!");
        setEmail("");
      } else {
        setStatus("error");
        setMessage(res.error || "Please provide a valid email address.");
      }
    } catch {
      setStatus("error");
      setMessage("Unable to subscribe right now. Please try again.");
    }
  }

  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "rounded-xl border border-[#263B50] bg-[#101820] p-5 text-[#F5F4EF] shadow-xs",
          className
        )}
      >
        <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#E05A42] mb-2">
          <Mail className="h-3.5 w-3.5" />
          <span>Daily Dispatch</span>
        </div>
        <h3 className="font-display text-base font-extrabold text-white leading-snug">
          Kraviona Intelligence Brief
        </h3>
        <p className="mt-1.5 text-xs text-[#9CA3AF] leading-relaxed">
          Essential AI models, frontier papers, and technology signals delivered every morning.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-2.5">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            aria-label="Email address for Kraviona AI News newsletter"
            className="w-full rounded-lg border border-white/15 bg-[#161F28] px-3 py-2 text-xs text-white placeholder-[#8B949E] focus:border-[#D94F35] focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#D94F35] hover:bg-[#BF3E26] px-3.5 py-2 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-60"
          >
            <span>{status === "loading" ? "Subscribing..." : "Subscribe Free"}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        {status === "success" && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </p>
        )}
        {status === "error" && (
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-rose-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{message}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <section
      id="newsletter"
      aria-label="Daily AI Intelligence Dispatch"
      className={cn(
        "bg-[var(--color-main-background)] py-14 sm:py-18",
        className
      )}
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl border border-[#263B50] bg-gradient-to-br from-[#101820] via-[#15222E] to-[#263B50] px-6 py-10 sm:px-12 sm:py-14 text-white shadow-lg">
          {/* Controlled Subtle Grid Accent */}
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D94F35]/15 blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-md bg-white/10 border border-white/15 px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#E05A42]">
                <Mail className="h-3.5 w-3.5" />
                <span>Kraviona Briefing</span>
              </div>

              <h2 className="font-editorial text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                AI, Research &amp; Technology Intelligence — Before the Market Opens
              </h2>

              <p className="text-sm sm:text-base text-[#D0D7DE] max-w-2xl leading-relaxed">
                Join engineers, founders, and researchers reading Kraviona AI News. Verified model benchmarks, arXiv paper breakdowns, and sovereign compute analysis—no hype, no noise.
              </p>
            </div>

            <div className="lg:col-span-5">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your work or personal email"
                  aria-label="Email address"
                  className="flex-1 rounded-xl border border-white/20 bg-[#0D1117]/80 px-4 py-3.5 text-sm text-white placeholder-[#8B949E] focus:border-[#D94F35] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D94F35] hover:bg-[#BF3E26] px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-all cursor-pointer disabled:opacity-60 shrink-0"
                >
                  <span>{status === "loading" ? "Joining..." : "Subscribe"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <p className="mt-3 text-[11px] font-mono text-[#8B949E]">
                Free editorial dispatch · Unsubscribe anytime with one click.
              </p>

              {status === "success" && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-2 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              {status === "error" && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 px-3.5 py-2 text-xs font-semibold text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{message}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
