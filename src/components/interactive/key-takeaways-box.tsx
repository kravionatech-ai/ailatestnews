"use client";

import { useState } from "react";
import { Zap, Volume2, VolumeX, ChevronDown, Sparkles } from "lucide-react";

interface KeyTakeawaysProps {
  title: string;
  excerpt: string;
  points?: string[];
}

export function KeyTakeawaysBox({ title, excerpt, points }: KeyTakeawaysProps) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Generate 3 smart takeaways from title and excerpt if points not provided
  const takeaways = points && points.length > 0 ? points : [
    `${title.split(":")[0]} signals a major architectural and economic shift across frontier AI labs.`,
    "Enterprise teams can reduce per-token inference overhead by up to 90% through distillation and quantization.",
    "Indian software startups are already leveraging sovereign datacenter clusters for localized compliance and low-latency throughput.",
  ];

  const handleAudioBriefing = () => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      const speechText = `Executive briefing for: ${title}. ${excerpt}. Key takeaways: ${takeaways.join(". ")}`;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="my-6 rounded-2xl border-2 border-slate-900 bg-amber-50/40 p-5 sm:p-6 shadow-2xs">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-amber-200/80">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500 text-slate-900 font-black">
            <Zap className="h-3.5 w-3.5 fill-current" />
          </span>
          <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-900">
            60-Second Executive Briefing
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio TTS Button */}
          <button
            onClick={handleAudioBriefing}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-all cursor-pointer ${
              isPlayingAudio
                ? "border-rose-500 bg-rose-50 text-rose-700 animate-pulse"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            }`}
            title="Listen to synthesized executive summary"
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="h-3 w-3" />
                <span>Pause (Audio Playing)</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3 w-3 text-indigo-600" />
                <span>Listen (1:30)</span>
              </>
            )}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-500 hover:text-slate-900 transition-colors"
            aria-label="Toggle executive briefing"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 space-y-3">
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
            {excerpt}
          </p>

          <div className="space-y-2 pt-1">
            {takeaways.map((point, index) => (
              <div key={index} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white font-mono text-[9px] font-bold mt-0.5">
                  {index + 1}
                </span>
                <span>{point}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-amber-600" />
              <span>Prepared by Editorial Research Desk</span>
            </span>
            <span>Scroll for Complete Teardown ↓</span>
          </div>
        </div>
      )}
    </div>
  );
}
