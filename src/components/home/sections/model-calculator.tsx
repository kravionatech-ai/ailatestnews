"use client";

import { useState, useMemo } from "react";
import { Cpu, DollarSign, Zap, TrendingDown, ArrowRight, Sparkles, Sliders } from "lucide-react";
import Link from "next/link";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import { cn } from "@/lib/utils";

export interface ModelSpec {
  id: string;
  name: string;
  provider: string;
  inputPer1M: number; // in USD
  outputPer1M: number; // in USD
  indicScore: number; // out of 100
  reasoningScore: number; // MATH/AIME %
  latencyMs: number;
  isOpenWeights: boolean;
  articleUrl?: string;
}

export const VALID_SLUGS = new Set([
  "india-10000-gpus-national-ai-mission-tender",
  "deepseek-v3-architecture-deep-dive-mla-dualpipe",
  "best-free-ai-tools-for-students-2026",
  "sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
  "chatgpt-vs-claude-vs-gemini-best-in-india",
  "enterprise-ai-adoption-india-bfsi-it-private-llms",
  "openai-ai-discoveries",
]);

export const MODELS: ModelSpec[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek-V3 / R1 (Open-Weights)",
    provider: "DeepSeek AI",
    inputPer1M: 0.55,
    outputPer1M: 2.19,
    indicScore: 84,
    reasoningScore: 90.8,
    latencyMs: 820,
    isOpenWeights: true,
    articleUrl: "/blog/deepseek-v3-architecture-deep-dive-mla-dualpipe",
  },
  {
    id: "claude-sonnet-35",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    inputPer1M: 3.00,
    outputPer1M: 15.00,
    indicScore: 89,
    reasoningScore: 88.4,
    latencyMs: 740,
    isOpenWeights: false,
    articleUrl: "/blog/chatgpt-vs-claude-vs-gemini-best-in-india",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o Frontier",
    provider: "OpenAI",
    inputPer1M: 2.50,
    outputPer1M: 10.00,
    indicScore: 87,
    reasoningScore: 86.2,
    latencyMs: 650,
    isOpenWeights: false,
    articleUrl: "/blog/chatgpt-vs-claude-vs-gemini-best-in-india",
  },
  {
    id: "sarvam-1",
    name: "Sarvam-1 (2B Indic Optimized)",
    provider: "Sarvam AI (India)",
    inputPer1M: 0.15,
    outputPer1M: 0.40,
    indicScore: 94,
    reasoningScore: 78.5,
    latencyMs: 280,
    isOpenWeights: true,
    articleUrl: "/blog/sarvam-ai-sarvam-1-2b-parameter-model-indic-nlp",
  },
  {
    id: "gemini-15-pro",
    name: "Gemini 1.5 Pro (2M Context)",
    provider: "Google DeepMind",
    inputPer1M: 1.25,
    outputPer1M: 5.00,
    indicScore: 91,
    reasoningScore: 87.0,
    latencyMs: 890,
    isOpenWeights: false,
    articleUrl: "/blog/chatgpt-vs-claude-vs-gemini-best-in-india",
  },
  {
    id: "llama-33-70b",
    name: "Llama 3.3 70B Instruct",
    provider: "Meta AI",
    inputPer1M: 0.40,
    outputPer1M: 1.20,
    indicScore: 81,
    reasoningScore: 82.0,
    latencyMs: 510,
    isOpenWeights: true,
    articleUrl: "/blog/india-10000-gpus-national-ai-mission-tender",
  },
];

const USD_TO_INR = 87.5;

export interface ModelCalculatorProps {
  config?: HomepageSectionConfig;
  title?: string;
  subtitle?: string;
  kicker?: string;
  className?: string;
}

export function ModelCalculatorSection({
  config,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  className,
}: ModelCalculatorProps = {}) {
  const [selectedModelId, setSelectedModelId] = useState<string>("deepseek-r1");
  const [dailyRequests, setDailyRequests] = useState<number>(10000);
  const [avgPromptTokens, setAvgPromptTokens] = useState<number>(800);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(400);

  const kicker = config?.kicker || kickerProp || "Inference Economics & Cost Simulator";
  const title = config?.title || titleProp || "Frontier Model API Cost & ROI Calculator";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Simulate monthly token budgets, latency, and savings across frontier LLMs vs. GPT-4o baseline for Indian developers and enterprises.";

  const DEFAULT_MODEL: ModelSpec = MODELS[0] || {
    id: "deepseek-r1",
    name: "DeepSeek-V3 / R1 (Open-Weights)",
    provider: "DeepSeek AI",
    inputPer1M: 0.55,
    outputPer1M: 2.19,
    indicScore: 84,
    reasoningScore: 90.8,
    latencyMs: 820,
    isOpenWeights: true,
  };

  const selectedModel: ModelSpec = useMemo(
    () => MODELS.find((m) => m.id === selectedModelId) || DEFAULT_MODEL,
    [selectedModelId]
  );

  const monthlyRequests = dailyRequests * 30;
  const monthlyInputTokens = (monthlyRequests * avgPromptTokens) / 1_000_000;
  const monthlyOutputTokens = (monthlyRequests * avgOutputTokens) / 1_000_000;

  const monthlyCostUSD =
    monthlyInputTokens * selectedModel.inputPer1M +
    monthlyOutputTokens * selectedModel.outputPer1M;

  const monthlyCostINR = monthlyCostUSD * USD_TO_INR;

  const gpt4oCostUSD = monthlyInputTokens * 2.50 + monthlyOutputTokens * 10.00;
  const savingsUSD = Math.max(0, gpt4oCostUSD - monthlyCostUSD);
  const savingsINR = savingsUSD * USD_TO_INR;
  const savingsPercent =
    gpt4oCostUSD > 0 ? Math.round((savingsUSD / gpt4oCostUSD) * 100) : 0;

  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)] p-6 sm:p-8 shadow-xs",
        className
      )}
      aria-label="Interactive AI Cost Calculator"
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border,#E2E8F0)]">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-accent,#10B981)] mb-1">
            <Sliders className="h-3.5 w-3.5" />
            <span>{kicker}</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--color-heading,#0F172A)]">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[var(--color-muted-text,#64748B)] mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-mono text-xs font-semibold text-[var(--color-muted-text,#64748B)] bg-[var(--color-secondary-surface,#F1F5F9)] px-2.5 py-1 rounded-md">
            1 USD = ₹{USD_TO_INR}
          </span>
        </div>
      </div>

      {/* Model Selector Bar */}
      <div className="py-6">
        <label className="block font-mono text-xs font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)] mb-3">
          1. Select Model for Evaluation
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MODELS.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={cn(
                  "flex flex-col items-start p-3 rounded-[var(--radius-card,0.75rem)] border text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-[var(--color-heading,#0F172A)] bg-[var(--color-primary-dark,#080D19)] text-white shadow-2xs"
                    : "border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)] text-[var(--color-heading,#0F172A)] hover:border-[var(--color-heading,#0F172A)]"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={cn(
                      "text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded",
                      model.isOpenWeights
                        ? isSelected
                          ? "bg-[var(--color-primary-accent,#10B981)]/20 text-[var(--color-secondary-accent,#34D399)]"
                          : "bg-[var(--color-primary-accent,#10B981)]/10 text-[var(--color-primary-accent,#10B981)]"
                        : isSelected
                        ? "bg-slate-800 text-slate-300"
                        : "bg-[var(--color-secondary-surface,#F1F5F9)] text-[var(--color-muted-text,#64748B)]"
                    )}
                  >
                    {model.isOpenWeights ? "Open" : "Closed"}
                  </span>
                  <span
                    className={cn(
                      "font-mono text-[10px]",
                      isSelected ? "text-slate-400" : "text-[var(--color-muted-text,#64748B)]"
                    )}
                  >
                    {model.latencyMs}ms
                  </span>
                </div>
                <span className="font-bold text-xs truncate w-full">{model.name}</span>
                <span
                  className={cn(
                    "text-[10px] mt-0.5 font-mono",
                    isSelected ? "text-slate-300" : "text-[var(--color-muted-text,#64748B)]"
                  )}
                >
                  ${model.outputPer1M}/1M out
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-y border-[var(--color-border,#E2E8F0)]">
        {/* Daily Requests */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-mono text-xs font-bold uppercase text-[var(--color-heading,#0F172A)]">
              Daily Requests
            </label>
            <span className="font-mono text-xs font-bold text-[var(--color-primary-accent,#10B981)] bg-[var(--color-primary-accent,#10B981)]/10 px-2 py-0.5 rounded">
              {dailyRequests.toLocaleString()} / day
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={dailyRequests}
            onChange={(e) => setDailyRequests(Number(e.target.value))}
            className="w-full h-1.5 bg-[var(--color-secondary-surface,#F1F5F9)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-accent,#10B981)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-muted-text,#64748B)] font-mono">
            <span>1K</span>
            <span>50K</span>
            <span>100K</span>
          </div>
        </div>

        {/* Avg Prompt Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-mono text-xs font-bold uppercase text-[var(--color-heading,#0F172A)]">
              Input Tokens / Req
            </label>
            <span className="font-mono text-xs font-bold text-[var(--color-primary-accent,#10B981)] bg-[var(--color-primary-accent,#10B981)]/10 px-2 py-0.5 rounded">
              {avgPromptTokens.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="4000"
            step="100"
            value={avgPromptTokens}
            onChange={(e) => setAvgPromptTokens(Number(e.target.value))}
            className="w-full h-1.5 bg-[var(--color-secondary-surface,#F1F5F9)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-accent,#10B981)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-muted-text,#64748B)] font-mono">
            <span>100</span>
            <span>2,000</span>
            <span>4,000</span>
          </div>
        </div>

        {/* Avg Output Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="font-mono text-xs font-bold uppercase text-[var(--color-heading,#0F172A)]">
              Output Tokens / Req
            </label>
            <span className="font-mono text-xs font-bold text-[var(--color-primary-accent,#10B981)] bg-[var(--color-primary-accent,#10B981)]/10 px-2 py-0.5 rounded">
              {avgOutputTokens.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={avgOutputTokens}
            onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
            className="w-full h-1.5 bg-[var(--color-secondary-surface,#F1F5F9)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-accent,#10B981)]"
          />
          <div className="flex justify-between text-[10px] text-[var(--color-muted-text,#64748B)] font-mono">
            <span>100</span>
            <span>1,000</span>
            <span>2,000</span>
          </div>
        </div>
      </div>

      {/* Real-time Calculation Results Display */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
        {/* Monthly Cost USD */}
        <div className="p-4 rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)]">
          <span className="block text-[11px] font-mono font-bold uppercase text-[var(--color-muted-text,#64748B)] mb-1">
            Monthly Cost (USD)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[var(--color-heading,#0F172A)] font-mono">
              ${monthlyCostUSD.toFixed(2)}
            </span>
            <span className="text-xs text-[var(--color-muted-text,#64748B)]">/ month</span>
          </div>
          <span className="block text-[11px] text-[var(--color-muted-text,#64748B)] mt-1 font-mono">
            {monthlyInputTokens.toFixed(1)}M in + {monthlyOutputTokens.toFixed(1)}M out
          </span>
        </div>

        {/* Monthly Cost INR */}
        <div className="p-4 rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)]">
          <span className="block text-[11px] font-mono font-bold uppercase text-[var(--color-muted-text,#64748B)] mb-1">
            Monthly Cost (INR)
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[var(--color-heading,#0F172A)] font-mono">
              ₹{Math.round(monthlyCostINR).toLocaleString()}
            </span>
            <span className="text-xs text-[var(--color-muted-text,#64748B)]">/ month</span>
          </div>
          <span className="block text-[11px] text-[var(--color-muted-text,#64748B)] mt-1 font-mono">
            At official ₹87.5/USD
          </span>
        </div>

        {/* Savings vs GPT-4o */}
        <div
          className={cn(
            "p-4 rounded-[var(--radius-card,0.75rem)] border",
            savingsUSD > 0
              ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
              : "border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)] text-[var(--color-muted-text,#64748B)]"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono font-bold uppercase text-emerald-800 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
              Savings vs GPT-4o
            </span>
            {savingsPercent > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-mono font-bold px-1.5 py-0.2 rounded">
                -{savingsPercent}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-700">
              ₹{Math.round(savingsINR).toLocaleString()}
            </span>
            <span className="text-xs text-emerald-800">/ mo</span>
          </div>
          <span className="block text-[11px] text-emerald-800 mt-1 font-mono">
            ${savingsUSD.toFixed(2)} USD saved
          </span>
        </div>

        {/* Model Performance Snapshot */}
        <div className="p-4 rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)] flex flex-col justify-between">
          <div>
            <span className="block text-[11px] font-mono font-bold uppercase text-[var(--color-muted-text,#64748B)] mb-1">
              Quality &amp; Reasoning
            </span>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-[var(--color-muted-text,#64748B)]">Indic NLP Score:</span>
              <span className="font-mono font-bold text-[var(--color-heading,#0F172A)]">
                {selectedModel.indicScore}/100
              </span>
            </div>
            <div className="flex items-center justify-between text-xs mt-0.5">
              <span className="text-[var(--color-muted-text,#64748B)]">Math/Reasoning:</span>
              <span className="font-mono font-bold text-[var(--color-heading,#0F172A)]">
                {selectedModel.reasoningScore}%
              </span>
            </div>
          </div>

          {selectedModel.articleUrl && (
            <Link
              href={selectedModel.articleUrl}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[var(--color-primary-accent,#10B981)] hover:underline"
            >
              <span>Architecture Deep-Dive</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// Backward-compatibility alias
export { ModelCalculatorSection as ModelCalculatorWidget };
