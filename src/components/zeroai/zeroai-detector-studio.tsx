"use client";

import { useState, useRef, useMemo } from "react";
import {
  ShieldCheck,
  Sparkles,
  ScanText,
  Upload,
  Trash2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Activity,
  BarChart3,
  Eye,
  Edit3,
  Info,
  Lock,
  Loader2,
  FileText,
} from "lucide-react";
import type {
  ZeroAiAnalysisResult,
  ZeroAiSentenceClassification,
} from "@/lib/zeroai/analyzer";

const SAMPLE_AI_TEXT = `In today's digital age, artificial intelligence is poised to reshape the rapidly evolving landscape of global technology. Moreover, enterprises across major industries are navigating the complexities of integrating automated workflows into existing operational pipelines. It is worth noting that foundation models serve as a testament to modern engineering achievements, fostering innovation at unprecedented scale. Furthermore, these multifaceted systems unlock the full potential of data processing while not only accelerating deployment cycles but also enhancing institutional efficiency. Consequently, seamless integration highlights the importance of robust governance frameworks across departments. Additionally, industry analysts emphasize the pivotal role of cloud infrastructure in sustaining transformative impact for stakeholders. In conclusion, harnessing the power of generative intelligence underscores the need for strategic adaptation, as only time will tell how deeply these tools reshape productivity.`;

const SAMPLE_HUMAN_TEXT = `We tracked the inference bills. They spiked overnight.
When Bengaluru startup VoltStack migrated 40% of its customer triage workload from proprietary endpoints to quantized open-weights on an 8-GPU node, latency dropped from 410ms to 88ms—and monthly spend plunged from $14,200 to $3,150.
"Nobody believed the caching layer would hold up during Monday traffic," founder Priya Nair told us over coffee in Indiranagar (she'd bet her ops lead dinner on a full rollback before noon).
Wait: isn't raw benchmark throughput misleading? Usually, yes. Dr. R. Krishnan's team at IIT Madras published v2.4 of their Indic telemetry suite last week, and the error bars tell a messier story than the launch deck suggested!
Don't mistake cheap tokens for solved reliability. Real production outages still start with boring schema mismatches, silent timeouts, and stale retry queues.`;

const SAMPLE_MIXED_TEXT = `Open-source robotics teams shipped three compact actuator controllers this quarter, cutting prototype hardware costs to $480 per arm.
"Our mechanical tolerances held within 0.2mm," said lead engineer Arjun Rao after running 12 hours of thermal load testing.
Furthermore, it is worth noting that modular firmware architectures serve as a catalyst for seamless integration across academic laboratories.
We still need stricter fault recovery before factory floors adopt these rigs at scale.`;

type ViewTab = "edit" | "highlight";
type SentenceFilter = "all" | ZeroAiSentenceClassification;

const MAX_CHARS = 30_000;

export function ZeroAiDetectorStudio() {
  const [text, setText] = useState<string>("");
  const [result, setResult] = useState<ZeroAiAnalysisResult | null>(null);
  const [viewTab, setViewTab] = useState<ViewTab>("edit");
  const [sentenceFilter, setSentenceFilter] = useState<SentenceFilter>("all");
  const [selectedSentenceId, setSelectedSentenceId] = useState<number | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const liveCounts = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { words: 0, chars: 0, sentences: 0 };
    const words = (trimmed.match(/[a-zA-Z0-9]+(?:['’\-][a-zA-Z0-9]+)*/g) || []).length;
    const sentences = trimmed
      .split(/[.!?]+(?=\s|$)/)
      .filter((s) => s.trim().length > 0).length;
    return {
      words,
      chars: trimmed.length,
      sentences: Math.max(1, sentences),
    };
  }, [text]);

  async function runAnalysis(inputText: string) {
    const trimmed = inputText.trim();
    if (trimmed.length < 15) {
      setError("Please enter at least 15 characters of English text for stylometric analysis.");
      return;
    }
    if (trimmed.length > MAX_CHARS) {
      setError(`Text exceeds ${MAX_CHARS.toLocaleString()} character limit.`);
      return;
    }

    setError(null);
    setIsAnalyzing(true);
    setSelectedSentenceId(null);

    try {
      const res = await fetch("/api/zeroai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error || "Unable to analyze text. Please try again.");
        return;
      }

      setResult(data.result);
      setViewTab("highlight");
      setSentenceFilter("all");
    } catch {
      setError("Network error while running ZeroAI detection. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function handleLoadSample(sampleText: string) {
    setText(sampleText);
    setError(null);
    void runAnalysis(sampleText);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 250_000) {
      setError("Uploaded file is too large (max 250 KB plain text / markdown).");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const sliced = content.slice(0, MAX_CHARS);
      setText(sliced);
      setViewTab("edit");
      setError(null);
      if (sliced.trim().length >= 15) {
        void runAnalysis(sliced);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function handleClear() {
    setText("");
    setResult(null);
    setViewTab("edit");
    setError(null);
    setSelectedSentenceId(null);
  }

  async function handleCopyReport() {
    if (!result) return;
    const summaryText = [
      `ZeroAI Stylometric Report (${result.engineVersion})`,
      `Verdict: ${result.verdict} (${result.confidence} Confidence)`,
      `AI Pattern Probability: ${result.aiProbability}% | Human Cadence: ${result.humanProbability}%`,
      `Metrics: ${result.metrics.wordCount} words · ${result.metrics.sentenceCount} sentences · Burstiness CV ${result.metrics.burstinessCV} · MATTR ${result.metrics.lexicalDiversityMattr}%`,
      `Summary: ${result.summary}`,
      result.flaggedPatterns.length > 0
        ? `Flagged Patterns: ${result.flaggedPatterns.map((p) => `${p.phrase} (x${p.count})`).join(", ")}`
        : "Flagged Patterns: None detected",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored cleanly
    }
  }

  function handleDownloadJson() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zeroai-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredSentences = useMemo(() => {
    if (!result) return [];
    if (sentenceFilter === "all") return result.sentences;
    return result.sentences.filter((s) => s.classification === sentenceFilter);
  }, [result, sentenceFilter]);

  const sentenceCounts = useMemo(() => {
    if (!result) return { ai: 0, mixed: 0, human: 0 };
    return {
      ai: result.sentences.filter((s) => s.classification === "ai").length,
      mixed: result.sentences.filter((s) => s.classification === "mixed").length,
      human: result.sentences.filter((s) => s.classification === "human").length,
    };
  }, [result]);

  // SVG Ring math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const aiRatio = result ? result.aiProbability / 100 : 0;
  const strokeDashoffset = circumference * (1 - aiRatio);

  const verdictStyle = !result
    ? {
        badgeBg: "bg-[var(--color-secondary-surface)] text-[var(--color-muted-text)]",
        stroke: "#687482",
      }
    : result.aiProbability >= 60
    ? {
        badgeBg:
          "bg-[#D94F35]/15 text-[#D94F35] dark:bg-[#E05A42]/20 dark:text-[#F0735D] border border-[#D94F35]/30",
        stroke: "#D94F35",
      }
    : result.aiProbability >= 25
    ? {
        badgeBg:
          "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
        stroke: "#D97706",
      }
    : {
        badgeBg:
          "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
        stroke: "#15803D",
      };

  return (
    <div className="space-y-8">
      {/* ── Quick Samples & Privacy Strip ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] px-4 py-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] mr-1">
            Try Sample:
          </span>
          <button
            type="button"
            onClick={() => handleLoadSample(SAMPLE_AI_TEXT)}
            className="rounded-md border border-[var(--border)] bg-[var(--color-main-background)] px-2.5 py-1 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            AI-Generated Essay
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample(SAMPLE_HUMAN_TEXT)}
            className="rounded-md border border-[var(--border)] bg-[var(--color-main-background)] px-2.5 py-1 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            Human Journalism
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample(SAMPLE_MIXED_TEXT)}
            className="rounded-md border border-[var(--border)] bg-[var(--color-main-background)] px-2.5 py-1 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            Blended Draft
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[var(--color-muted-text)]">
          <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Zero retention · Clean-room local stylometric engine</span>
        </div>
      </div>

      {/* ── Main Two-Column Workbench ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Input / Highlighted Text Studio */}
        <div className="lg:col-span-7 min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] shadow-sm overflow-hidden">
          {/* Toolbar Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--color-main-background)]/60 px-4 py-3">
            <div className="inline-flex rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] p-0.5">
              <button
                type="button"
                onClick={() => setViewTab("edit")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${
                  viewTab === "edit"
                    ? "bg-[#101820] text-white dark:bg-[#E05A42]"
                    : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit Text
              </button>
              <button
                type="button"
                disabled={!result}
                onClick={() => setViewTab("highlight")}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                  !result
                    ? "opacity-45 cursor-not-allowed text-[var(--color-muted-text)]"
                    : viewTab === "highlight"
                    ? "bg-[#101820] text-white dark:bg-[#E05A42] cursor-pointer"
                    : "text-[var(--color-muted-text)] hover:text-[var(--color-heading)] cursor-pointer"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Highlighted View
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,text/plain,text/markdown"
                onChange={handleFileUpload}
                className="hidden"
                aria-label="Upload text or markdown file"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-heading)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Upload .txt/.md</span>
              </button>
              {text.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--color-card-background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-muted-text)] hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  aria-label="Clear text"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Body: Textarea OR Highlighted Viewer */}
          <div className="p-4 sm:p-5">
            {viewTab === "edit" || !result ? (
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Paste any article, essay, email, or LLM draft (minimum 50 words recommended for high stylometric confidence)..."
                rows={14}
                maxLength={MAX_CHARS}
                aria-label="Text to analyze with ZeroAI"
                className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/50 p-4 text-sm sm:text-[15px] leading-relaxed text-[var(--color-body-text)] placeholder:text-[var(--color-muted-text)]/70 outline-none focus:border-[var(--accent)] transition-colors"
              />
            ) : (
              <div className="space-y-4">
                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-[var(--border)] text-[11px] font-medium">
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-heading)]">
                    <span className="h-2.5 w-2.5 rounded-xs bg-[#D94F35]/35 border border-[#D94F35]" />
                    AI Pattern ({sentenceCounts.ai})
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-heading)]">
                    <span className="h-2.5 w-2.5 rounded-xs bg-amber-500/30 border border-amber-500" />
                    Blended / Uncertain ({sentenceCounts.mixed})
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--color-heading)]">
                    <span className="h-2.5 w-2.5 rounded-xs bg-emerald-500/25 border border-emerald-600" />
                    Human Cadence ({sentenceCounts.human})
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-[var(--color-muted-text)]">
                    Click any sentence to inspect telemetry
                  </span>
                </div>

                {/* Highlighted Interactive Prose */}
                <div className="min-h-[320px] rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/40 p-4 sm:p-5 text-sm sm:text-[15px] leading-loose text-[var(--color-body-text)]">
                  {result.sentences.map((s) => {
                    const isSelected = selectedSentenceId === s.id;
                    const highlightCls =
                      s.classification === "ai"
                        ? "bg-[#D94F35]/15 dark:bg-[#E05A42]/20 border-b-2 border-[#D94F35] text-[var(--color-heading)]"
                        : s.classification === "mixed"
                        ? "bg-amber-500/15 dark:bg-amber-400/15 border-b-2 border-amber-500 text-[var(--color-heading)]"
                        : "hover:bg-emerald-500/10 border-b border-transparent";

                    return (
                      <span key={s.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSentenceId(isSelected ? null : s.id)
                          }
                          title={`Sentence #${s.id} · ${s.aiScore}% AI signal (${s.reasons[0] || "Analyzed"})`}
                          className={`inline text-left rounded px-1 py-0.5 transition-colors cursor-pointer ${highlightCls} ${
                            isSelected ? "ring-2 ring-[var(--accent)]" : ""
                          }`}
                        >
                          {s.text}
                        </button>{" "}
                      </span>
                    );
                  })}
                </div>

                {/* Selected Sentence Callout */}
                {selectedSentenceId !== null && (() => {
                  const chosen = result.sentences.find((x) => x.id === selectedSentenceId);
                  if (!chosen) return null;
                  return (
                    <div className="rounded-xl border border-[var(--accent)]/40 bg-[var(--accent-light)]/50 dark:bg-[#E05A42]/10 p-3.5 text-xs space-y-1.5">
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-bold text-[var(--color-heading)]">
                          Sentence #{chosen.id} · {chosen.wordCount} words
                        </span>
                        <span className="font-bold text-[var(--accent)]">
                          {chosen.aiScore}% AI Pattern Signal
                        </span>
                      </div>
                      <p className="text-[var(--color-muted-text)]">
                        Signals: {chosen.reasons.join(" · ")}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-3 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5 text-xs font-medium text-rose-700 dark:text-rose-300"
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Footer Controls */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--color-muted-text)]">
                <span>
                  <strong className="text-[var(--color-heading)]">{liveCounts.words}</strong> words
                </span>
                <span>·</span>
                <span>
                  <strong className="text-[var(--color-heading)]">{liveCounts.sentences}</strong> sentences
                </span>
                <span>·</span>
                <span>
                  {liveCounts.chars.toLocaleString()} / {MAX_CHARS.toLocaleString()} chars
                </span>
              </div>

              <button
                type="button"
                disabled={isAnalyzing || liveCounts.chars < 15}
                onClick={() => void runAnalysis(text)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D94F35] hover:bg-[#BF3E26] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Scanning Stylometry...
                  </>
                ) : (
                  <>
                    <ScanText className="h-4 w-4" />
                    Analyze with ZeroAI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Forensic Scorecard */}
        <div className="lg:col-span-5 min-w-0 space-y-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 sm:p-6 shadow-sm">
            {!result ? (
              <div className="py-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-secondary-surface)] text-[var(--accent)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="font-display text-lg font-bold text-[var(--color-heading)]">
                  Ready for Stylometric Scan
                </h2>
                <p className="text-xs text-[var(--color-muted-text)] leading-relaxed max-w-sm mx-auto">
                  Paste text on the left or pick one of the preset samples above to compute AI likelihood, burstiness variance, lexical entropy, and sentence attribution.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Top Gauge + Verdict */}
                <div className="flex items-center gap-5">
                  <div className="relative h-28 w-28 shrink-0 flex items-center justify-center">
                    <svg className="h-28 w-28 -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        className="text-[var(--color-secondary-surface)]"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r={radius}
                        stroke={verdictStyle.stroke}
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="font-display text-2xl font-black text-[var(--color-heading)]">
                        {result.aiProbability}%
                      </span>
                      <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
                        AI Signal
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-md px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${verdictStyle.badgeBg}`}
                      >
                        {result.verdict}
                      </span>
                      <span className="inline-flex items-center rounded-md border border-[var(--border)] bg-[var(--color-main-background)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--color-muted-text)]">
                        {result.confidence} Confidence
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-[var(--color-muted-text)]">
                      <span>AI Pattern: {result.aiProbability}%</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        Human: {result.humanProbability}%
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-[var(--color-secondary-surface)] overflow-hidden flex">
                      <div
                        className="h-full bg-[#D94F35] transition-all duration-500"
                        style={{ width: `${result.aiProbability}%` }}
                      />
                      <div
                        className="h-full bg-emerald-600 transition-all duration-500"
                        style={{ width: `${result.humanProbability}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Editorial Summary */}
                <p className="text-xs leading-relaxed text-[var(--color-body-text)] rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/60 p-3.5">
                  {result.summary}
                </p>

                {result.confidence === "Low" && (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-[11px] text-amber-800 dark:text-amber-300">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      Short sample ({result.metrics.wordCount} words). Stylometric confidence improves substantially above 50–120 words.
                    </span>
                  </div>
                )}

                {/* 4-Pillar Signals Breakdown */}
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading)]">
                    <BarChart3 className="h-3.5 w-3.5 text-[var(--accent)]" />
                    <span>Stylometric Pillar Breakdown</span>
                  </div>

                  {result.signalsBreakdown.map((sig) => (
                    <div key={sig.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--color-heading)]">
                          {sig.label}
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            sig.polarity === "human"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-[var(--accent)]"
                          }`}
                        >
                          {sig.score}/100
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-[var(--color-secondary-surface)] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            sig.polarity === "human" ? "bg-emerald-600" : "bg-[#D94F35]"
                          }`}
                          style={{ width: `${sig.score}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-[var(--color-muted-text)] leading-snug">
                        {sig.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Forensic Telemetry Tiles */}
                <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-[var(--border)]">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/60 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted-text)]">
                      Burstiness (CV)
                    </div>
                    <div className="mt-1 font-display text-base font-bold text-[var(--color-heading)]">
                      {result.metrics.burstinessCV.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-[var(--color-muted-text)]">
                      σ = {result.metrics.burstinessStdDev} words/sent
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/60 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted-text)]">
                      Lexical MATTR
                    </div>
                    <div className="mt-1 font-display text-base font-bold text-[var(--color-heading)]">
                      {result.metrics.lexicalDiversityMattr}%
                    </div>
                    <div className="text-[10px] text-[var(--color-muted-text)]">
                      Entropy {result.metrics.wordEntropy} bits
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/60 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted-text)]">
                      Avg Sentence Len
                    </div>
                    <div className="mt-1 font-display text-base font-bold text-[var(--color-heading)]">
                      {result.metrics.avgSentenceLength} wds
                    </div>
                    <div className="text-[10px] text-[var(--color-muted-text)]">
                      Bigram rep {result.metrics.bigramRepetitionRate}%
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--color-main-background)]/60 p-3">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--color-muted-text)]">
                      Markers Found
                    </div>
                    <div className="mt-1 font-display text-base font-bold text-[var(--color-heading)]">
                      {result.metrics.aiPhraseHits} AI / {result.metrics.humanMarkerHits} Hum
                    </div>
                    <div className="text-[10px] text-[var(--color-muted-text)]">
                      Hapax ratio {result.metrics.hapaxRatio}%
                    </div>
                  </div>
                </div>

                {/* Flagged Cliché Patterns */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading)]">
                    Detected AI Pattern Markers ({result.flaggedPatterns.length})
                  </div>
                  {result.flaggedPatterns.length === 0 ? (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      No common LLM cliché phrases or formulaic transitions detected.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {result.flaggedPatterns.map((p) => (
                        <span
                          key={p.phrase}
                          title={`${p.category} · ${p.impact} impact`}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-mono font-semibold ${
                            p.impact === "High"
                              ? "bg-[#D94F35]/12 text-[#D94F35] dark:bg-[#E05A42]/20 dark:text-[#F0735D] border border-[#D94F35]/25"
                              : "bg-amber-500/12 text-amber-800 dark:text-amber-300 border border-amber-500/25"
                          }`}
                        >
                          <span>{p.phrase}</span>
                          {p.count > 1 && <span className="opacity-80">×{p.count}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Export Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => void handleCopyReport()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--color-heading)] transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied Summary
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-[var(--accent)]" />
                        Copy Summary
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--color-main-background)] hover:border-[var(--accent)] px-3 py-2 text-xs font-bold text-[var(--color-heading)] transition-colors cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
                    Export JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sentence-by-Sentence Audit Table ── */}
      {result && result.sentences.length > 0 && (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              <h2 className="font-display text-lg font-bold text-[var(--color-heading)]">
                Sentence-Level Stylometric Audit ({result.sentences.length})
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { key: "all", label: `All (${result.sentences.length})` },
                  { key: "ai", label: `AI (${sentenceCounts.ai})` },
                  { key: "mixed", label: `Mixed (${sentenceCounts.mixed})` },
                  { key: "human", label: `Human (${sentenceCounts.human})` },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSentenceFilter(item.key)}
                  className={`rounded-md px-2.5 py-1 font-mono text-[11px] font-bold transition-colors cursor-pointer ${
                    sentenceFilter === item.key
                      ? "bg-[#101820] text-white dark:bg-[#E05A42]"
                      : "border border-[var(--border)] bg-[var(--color-main-background)] text-[var(--color-muted-text)] hover:text-[var(--color-heading)]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {filteredSentences.map((s) => (
              <div
                key={s.id}
                className="py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                    <span className="font-bold text-[var(--color-muted-text)]">#{s.id}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-bold uppercase ${
                        s.classification === "ai"
                          ? "bg-[#D94F35]/15 text-[#D94F35] dark:text-[#F0735D]"
                          : s.classification === "mixed"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                      }`}
                    >
                      {s.classification} · {s.aiScore}%
                    </span>
                    <span className="text-[var(--color-muted-text)]">{s.wordCount} words</span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--color-body-text)] leading-relaxed break-words">
                    {s.text}
                  </p>
                </div>

                <div className="sm:w-64 shrink-0 text-[11px] text-[var(--color-muted-text)] sm:text-right">
                  {s.reasons.join(" · ")}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Methodology & Disclosure Footer Card ── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            <Activity className="h-4 w-4" />
            <span>Burstiness &amp; Cadence</span>
          </div>
          <p className="text-xs text-[var(--color-muted-text)] leading-relaxed">
            Human journalism alternates between rapid 4-word observations and dense multi-clause reporting. Statistical models often cluster around uniform 15–23 word sentences.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            <FileText className="h-4 w-4" />
            <span>Lexical Entropy</span>
          </div>
          <p className="text-xs text-[var(--color-muted-text)] leading-relaxed">
            ZeroAI measures Moving-Average Type-Token Ratio (MATTR), Shannon word entropy, hapax legomena ratio, and bigram repetition independently of third-party detectors.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 space-y-2">
          <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            <ShieldCheck className="h-4 w-4" />
            <span>Editorial Responsibility</span>
          </div>
          <p className="text-xs text-[var(--color-muted-text)] leading-relaxed">
            AI detection scores indicate statistical writing patterns, never definitive proof of authorship. Heavily copy-edited prose or ESL writing can resemble synthetic phrasing.
          </p>
        </div>
      </section>
    </div>
  );
}
