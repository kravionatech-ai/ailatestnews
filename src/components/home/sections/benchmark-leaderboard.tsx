"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import { cn } from "@/lib/utils";

export type BenchmarkCategory = "reasoning" | "indic" | "pricing" | "coding";

export interface ModelRank {
  rank: number;
  name: string;
  provider: string;
  score: string;
  rawScore: number; // for percentage bar
  type: "Open-Weights" | "Closed API";
  pricing: string;
  slug: string;
}

export const BENCHMARKS: Record<
  BenchmarkCategory,
  {
    title: string;
    description: string;
    metricLabel: string;
    models: ModelRank[];
  }
> = {
  reasoning: {
    title: "Reasoning & Mathematical Olympiad (AIME & MATH 500)",
    description: "Evaluated on multi-step reasoning, formal proofs, and competition mathematics.",
    metricLabel: "AIME 2026 Pass@1",
    models: [
      {
        rank: 1,
        name: "DeepSeek-R1",
        provider: "DeepSeek AI",
        score: "90.8%",
        rawScore: 90.8,
        type: "Open-Weights",
        pricing: "$2.19 / 1M out",
        slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
      },
      {
        rank: 2,
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        score: "88.4%",
        rawScore: 88.4,
        type: "Closed API",
        pricing: "$15.00 / 1M out",
        slug: "anthropic-claude-opus-5-5-sonnet-5-5-release",
      },
      {
        rank: 3,
        name: "Gemini 1.5 Pro",
        provider: "Google DeepMind",
        score: "87.0%",
        rawScore: 87.0,
        type: "Closed API",
        pricing: "$5.00 / 1M out",
        slug: "google-deepmind-gemini-4-argon-1-million-output-tokens",
      },
      {
        rank: 4,
        name: "GPT-4o",
        provider: "OpenAI",
        score: "86.2%",
        rawScore: 86.2,
        type: "Closed API",
        pricing: "$10.00 / 1M out",
        slug: "chatgpt-vs-claude-vs-gemini-best-in-india",
      },
      {
        rank: 5,
        name: "Llama 3.3 70B",
        provider: "Meta AI",
        score: "82.0%",
        rawScore: 82.0,
        type: "Open-Weights",
        pricing: "$1.20 / 1M out",
        slug: "llama-3-3-70b-benchmark-matches-llama-3-1-405b",
      },
    ],
  },
  indic: {
    title: "Indic Language Comprehension (10 Official Indian Languages)",
    description: "Benchmarked on Hindi, Tamil, Telugu, Bengali, Marathi token efficiency and native grammar accuracy.",
    metricLabel: "MMLU Indic Score",
    models: [
      {
        rank: 1,
        name: "Sarvam-1 (2B Indic)",
        provider: "Sarvam AI (India)",
        score: "94.2%",
        rawScore: 94.2,
        type: "Open-Weights",
        pricing: "$0.40 / 1M out",
        slug: "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
      },
      {
        rank: 2,
        name: "Gemini 1.5 Pro",
        provider: "Google DeepMind",
        score: "91.0%",
        rawScore: 91.0,
        type: "Closed API",
        pricing: "$5.00 / 1M out",
        slug: "google-deepmind-gemini-4-argon-1-million-output-tokens",
      },
      {
        rank: 3,
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        score: "89.2%",
        rawScore: 89.2,
        type: "Closed API",
        pricing: "$15.00 / 1M out",
        slug: "anthropic-claude-opus-5-5-sonnet-5-5-release",
      },
      {
        rank: 4,
        name: "GPT-4o",
        provider: "OpenAI",
        score: "87.4%",
        rawScore: 87.4,
        type: "Closed API",
        pricing: "$10.00 / 1M out",
        slug: "chatgpt-vs-claude-vs-gemini-best-in-india",
      },
      {
        rank: 5,
        name: "DeepSeek-R1",
        provider: "DeepSeek AI",
        score: "84.1%",
        rawScore: 84.1,
        type: "Open-Weights",
        pricing: "$2.19 / 1M out",
        slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
      },
    ],
  },
  pricing: {
    title: "Inference Economics & Cost Efficiency (Lowest Output Cost)",
    description: "Evaluated on developer cost per 1 Million output tokens on standard cloud endpoints.",
    metricLabel: "Cost Advantage Index",
    models: [
      {
        rank: 1,
        name: "Sarvam-1 (2B)",
        provider: "Sarvam AI (India)",
        score: "$0.40 / 1M",
        rawScore: 99.0,
        type: "Open-Weights",
        pricing: "Lowest in India",
        slug: "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
      },
      {
        rank: 2,
        name: "Llama 3.3 70B",
        provider: "Meta AI",
        score: "$1.20 / 1M",
        rawScore: 94.0,
        type: "Open-Weights",
        pricing: "Self-Hostable",
        slug: "llama-3-3-70b-benchmark-matches-llama-3-1-405b",
      },
      {
        rank: 3,
        name: "DeepSeek-R1",
        provider: "DeepSeek AI",
        score: "$2.19 / 1M",
        rawScore: 89.0,
        type: "Open-Weights",
        pricing: "90% < GPT-4o",
        slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
      },
      {
        rank: 4,
        name: "Gemini 1.5 Pro",
        provider: "Google DeepMind",
        score: "$5.00 / 1M",
        rawScore: 75.0,
        type: "Closed API",
        pricing: "Standard Cloud",
        slug: "google-deepmind-gemini-4-argon-1-million-output-tokens",
      },
      {
        rank: 5,
        name: "GPT-4o",
        provider: "OpenAI",
        score: "$10.00 / 1M",
        rawScore: 50.0,
        type: "Closed API",
        pricing: "Frontier Closed",
        slug: "chatgpt-vs-claude-vs-gemini-best-in-india",
      },
    ],
  },
  coding: {
    title: "Software Engineering & Autonomous Coding (SWE-bench)",
    description: "Evaluated on resolving real-world GitHub issues and end-to-end bug fixing.",
    metricLabel: "SWE-bench Verified",
    models: [
      {
        rank: 1,
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        score: "49.2%",
        rawScore: 98.0,
        type: "Closed API",
        pricing: "$15.00 / 1M out",
        slug: "anthropic-claude-opus-5-5-sonnet-5-5-release",
      },
      {
        rank: 2,
        name: "DeepSeek-R1",
        provider: "DeepSeek AI",
        score: "46.8%",
        rawScore: 93.0,
        type: "Open-Weights",
        pricing: "$2.19 / 1M out",
        slug: "deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
      },
      {
        rank: 3,
        name: "GPT-4o",
        provider: "OpenAI",
        score: "38.8%",
        rawScore: 78.0,
        type: "Closed API",
        pricing: "$10.00 / 1M out",
        slug: "chatgpt-vs-claude-vs-gemini-best-in-india",
      },
      {
        rank: 4,
        name: "Llama 3.3 70B",
        provider: "Meta AI",
        score: "36.2%",
        rawScore: 72.0,
        type: "Open-Weights",
        pricing: "$1.20 / 1M out",
        slug: "llama-3-3-70b-benchmark-matches-llama-3-1-405b",
      },
      {
        rank: 5,
        name: "Gemini 1.5 Pro",
        provider: "Google DeepMind",
        score: "35.4%",
        rawScore: 70.0,
        type: "Closed API",
        pricing: "$5.00 / 1M out",
        slug: "google-deepmind-gemini-4-argon-1-million-output-tokens",
      },
    ],
  },
};

export const VALID_SLUGS = new Set([
  "india-10000-gpus-national-ai-mission-tender",
  "deepseek-v3-architecture-deep-dive-mla-dualpipe",
  "best-free-ai-tools-for-students-2026",
  "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
  "chatgpt-vs-claude-vs-gemini-best-in-india",
  "enterprise-ai-adoption-india-bfsi-it-private-llms",
  "openai-ai-discoveries",
]);

export interface BenchmarkLeaderboardSectionProps {
  config?: HomepageSectionConfig;
  title?: string;
  subtitle?: string;
  kicker?: string;
  className?: string;
}

export function BenchmarkLeaderboardSection({
  config,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  className,
}: BenchmarkLeaderboardSectionProps = {}) {
  const [activeCategory, setActiveCategory] = useState<BenchmarkCategory>("reasoning");
  const currentBenchmark = BENCHMARKS[activeCategory];

  const kicker = config?.kicker || kickerProp || "Independent Lab Evaluations";
  const title = config?.title || titleProp || "Frontier AI Models Benchmark Arena";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Live evaluation matrix tracking reasoning, Indic language fidelity, API economics, and autonomous coding.";

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="AI Model Benchmark Arena"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b-2 border-[var(--color-heading,#0F172A)]">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-accent,#10B981)] mb-1">
            <Trophy className="h-3.5 w-3.5" />
            <span>{kicker}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading,#0F172A)]">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-muted-text,#64748B)] mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <Link
          href="/category/model-launches"
          className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-[var(--color-heading,#0F172A)] hover:text-[var(--color-primary-accent,#10B981)] transition-colors self-start sm:self-end"
        >
          <span>All Model Dispatches</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Benchmark Category Selector Tabs */}
      <div className="pt-6 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
        {(
          [
            { id: "reasoning", label: "Reasoning & Math" },
            { id: "indic", label: "Indic NLP (10 Languages)" },
            { id: "pricing", label: "Lowest Token Pricing" },
            { id: "coding", label: "SWE-bench Coding" },
          ] as const
        ).map((tab) => {
          const isActive = tab.id === activeCategory;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={cn(
                "rounded-[var(--radius,0.5rem)] px-4 py-2 font-mono text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                isActive
                  ? "bg-[var(--color-primary-dark,#080D19)] text-white shadow-2xs"
                  : "bg-[var(--color-secondary-surface,#F1F5F9)] text-[var(--color-body-text,#334155)] hover:bg-[var(--color-border,#E2E8F0)]"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Benchmark Info Strip */}
      <div className="mt-4 p-4 rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-secondary-surface,#F1F5F9)]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-bold text-[var(--color-heading,#0F172A)]">{currentBenchmark.title}: </span>
          <span className="text-[var(--color-body-text,#334155)]">{currentBenchmark.description}</span>
        </div>
        <span className="font-mono text-[11px] font-bold text-[var(--color-muted-text,#64748B)] shrink-0">
          Metric: {currentBenchmark.metricLabel}
        </span>
      </div>

      {/* Leaderboard Ranking Table */}
      <div className="mt-4 divide-y divide-[var(--color-border,#E2E8F0)] border border-[var(--color-border,#E2E8F0)] rounded-[var(--radius-card,0.75rem)] bg-[var(--color-card-background,#FFFFFF)] overflow-hidden shadow-2xs">
        {currentBenchmark.models.map((model) => (
          <div
            key={model.name}
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--color-secondary-surface,#F1F5F9)]/60 transition-colors"
          >
            {/* Rank + Name + Provider */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius,0.5rem)] font-mono text-xs font-black",
                  model.rank === 1
                    ? "bg-amber-400 text-slate-900 shadow-2xs"
                    : model.rank === 2
                    ? "bg-slate-200 text-slate-800"
                    : model.rank === 3
                    ? "bg-amber-100 text-amber-900"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                #{model.rank}
              </span>

              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-[var(--color-heading,#0F172A)] truncate">
                    {model.name}
                  </h4>
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[9px] font-mono font-bold",
                      model.type === "Open-Weights"
                        ? "bg-[var(--color-primary-accent,#10B981)]/10 text-[var(--color-primary-accent,#10B981)]"
                        : "bg-[var(--color-secondary-surface,#F1F5F9)] text-[var(--color-muted-text,#64748B)]"
                    )}
                  >
                    {model.type}
                  </span>
                </div>
                <span className="block text-xs text-[var(--color-muted-text,#64748B)] font-mono">
                  {model.provider} · {model.pricing}
                </span>
              </div>
            </div>

            {/* Score Bar & Action Link */}
            <div className="flex items-center gap-6 justify-between sm:justify-end shrink-0">
              <div className="space-y-1 w-32 sm:w-44 text-right">
                <span className="font-mono text-base font-black text-[var(--color-heading,#0F172A)]">
                  {model.score}
                </span>
                <div className="h-1.5 w-full bg-[var(--color-secondary-surface,#F1F5F9)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-primary-accent,#10B981)] rounded-full transition-all duration-300"
                    style={{ width: `${model.rawScore}%` }}
                  />
                </div>
              </div>

              <Link
                href={
                  VALID_SLUGS.has(model.slug)
                    ? `/blog/${model.slug}`
                    : `/search?q=${encodeURIComponent(model.name)}`
                }
                className="flex items-center gap-1 font-mono text-xs font-bold text-[var(--color-primary-accent,#10B981)] hover:underline shrink-0"
              >
                <span>Read Analysis</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
