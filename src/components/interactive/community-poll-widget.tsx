"use client";

import { useState, useEffect } from "react";
import { BarChart3, CheckCircle2, Users } from "lucide-react";

interface PollOption {
  id: string;
  label: string;
  votes: number;
}

interface CommunityPollProps {
  pollId?: string;
  question?: string;
  options?: PollOption[];
}

const DEFAULT_OPTIONS: PollOption[] = [
  { id: "self-hosted", label: "Yes — 100% self-hosted on Indian GPU clouds (Yotta/CtrlS)", votes: 1420 },
  { id: "hybrid", label: "Hybrid — Open weights for core logic, Cloud APIs for multimodal", votes: 2180 },
  { id: "closed", label: "No — Frontier labs (OpenAI/Anthropic) will keep performance lead", votes: 640 },
];

export function CommunityPollWidget({
  pollId = "pulse-open-weights-2026",
  question = "Will open-weight reasoning models (DeepSeek, Llama) replace proprietary APIs in your engineering stack by 2027?",
  options = DEFAULT_OPTIONS,
}: CommunityPollProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [pollData, setPollData] = useState<PollOption[]>(options);
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
    <div className="my-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 shadow-2xs">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-rose-600">
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Newsroom Community Pulse</span>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
          <Users className="h-3 w-3" />
          <span>{(totalVotes + (hasVoted ? 1 : 0)).toLocaleString()} votes</span>
        </span>
      </div>

      <h4 className="mt-3 text-sm sm:text-base font-bold text-slate-900 leading-snug">
        {question}
      </h4>

      <div className="mt-4 space-y-2.5">
        {pollData.map((option) => {
          const isSelected = selectedOption === option.id;
          const percentage =
            totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={hasVoted}
              className={`relative w-full overflow-hidden rounded-xl border p-3.5 text-left transition-all ${
                hasVoted
                  ? isSelected
                    ? "border-indigo-600 bg-indigo-50/60"
                    : "border-slate-200 bg-white"
                  : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50 cursor-pointer"
              }`}
            >
              {/* Background percentage fill bar */}
              {hasVoted && (
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-700 ease-out ${
                    isSelected ? "bg-indigo-100" : "bg-slate-100"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-800">
                  {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" />}
                  <span>{option.label}</span>
                </span>

                {hasVoted && (
                  <span className="font-mono text-xs font-bold text-slate-900 shrink-0">
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
        <span>
          {hasVoted ? "✓ Your vote has been recorded" : "Click any option to cast your vote"}
        </span>
        <span className="font-mono">Updated in real-time</span>
      </div>
    </div>
  );
}
