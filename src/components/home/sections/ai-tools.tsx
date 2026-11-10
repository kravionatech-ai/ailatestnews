"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Wrench, ArrowRight, ExternalLink, Sparkles, Terminal, Laptop, Cpu, Check } from "lucide-react";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import type { CardVariant } from "@/lib/design-tokens/types";
import type { NewsCardPost } from "@/components/blog/cards/types";
import { NewsCard } from "@/components/blog/cards/news-card";
import { SectionDeskHeader } from "./section-header";
import { cn } from "@/lib/utils";

export interface EvaluatedGearItem {
  id: string;
  name: string;
  tagline: string;
  category: "runners" | "ide-agents" | "frameworks";
  pricing: string;
  badge?: string;
  rating: string;
  url: string;
  tags: string[];
}

export const DEFAULT_EVALUATED_GEAR: EvaluatedGearItem[] = [
  {
    id: "ollama",
    name: "Ollama",
    tagline: "Get up and running with Llama 3.3, Mistral, and DeepSeek locally in one command.",
    category: "runners",
    pricing: "Free / Open Source",
    badge: "Essential",
    rating: "4.9/5",
    url: "https://ollama.com",
    tags: ["Local Inference", "macOS/Linux/Win", "REST API"],
  },
  {
    id: "vllm",
    name: "vLLM",
    tagline: "High-throughput and memory-efficient LLM serving engine with PagedAttention.",
    category: "runners",
    pricing: "Free / Open Source",
    badge: "Production",
    rating: "4.8/5",
    url: "https://github.com/vllm-project/vllm",
    tags: ["PagedAttention", "CUDA", "Multi-GPU"],
  },
  {
    id: "cursor",
    name: "Cursor IDE",
    tagline: "AI-first code editor with deep codebase indexing, multi-file edits, and tab completion.",
    category: "ide-agents",
    pricing: "Freemium ($20/mo Pro)",
    badge: "Top Choice",
    rating: "4.9/5",
    url: "https://cursor.com",
    tags: ["VS Code Fork", "Composer", "Shadow Workspace"],
  },
  {
    id: "windsurf",
    name: "Windsurf",
    tagline: "Agentic IDE with real-time AI copilot flows and predictive multi-token completions.",
    category: "ide-agents",
    pricing: "Freemium ($15/mo Pro)",
    badge: "Fast Growing",
    rating: "4.7/5",
    url: "https://codeium.com/windsurf",
    tags: ["Cascade Flow", "Codeium Engine", "Live Previews"],
  },
  {
    id: "litellm",
    name: "LiteLLM",
    tagline: "Call 100+ LLMs using OpenAI format, with load balancing, fallbacks, and spend tracking.",
    category: "frameworks",
    pricing: "Free / Open Source",
    badge: "Infra Must",
    rating: "4.8/5",
    url: "https://litellm.ai",
    tags: ["Gateway Proxy", "Spend Budgets", "Unified API"],
  },
  {
    id: "langgraph",
    name: "LangGraph",
    tagline: "Build resilient multi-agent workflows with state machines and cyclic execution graphs.",
    category: "frameworks",
    pricing: "Free / Open Source",
    badge: "Agentic Standard",
    rating: "4.7/5",
    url: "https://langchain-ai.github.io/langgraph",
    tags: ["State Graphs", "Human-in-the-loop", "Time Travel"],
  },
];

export interface AiToolsSectionProps {
  config?: HomepageSectionConfig;
  posts?: NewsCardPost[];
  tools?: EvaluatedGearItem[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  cardVariant?: CardVariant;
  limit?: number;
  customSettings?: {
    viewMode?: "posts" | "directory" | "both";
    defaultFilter?: string;
  };
  className?: string;
}

export function AiToolsSection({
  config,
  posts = [],
  tools = DEFAULT_EVALUATED_GEAR,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  cardVariant: variantProp,
  limit: limitProp,
  className,
}: AiToolsSectionProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const kicker = config?.kicker || kickerProp || "Desk 03 // Developer Gear & Software Evaluations";
  const title = config?.title || titleProp || "Developer Tooling & Workflows";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Hands-on evaluations of local LLM runners, AI code refactoring assistants, and agentic environments.";

  const effectiveVariant: CardVariant =
    (config?.cardVariant as CardVariant) || variantProp || "modern-magazine";

  const displayPosts = (posts || []).slice(0, config?.limit || limitProp || 3);

  const filteredTools =
    activeTab === "all"
      ? tools
      : tools.filter((t) => t.category === activeTab);

  const filterTabs = [
    { id: "all", label: "All Gear", icon: Sparkles },
    { id: "runners", label: "Local LLM Runners", icon: Cpu },
    { id: "ide-agents", label: "IDE Agents", icon: Laptop },
    { id: "frameworks", label: "Agent Frameworks", icon: Terminal },
  ];

  return (
    <section
      className={cn("py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]", className)}
      aria-label="AI Tools Desk"
    >
      <SectionDeskHeader
        kicker={kicker}
        title={title}
        subtitle={subtitle}
        icon={Wrench}
        actionLabel="All Tools"
        actionHref="/category/ai-tools"
      />

      {/* 1. Article reviews grid (if posts available) */}
      {displayPosts.length > 0 && (
        <div className="mb-10">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-muted-text,#64748B)] mb-4 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-accent,#10B981)]" />
            <span>Editorial Software Teardowns</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {displayPosts.map((post) => (
              <NewsCard
                key={post._id || post.slug}
                post={post}
                variant={effectiveVariant}
                showBadges={true}
                showExcerpt={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* 2. Interactive Evaluated Gear Directory */}
      <div className="rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)] p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[var(--color-border,#E2E8F0)] gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)]">
            <Sparkles className="h-4 w-4 text-[var(--color-primary-accent,#10B981)]" />
            <span>Evaluated Gear Directory</span>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius,0.5rem)] text-xs font-mono font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-[var(--color-primary-dark,#080D19)] text-white shadow-2xs"
                      : "bg-[var(--color-secondary-surface,#F1F5F9)] text-[var(--color-body-text,#334155)] hover:bg-[var(--color-border,#E2E8F0)]"
                  )}
                  aria-pressed={isActive}
                >
                  <Icon className="h-3 w-3 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTools.map((gear) => (
            <div
              key={gear.id}
              className="flex flex-col justify-between rounded-[var(--radius-card,0.75rem)] border border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)] p-4 hover:border-[var(--color-primary-accent,#10B981)] transition-colors group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-bold text-sm text-[var(--color-heading,#0F172A)] group-hover:text-[var(--color-primary-accent,#10B981)] transition-colors">
                    {gear.name}
                  </span>
                  {gear.badge && (
                    <span className="rounded bg-[var(--color-primary-accent,#10B981)]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--color-primary-accent,#10B981)]">
                      {gear.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--color-muted-text,#64748B)] line-clamp-2 leading-relaxed mb-3">
                  {gear.tagline}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {gear.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[var(--color-secondary-surface,#F1F5F9)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-body-text,#334155)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border,#E2E8F0)] text-xs">
                <span className="font-mono text-[11px] text-[var(--color-muted-text,#64748B)]">
                  {gear.pricing}
                </span>
                <a
                  href={gear.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono font-bold text-[11px] text-[var(--color-primary-accent,#10B981)] hover:underline"
                >
                  <span>Evaluate</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
