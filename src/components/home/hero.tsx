"use client";

import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";
import { Hero3D } from "./hero-3d";

export interface HeroProps {
  badge?: string;
  title?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  showOrb?: boolean;
  onOpenChat?: () => void;
}

export function Hero({
  badge = "India's Sovereign AI & Generative Tech Hub",
  title = "Latest AI News, Tools and Launches, Explained for India",
  subtitle = "Independent reporting, hands-on model evaluations, and sovereign AI compute analysis. Built for engineers, founders, and tech enthusiasts across India.",
  primaryCtaText = "Explore Latest AI News",
  primaryCtaLink = "/category/ai-news",
  secondaryCtaText = "Compare Models",
  secondaryCtaLink = "/category/guides-and-comparisons",
  showOrb = true,
  onOpenChat,
}: HeroProps = {}) {
  return (
    <section className="relative overflow-hidden pt-8 pb-12 md:pt-12 md:pb-20 border-b border-[var(--border)]">
      {/* Soft pastel indigo gradient aura */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center opacity-30 blur-3xl"
        aria-hidden="true"
      >
        <div className="h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-indigo-200 via-sky-100 to-indigo-50" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-4">
            {/* Live Indicator Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{badge}</span>
            </div>

            {/* Exactly one H1 with primary keyword */}
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl leading-tight sm:leading-tight">
              {title}
            </h1>

            {/* 2-line description */}
            <p className="text-base sm:text-lg text-[var(--foreground-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              {subtitle}
            </p>

            {/* Two clean CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                href={primaryCtaLink}
                className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all hover:shadow-md"
              >
                <span>{primaryCtaText}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              {onOpenChat ? (
                <button
                  onClick={onOpenChat}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-5 py-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-all shadow-2xs cursor-pointer"
                >
                  <Bot className="h-4 w-4 text-indigo-600" />
                  <span>Ask AI Assistant</span>
                </button>
              ) : (
                <Link
                  href={secondaryCtaLink}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-3 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-all shadow-2xs"
                >
                  <span>{secondaryCtaText}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--foreground-muted)]" />
                </Link>
              )}
            </div>
          </div>

          {/* Right 3D Neural Network Glass-Orb */}
          {showOrb && (
            <div className="lg:col-span-5 flex items-center justify-center">
              <Hero3D />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
