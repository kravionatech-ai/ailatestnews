"use client";

import { useState, useEffect } from "react";
import { BarChart3, CheckCircle2, Users } from "lucide-react";
import type { HomepageSectionConfig } from "@/lib/design-tokens/sections";
import { cn } from "@/lib/utils";

export interface PollOption {
  id: string;
  label: string;
  votes: number;
}

export interface CommunityPollSectionProps {
  config?: HomepageSectionConfig;
  pollId?: string;
  question?: string;
  options?: PollOption[];
  title?: string;
  subtitle?: string;
  kicker?: string;
  className?: string;
}

const DEFAULT_OPTIONS: PollOption[] = [
  { id: "self-hosted", label: "Yes — 100% self-hosted on Indian GPU clouds (Yotta/CtrlS)", votes: 142 },
  { id: "hybrid", label: "Hybrid — Open weights for core logic, Cloud APIs for multimodal", votes: 218 },
  { id: "closed", label: "No — Frontier labs (OpenAI/Anthropic) will keep performance lead", votes: 64 },
];

export function CommunityPollSection({
  config,
  pollId: pollIdProp,
  question: questionProp,
  options: optionsProp,
  title: titleProp,
  subtitle: subtitleProp,
  kicker: kickerProp,
  className,
}: CommunityPollSectionProps = {}) {
  const pollId =
    (config?.customSettings?.pollId as string) ||
    pollIdProp ||
    config?.id ||
    "pulse-open-weights-2026";

  const question =
    (config?.customSettings?.question as string) ||
    questionProp ||
    config?.title ||
    titleProp ||
    "Will open-weight reasoning models (DeepSeek, Llama) replace proprietary APIs in your engineering stack by 2027?";

  const initialOptions: PollOption[] =
    (config?.customSettings?.options as PollOption[]) ||
    optionsProp ||
    DEFAULT_OPTIONS;

  const kicker = config?.kicker || kickerProp || "Community Pulse // Engineering Survey";
  const subtitle =
    config?.subtitle ||
    subtitleProp ||
    "Live benchmark poll for Indian engineers, ML leads, and technology founders.";

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pollData, setPollData] = useState<PollOption[]>(initialOptions);
  const [hasVoted, setHasVoted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedVote = localStorage.getItem(`poll_vote_${pollId}`);
      if (savedVote) {
        setSelectedOption(savedVote);
        setHasVoted(true);
      }
    } catch {}
  }, [pollId]);

  const totalVotes = pollData.reduce((acc, curr) => acc + curr.votes, 0);

  const handleVote = (optionId: string) => {
    if (hasVoted) return;

    setSelectedOption(optionId);
    setHasVoted(true);

    try {
      localStorage.setItem(`poll_vote_${pollId}`, optionId);
    } catch {}

    setPollData((prev) =>
      prev.map((opt) => (opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt))
    );
  };

  return (
    <section
      className={cn(
        "py-10 sm:py-14 border-b border-[var(--color-border,#E2E8F0)]",
        className
      )}
      aria-label="Community Reader Poll"
    >
      <div className="max-w-4xl mx-auto rounded-2xl border border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)] p-6 sm:p-8 shadow-xs">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-[var(--color-border,#E2E8F0)] gap-2">
          <div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary-accent,#10B981)] mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{kicker}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black tracking-tight text-[var(--color-heading,#0F172A)]">
              {question}
            </h3>
            {subtitle && (
              <p className="text-xs text-[var(--color-muted-text,#64748B)] mt-1">{subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[var(--color-muted-text,#64748B)] bg-[var(--color-secondary-surface,#F1F5F9)] px-3 py-1 rounded-md shrink-0 self-start sm:self-auto">
            <Users className="h-3.5 w-3.5" />
            <span>{totalVotes.toLocaleString()} votes</span>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {pollData.map((option) => {
            const isSelected = selectedOption === option.id;
            const percentage =
              totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted}
                className={cn(
                  "relative w-full overflow-hidden rounded-xl border p-4 text-left transition-all",
                  hasVoted ? "cursor-default" : "hover:border-[var(--color-primary-accent,#10B981)] cursor-pointer",
                  isSelected
                    ? "border-[var(--color-primary-accent,#10B981)] bg-[var(--color-primary-accent,#10B981)]/5"
                    : "border-[var(--color-border,#E2E8F0)] bg-[var(--color-main-background,#F8FAFC)]"
                )}
                aria-pressed={isSelected}
              >
                {/* Background Percentage Fill Bar */}
                {hasVoted && (
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all duration-700 ease-out",
                      isSelected
                        ? "bg-[var(--color-primary-accent,#10B981)]/20"
                        : "bg-[var(--color-secondary-surface,#F1F5F9)]"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                        isSelected
                          ? "border-[var(--color-primary-accent,#10B981)] bg-[var(--color-primary-accent,#10B981)] text-white"
                          : "border-[var(--color-border,#E2E8F0)] bg-[var(--color-card-background,#FFFFFF)]"
                      )}
                    >
                      {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-semibold",
                        isSelected
                          ? "text-[var(--color-heading,#0F172A)]"
                          : "text-[var(--color-body-text,#334155)]"
                      )}
                    >
                      {option.label}
                    </span>
                  </div>

                  {hasVoted && (
                    <span className="font-mono text-xs sm:text-sm font-bold text-[var(--color-heading,#0F172A)] shrink-0">
                      {percentage}%
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {hasVoted && (
          <p className="mt-4 text-center font-mono text-[11px] text-[var(--color-muted-text,#64748B)]">
            ✓ Your response has been recorded. Thank you for contributing to India&apos;s AI benchmark intelligence.
          </p>
        )}
      </div>
    </section>
  );
}

// Backward-compatibility alias
export { CommunityPollSection as CommunityPollWidget };
