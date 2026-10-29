"use client";

import { useState, useMemo } from "react";
import { Cpu, DollarSign, Zap, TrendingDown, ArrowRight, Sparkles, Sliders } from "lucide-react";
import Link from "next/link";

interface ModelSpec {
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

const MODELS: ModelSpec[] = [
  {
    id: "deepseek-r1",
    name: "DeepSeek-R1 (Open-Weights)",
    provider: "DeepSeek AI",
    inputPer1M: 0.55,
    outputPer1M: 2.19,
    indicScore: 84,
    reasoningScore: 90.8,
    latencyMs: 820,
    isOpenWeights: true,
    articleUrl: "/blog/deepseek-r1-disrupts-global-ai-economics-silicon-valley-india",
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
    articleUrl: "/blog/anthropic-claude-opus-5-5-sonnet-5-5-release",
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
    name: "Sarvam-1 Indic 2B",
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
    articleUrl: "/blog/google-deepmind-gemini-4-argon-1-million-output-tokens",
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
    articleUrl: "/blog/llama-3-3-70b-benchmark-matches-llama-3-1-405b",
  },
];

export function ModelCalculatorWidget() {
  const [selectedModelId, setSelectedModelId] = useState<string>("deepseek-r1");
  const [dailyRequests, setDailyRequests] = useState<number>(10000);
  const [avgPromptTokens, setAvgPromptTokens] = useState<number>(800);
  const [avgOutputTokens, setAvgOutputTokens] = useState<number>(400);

  const selectedModel: ModelSpec = useMemo(
    () => (MODELS.find((m) => m.id === selectedModelId) || MODELS[0]) as ModelSpec,
    [selectedModelId]
  );

  const gpt4oBaseline = useMemo(() => MODELS.find((m) => m.id === "gpt-4o")!, []);

  // Compute monthly figures (30 days)
  const calculation = useMemo(() => {
    const monthlyRequests = dailyRequests * 30;
    const monthlyInputTokens = (monthlyRequests * avgPromptTokens) / 1_000_000;
    const monthlyOutputTokens = (monthlyRequests * avgOutputTokens) / 1_000_000;

    const monthlyCostUSD =
      monthlyInputTokens * selectedModel.inputPer1M +
      monthlyOutputTokens * selectedModel.outputPer1M;

    const gpt4oCostUSD =
      monthlyInputTokens * gpt4oBaseline.inputPer1M +
      monthlyOutputTokens * gpt4oBaseline.outputPer1M;

    const usdToInr = 87.5;
    const monthlyCostINR = monthlyCostUSD * usdToInr;
    const savingsUSD = Math.max(0, gpt4oCostUSD - monthlyCostUSD);
    const savingsINR = savingsUSD * usdToInr;
    const savingsPercent =
      gpt4oCostUSD > 0 ? Math.round((savingsUSD / gpt4oCostUSD) * 100) : 0;

    return {
      monthlyCostUSD: Math.round(monthlyCostUSD * 100) / 100,
      monthlyCostINR: Math.round(monthlyCostINR),
      savingsUSD: Math.round(savingsUSD),
      savingsINR: Math.round(savingsINR),
      savingsPercent,
      monthlyRequests: monthlyRequests.toLocaleString(),
    };
  }, [dailyRequests, avgPromptTokens, avgOutputTokens, selectedModel, gpt4oBaseline]);

  return (
    <section
      className="my-10 rounded-2xl border-2 border-slate-900 bg-white p-6 sm:p-8 shadow-sm"
      aria-label="Interactive AI Model Cost and Benchmark Calculator"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Sliders className="h-3.5 w-3.5" />
            <span>Interactive Compute Sandbox</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            LLM API Token Cost &amp; Benchmark Calculator
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Calculate your startup or enterprise monthly inference bill across frontier models.
          </p>
        </div>

        <span className="self-start sm:self-auto rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 font-mono text-[11px] font-bold text-emerald-800 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Live 2026 Rates
        </span>
      </div>

      {/* Model Selector Tabs */}
      <div className="pt-6">
        <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-2.5">
          1. Select Model for Evaluation
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MODELS.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                onClick={() => setSelectedModelId(model.id)}
                className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-sm ring-1 ring-slate-900"
                    : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800"
                }`}
              >
                <span
                  className={`block text-[10px] font-mono uppercase font-bold truncate ${
                    isSelected ? "text-indigo-300" : "text-slate-500"
                  }`}
                >
                  {model.provider}
                </span>
                <span className="block text-xs font-bold truncate mt-0.5">
                  {model.name.split(" ")[0]}
                </span>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono">
                  <span className={isSelected ? "text-slate-300" : "text-slate-500"}>
                    ${model.inputPer1M}/1M
                  </span>
                  {model.isOpenWeights && (
                    <span
                      className={`px-1 rounded text-[9px] font-bold ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      OPEN
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 pb-6 border-b border-slate-200">
        {/* Daily Queries Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Daily Invocations</span>
            <span className="font-mono font-black text-indigo-600 text-sm">
              {dailyRequests.toLocaleString()} / day
            </span>
          </div>
          <input
            type="range"
            min={1000}
            max={100000}
            step={1000}
            value={dailyRequests}
            onChange={(e) => setDailyRequests(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>1K</span>
            <span>50K</span>
            <span>100K</span>
          </div>
        </div>

        {/* Avg Prompt Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Prompt Context</span>
            <span className="font-mono font-black text-indigo-600 text-sm">
              {avgPromptTokens.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={4000}
            step={100}
            value={avgPromptTokens}
            onChange={(e) => setAvgPromptTokens(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>100</span>
            <span>2,000</span>
            <span>4,000</span>
          </div>
        </div>

        {/* Avg Output Tokens */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-800">Output Generated</span>
            <span className="font-mono font-black text-indigo-600 text-sm">
              {avgOutputTokens.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={avgOutputTokens}
            onChange={(e) => setAvgOutputTokens(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>100</span>
            <span>1,000</span>
            <span>2,000</span>
          </div>
        </div>
      </div>

      {/* Real-time Calculation Results Display */}
      <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Monthly Cost */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <DollarSign className="h-3.5 w-3.5 text-slate-700" />
            <span>Monthly API Bill</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
              ${calculation.monthlyCostUSD.toLocaleString()}
            </span>
            <span className="font-mono text-xs text-slate-500">USD</span>
          </div>
          <span className="block font-mono text-xs font-bold text-slate-600 mt-1">
            ≈ ₹{calculation.monthlyCostINR.toLocaleString()} / mo
          </span>
        </div>

        {/* Savings vs GPT-4o */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            <span>Savings vs GPT-4o</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-emerald-700">
              {calculation.savingsPercent > 0 ? `${calculation.savingsPercent}%` : "Baseline"}
            </span>
          </div>
          <span className="block font-mono text-xs font-bold text-emerald-800 mt-1">
            {calculation.savingsUSD > 0
              ? `Save $${calculation.savingsUSD.toLocaleString()} (₹${calculation.savingsINR.toLocaleString()})`
              : "Standard frontier benchmark"}
          </span>
        </div>

        {/* Indic Language Score */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            <span>Indic NLP Capability</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-indigo-600">
              {selectedModel.indicScore}
            </span>
            <span className="font-mono text-xs text-slate-500">/ 100</span>
          </div>
          <span className="block text-xs text-slate-600 mt-1">
            Hindi, Tamil, Telugu tokenization
          </span>
        </div>

        {/* Latency & Reasoning */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Zap className="h-3.5 w-3.5 text-amber-600" />
            <span>P95 First-Token Latency</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-2xl sm:text-3xl font-black text-slate-900">
              {selectedModel.latencyMs}
            </span>
            <span className="font-mono text-xs text-slate-500">ms</span>
          </div>
          <span className="block text-xs text-slate-600 mt-1">
            Math/Reasoning: <strong>{selectedModel.reasoningScore}%</strong>
          </span>
        </div>
      </div>

      {/* Action Footer */}
      {selectedModel.articleUrl && (
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <span className="text-slate-600">
            Want the full architectural teardown and benchmark dataset for{" "}
            <strong>{selectedModel.name}</strong>?
          </span>
          <Link
            href={selectedModel.articleUrl}
            className="inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-700 underline font-mono"
          >
            <span>Read Complete Benchmark Report</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </section>
  );
}
