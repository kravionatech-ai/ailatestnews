export type ZeroAiSentenceClassification = "human" | "mixed" | "ai";

export type ZeroAiVerdict =
  | "Likely Human-Written"
  | "Human with AI Editing / Mixed"
  | "Likely AI-Generated";

export type ZeroAiConfidence = "Low" | "Medium" | "High";

export interface ZeroAiSentenceResult {
  id: number;
  text: string;
  start: number;
  end: number;
  wordCount: number;
  aiScore: number;
  classification: ZeroAiSentenceClassification;
  reasons: string[];
}

export interface ZeroAiFlaggedPattern {
  phrase: string;
  category:
    | "Transition Cliché"
    | "Hyperbole"
    | "Symmetric Framing"
    | "Concluding Formula"
    | "Template Hedging";
  count: number;
  impact: "Medium" | "High";
}

export interface ZeroAiSignalBreakdown {
  id: string;
  label: string;
  score: number;
  description: string;
  polarity: "ai" | "human";
}

export interface ZeroAiMetrics {
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
  avgSentenceLength: number;
  burstinessStdDev: number;
  burstinessCV: number;
  lexicalDiversityMattr: number;
  wordEntropy: number;
  bigramRepetitionRate: number;
  hapaxRatio: number;
  aiPhraseHits: number;
  humanMarkerHits: number;
  readingTimeSeconds: number;
}

export interface ZeroAiAnalysisResult {
  aiProbability: number;
  humanProbability: number;
  verdict: ZeroAiVerdict;
  confidence: ZeroAiConfidence;
  summary: string;
  metrics: ZeroAiMetrics;
  signalsBreakdown: ZeroAiSignalBreakdown[];
  flaggedPatterns: ZeroAiFlaggedPattern[];
  sentences: ZeroAiSentenceResult[];
  analyzedAt: string;
  engineVersion: string;
}

interface PatternSpec {
  phrase: string;
  regex: RegExp;
  category: ZeroAiFlaggedPattern["category"];
  impact: ZeroAiFlaggedPattern["impact"];
  weight: number;
}

const LLM_PATTERN_SPECS: PatternSpec[] = [
  {
    phrase: "moreover",
    regex: /\bmoreover\b/gi,
    category: "Transition Cliché",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "furthermore",
    regex: /\bfurthermore\b/gi,
    category: "Transition Cliché",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "additionally",
    regex: /\badditionally\b/gi,
    category: "Transition Cliché",
    impact: "Medium",
    weight: 9,
  },
  {
    phrase: "consequently",
    regex: /\bconsequently\b/gi,
    category: "Transition Cliché",
    impact: "Medium",
    weight: 9,
  },
  {
    phrase: "notably",
    regex: /\bnotably\b/gi,
    category: "Transition Cliché",
    impact: "Medium",
    weight: 8,
  },
  {
    phrase: "in conclusion",
    regex: /\bin conclusion\b/gi,
    category: "Concluding Formula",
    impact: "High",
    weight: 16,
  },
  {
    phrase: "in summary",
    regex: /\bin summary\b/gi,
    category: "Concluding Formula",
    impact: "High",
    weight: 12,
  },
  {
    phrase: "only time will tell",
    regex: /\bonly time will tell\b/gi,
    category: "Concluding Formula",
    impact: "High",
    weight: 18,
  },
  {
    phrase: "key takeaway",
    regex: /\bkey takeaways?\b/gi,
    category: "Concluding Formula",
    impact: "Medium",
    weight: 10,
  },
  {
    phrase: "it is worth noting",
    regex: /\bit(?:'s| is) (?:worth|important to) not(?:e|ing)\b/gi,
    category: "Template Hedging",
    impact: "High",
    weight: 15,
  },
  {
    phrase: "underscores the importance",
    regex: /\bunderscores? the (?:importance|need|significance)\b/gi,
    category: "Template Hedging",
    impact: "High",
    weight: 16,
  },
  {
    phrase: "highlights the importance",
    regex: /\bhighlights? the (?:importance|need|significance|potential)\b/gi,
    category: "Template Hedging",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "serves as a",
    regex: /\bserves as a (?:testament|catalyst|cornerstone|reminder|beacon)\b/gi,
    category: "Template Hedging",
    impact: "High",
    weight: 18,
  },
  {
    phrase: "delve into",
    regex: /\bdelv(?:e|es|ing) into\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 18,
  },
  {
    phrase: "testament to",
    regex: /\btestament to\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 15,
  },
  {
    phrase: "tapestry",
    regex: /\b(?:rich )?tapestry\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 18,
  },
  {
    phrase: "game-changer",
    regex: /\bgame[- ]changer\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "revolutionize",
    regex: /\brevolutioniz(?:e|es|ing)\b/gi,
    category: "Hyperbole",
    impact: "Medium",
    weight: 11,
  },
  {
    phrase: "pivotal / crucial role",
    regex: /\b(?:pivotal|crucial) role\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 15,
  },
  {
    phrase: "rapidly evolving landscape",
    regex: /\b(?:rapidly|ever[- ])evolving (?:landscape|world|ecosystem)\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 18,
  },
  {
    phrase: "navigating the complexities",
    regex: /\bnavigating the (?:complexities|landscape|challenges)\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 16,
  },
  {
    phrase: "fostering innovation",
    regex: /\bfostering (?:innovation|collaboration|growth)\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "harness the power",
    regex: /\bharness(?:ing)? the power\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 16,
  },
  {
    phrase: "paradigm shift",
    regex: /\bparadigm shift\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "seamless integration",
    regex: /\bseamless(?:ly)? integrat(?:e|ed|ing|ion)\b/gi,
    category: "Hyperbole",
    impact: "Medium",
    weight: 11,
  },
  {
    phrase: "transformative impact",
    regex: /\btransformative (?:impact|potential|power)\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 15,
  },
  {
    phrase: "multifaceted / synergy",
    regex: /\b(?:multifaceted|synergy|plethora|myriad)\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "in today's digital age",
    regex: /\bin today['’]s (?:digital|fast-paced|modern|ai[- ]driven) (?:age|world|era)\b/gi,
    category: "Template Hedging",
    impact: "High",
    weight: 18,
  },
  {
    phrase: "poised to reshape",
    regex: /\bpoised to (?:reshape|transform|redefine|revolutionize)\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 15,
  },
  {
    phrase: "comprehensive overview",
    regex: /\bcomprehensive (?:overview|guide|understanding)\b/gi,
    category: "Template Hedging",
    impact: "Medium",
    weight: 10,
  },
  {
    phrase: "unlock the potential",
    regex: /\bunlock(?:ing)? the (?:full )?potential\b/gi,
    category: "Hyperbole",
    impact: "High",
    weight: 14,
  },
  {
    phrase: "not only ... but also",
    regex: /\bnot only\b[\s\S]{3,90}\bbut also\b/gi,
    category: "Symmetric Framing",
    impact: "Medium",
    weight: 10,
  },
  {
    phrase: "on one hand ... on the other hand",
    regex: /\bon (?:the )?one hand\b[\s\S]{3,140}\bon the other hand\b/gi,
    category: "Symmetric Framing",
    impact: "High",
    weight: 13,
  },
];

const ABBREVIATIONS = new Set([
  "dr.",
  "mr.",
  "mrs.",
  "ms.",
  "prof.",
  "sr.",
  "jr.",
  "st.",
  "vs.",
  "etc.",
  "inc.",
  "ltd.",
  "co.",
  "fig.",
  "no.",
  "u.s.",
  "u.k.",
  "e.g.",
  "i.e.",
  "al.",
]);

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

function sanitizeInputText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, " ")
    .replace(/\r\n/g, "\n")
    .trim();
}

function tokenizeWords(text: string): string[] {
  const matches = text.match(/[a-zA-Z0-9]+(?:['’\-][a-zA-Z0-9]+)*/g);
  return matches ? matches : [];
}

/**
 * Splits text into sentence spans with exact start/end indices in normalized text,
 * avoiding false breaks inside decimals, version numbers, or common abbreviations.
 */
function segmentSentences(text: string): Array<{ text: string; start: number; end: number }> {
  if (!text) return [];

  const spans: Array<{ text: string; start: number; end: number }> = [];
  let sliceStart = 0;

  // Skip leading whitespace
  while (sliceStart < text.length && /\s/.test(text.charAt(sliceStart))) {
    sliceStart++;
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);

    // Newline paragraph breaks also terminate standalone headings / paragraphs
    if (ch === "\n") {
      if (i + 1 < text.length && text.charAt(i + 1) === "\n") {
        const segment = text.slice(sliceStart, i).trim();
        if (segment.length > 0) {
          spans.push({ text: segment, start: sliceStart, end: i });
        }
        let nextStart = i + 2;
        while (nextStart < text.length && /\s/.test(text.charAt(nextStart))) nextStart++;
        sliceStart = nextStart;
        i = nextStart - 1;
      }
      continue;
    }

    if (ch !== "." && ch !== "!" && ch !== "?") continue;

    // Preserve ellipses and decimals/versions like 3.5 or v2.1
    if (ch === ".") {
      const prev = i > 0 ? text.charAt(i - 1) : "";
      const next = i + 1 < text.length ? text.charAt(i + 1) : "";
      if (/\d/.test(prev) && /\d/.test(next)) continue;
      if (next === ".") continue;

      // Check abbreviation window ending at i
      const beforeSlice = text.slice(Math.max(sliceStart, i - 10), i + 1).toLowerCase();
      const tokenMatch = beforeSlice.match(/([a-z.]+)$/);
      if (tokenMatch?.[1] && ABBREVIATIONS.has(tokenMatch[1])) continue;
    }

    // Consume trailing quotes/parens after punctuation
    let endIdx = i + 1;
    while (endIdx < text.length && /["'”’)\]]/.test(text.charAt(endIdx))) {
      endIdx++;
    }

    // Only split if followed by whitespace, newline, or end of string
    if (endIdx < text.length && !/[\s\n]/.test(text.charAt(endIdx))) {
      continue;
    }

    const segment = text.slice(sliceStart, endIdx).trim();
    if (segment.length > 0) {
      spans.push({ text: segment, start: sliceStart, end: endIdx });
    }

    let nextStart = endIdx;
    while (nextStart < text.length && /\s/.test(text.charAt(nextStart))) {
      nextStart++;
    }
    sliceStart = nextStart;
    i = nextStart - 1;
  }

  if (sliceStart < text.length) {
    const tail = text.slice(sliceStart).trim();
    if (tail.length > 0) {
      spans.push({ text: tail, start: sliceStart, end: text.length });
    }
  }

  return spans;
}

function computeMattr(lowerWords: string[], windowSize = 50): number {
  if (lowerWords.length === 0) return 0;
  if (lowerWords.length <= windowSize) {
    return new Set(lowerWords).size / lowerWords.length;
  }

  let sumTtr = 0;
  let windows = 0;
  for (let i = 0; i <= lowerWords.length - windowSize; i++) {
    const windowSlice = lowerWords.slice(i, i + windowSize);
    sumTtr += new Set(windowSlice).size / windowSize;
    windows++;
  }
  return windows > 0 ? sumTtr / windows : 0;
}

function computeWordEntropy(lowerWords: string[]): { entropy: number; normalized: number } {
  const n = lowerWords.length;
  if (n <= 1) return { entropy: 0, normalized: 0 };

  const freq = new Map<string, number>();
  for (const w of lowerWords) {
    freq.set(w, (freq.get(w) ?? 0) + 1);
  }

  let h = 0;
  for (const count of freq.values()) {
    const p = count / n;
    h -= p * Math.log2(p);
  }

  const maxH = Math.log2(n);
  return {
    entropy: round1(h),
    normalized: maxH > 0 ? h / maxH : 0,
  };
}

function countHumanMarkers(text: string, sentences: Array<{ wordCount: number }>): {
  humanScore: number;
  markerHits: number;
} {
  const contractions =
    text.match(
      /\b(?:don't|won't|can't|isn't|aren't|wasn't|weren't|didn't|doesn't|haven't|hasn't|hadn't|shouldn't|wouldn't|couldn't|it's|that's|what's|who's|there's|here's|we're|they're|you're|i'm|i've|we've|they've|you've|i'll|we'll|you'll|let's)\b/gi
    ) || [];
  const quotes = text.match(/(?:"[^"\n]{6,180}"|“[^”\n]{6,180}”)/g) || [];
  const concretes =
    text.match(/(?:[$₹€£]\s?\d[\d.,]*(?:[kmb])?|\b\d+(?:\.\d+)?%|\b\d+(?:ms|s|gb|tb|mb|ghz|mhz|nm)\b|\bv\d+\.\d+)/gi) ||
    [];
  const asides = text.match(/(?:\([^()\n]{3,70}\)|[!?])/g) || [];
  const shortPunches = sentences.filter((s) => s.wordCount >= 2 && s.wordCount <= 6).length;
  const longDeep = sentences.filter((s) => s.wordCount >= 26).length;
  const dynamicSpanBonus = shortPunches > 0 && longDeep > 0 ? Math.min(20, shortPunches * 6) : 0;

  const markerHits = contractions.length + quotes.length + concretes.length + asides.length;
  const rawHuman =
    contractions.length * 8 +
    quotes.length * 14 +
    concretes.length * 7 +
    asides.length * 5 +
    shortPunches * 4 +
    dynamicSpanBonus;

  return {
    humanScore: clamp(rawHuman, 0, 100),
    markerHits,
  };
}

/**
 * Clean-room statistical and stylometric analyzer ("ZeroAI").
 * Performs deterministic multi-signal evaluation locally without contacting external AI detectors.
 */
export function analyzeTextZeroAi(rawInput: string): ZeroAiAnalysisResult {
  const normalizedText = sanitizeInputText(rawInput);
  const words = tokenizeWords(normalizedText);
  const lowerWords = words.map((w) => w.toLowerCase());
  const rawSpans = segmentSentences(normalizedText);

  if (words.length === 0 || rawSpans.length === 0) {
    return {
      aiProbability: 0,
      humanProbability: 100,
      verdict: "Likely Human-Written",
      confidence: "Low",
      summary: "Enter at least 35–50 words of English prose for reliable stylometric evaluation.",
      metrics: {
        wordCount: 0,
        characterCount: normalizedText.length,
        sentenceCount: 0,
        avgSentenceLength: 0,
        burstinessStdDev: 0,
        burstinessCV: 0,
        lexicalDiversityMattr: 0,
        wordEntropy: 0,
        bigramRepetitionRate: 0,
        hapaxRatio: 0,
        aiPhraseHits: 0,
        humanMarkerHits: 0,
        readingTimeSeconds: 0,
      },
      signalsBreakdown: [],
      flaggedPatterns: [],
      sentences: [],
      analyzedAt: new Date().toISOString(),
      engineVersion: "ZeroAI-Stylometry-v1.0",
    };
  }

  // Build sentence length stats
  const sentenceDetails = rawSpans.map((span) => {
    const sWords = tokenizeWords(span.text);
    return {
      ...span,
      words: sWords,
      wordCount: sWords.length,
    };
  });

  const lengths = sentenceDetails.map((s) => s.wordCount).filter((len) => len > 0);
  const sentenceCount = sentenceDetails.length;
  const avgLen =
    lengths.length > 0 ? lengths.reduce((sum, l) => sum + l, 0) / lengths.length : words.length;
  const variance =
    lengths.length > 0
      ? lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length
      : 0;
  const stdDev = Math.sqrt(variance);
  const burstinessCV = avgLen > 0 ? stdDev / avgLen : 0;

  // Adjacent cadence similarity
  let adjacentFlatCount = 0;
  for (let i = 1; i < lengths.length; i++) {
    const curr = lengths[i] ?? 0;
    const prev = lengths[i - 1] ?? 0;
    if (Math.abs(curr - prev) <= 4) {
      adjacentFlatCount++;
    }
  }
  const adjacentFlatRatio = lengths.length > 1 ? adjacentFlatCount / (lengths.length - 1) : 0.4;

  // Sentence-starter diversity (first 2 tokens)
  const starters = sentenceDetails.map((s) =>
    s.words
      .slice(0, 2)
      .map((w) => w.toLowerCase())
      .join(" ")
  );
  const starterDiversity = starters.length > 0 ? new Set(starters).size / starters.length : 1;

  // Ideal LLM cadence window (13..24 words)
  const mediumBandRatio =
    lengths.length > 0
      ? lengths.filter((len) => len >= 13 && len <= 24).length / lengths.length
      : 0;

  // Pillar 1: Cadence Uniformity (AI signal)
  const cvComponent = sentenceCount >= 2 ? clamp(((0.56 - burstinessCV) / 0.38) * 100, 0, 100) : 40;
  const starterRepetition = clamp((1 - starterDiversity) * 180, 0, 100);
  const cadenceUniformityScore = clamp(
    0.45 * cvComponent +
      0.25 * (adjacentFlatRatio * 100) +
      0.15 * (mediumBandRatio * 100) +
      0.15 * starterRepetition,
    0,
    100
  );

  // Pillar 2: Lexical Predictability & Entropy
  const mattr = computeMattr(lowerWords, 50);
  const { entropy, normalized: normalizedEntropy } = computeWordEntropy(lowerWords);

  const wordCounts = new Map<string, number>();
  for (const w of lowerWords) {
    wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
  }
  let hapaxCount = 0;
  for (const count of wordCounts.values()) {
    if (count === 1) hapaxCount++;
  }
  const hapaxRatio = wordCounts.size > 0 ? hapaxCount / wordCounts.size : 0;

  const bigrams: string[] = [];
  for (let i = 1; i < lowerWords.length; i++) {
    bigrams.push(`${lowerWords[i - 1]} ${lowerWords[i]}`);
  }
  const uniqueBigrams = new Set(bigrams).size;
  const bigramRepetitionRate =
    bigrams.length > 0 ? Math.max(0, 1 - uniqueBigrams / bigrams.length) : 0;

  const mattrAiSignal = clamp(((0.80 - mattr) / 0.25) * 100, 0, 100);
  const bigramSignal = clamp(bigramRepetitionRate * 320, 0, 100);
  const entropySignal = clamp(((0.94 - normalizedEntropy) / 0.16) * 100, 0, 100);
  const hapaxSignal = clamp(((0.76 - hapaxRatio) / 0.30) * 100, 0, 100);

  const lexicalPredictabilityScore = clamp(
    0.40 * mattrAiSignal + 0.25 * bigramSignal + 0.20 * hapaxSignal + 0.15 * entropySignal,
    0,
    100
  );

  // Pillar 3: Cliché & AI Phrase Taxonomy
  const flaggedPatterns: ZeroAiFlaggedPattern[] = [];
  let weightedClichePoints = 0;
  let totalClicheHits = 0;

  for (const spec of LLM_PATTERN_SPECS) {
    const matches = normalizedText.match(spec.regex);
    if (matches && matches.length > 0) {
      totalClicheHits += matches.length;
      weightedClichePoints += matches.length * spec.weight;
      flaggedPatterns.push({
        phrase: spec.phrase,
        category: spec.category,
        count: matches.length,
        impact: spec.impact,
      });
    }
  }

  flaggedPatterns.sort((a, b) => b.count - a.count || (a.impact === "High" ? -1 : 1));

  // Em-dash structural overuse check
  const emDashes = (normalizedText.match(/—|--/g) || []).length;
  if (sentenceCount >= 3 && emDashes / sentenceCount >= 0.45) {
    weightedClichePoints += 12;
  }

  // Scale points relative to length (150-word normalization floor)
  const normScale = Math.max(1, words.length / 150);
  const clicheDensityScore = clamp((weightedClichePoints / normScale) * 2.1, 0, 100);

  // Pillar 4: Human Authenticity Signals
  const { humanScore: rawHumanMarkers, markerHits: humanMarkerHits } = countHumanMarkers(
    normalizedText,
    sentenceDetails
  );
  const highBurstinessBonus = sentenceCount >= 3 && burstinessCV >= 0.55 ? 20 : 0;
  const highMattrBonus = mattr >= 0.78 && words.length >= 40 ? 15 : 0;
  const humanAuthenticityScore = clamp(
    rawHumanMarkers + highBurstinessBonus + highMattrBonus,
    0,
    100
  );

  // Overall Composite AI Score
  const baseAi =
    0.44 * cadenceUniformityScore +
    0.34 * lexicalPredictabilityScore +
    0.52 * clicheDensityScore -
    0.36 * humanAuthenticityScore;

  // For ultra-short snippets (< 20 words) dampen extreme scores cleanly unless obvious clichés hit
  const lengthDampener = words.length < 20 && totalClicheHits === 0 ? 0.65 : 1;
  const aiProbability = round1(clamp(baseAi * lengthDampener, 2, 99));
  const humanProbability = round1(100 - aiProbability);

  // Per-sentence scoring & classification
  const sentences: ZeroAiSentenceResult[] = sentenceDetails.map((s, idx) => {
    const reasons: string[] = [];
    let sScore = 0.45 * cadenceUniformityScore + 0.35 * lexicalPredictabilityScore;

    // Cliché checks within this sentence
    let localClicheHit = 0;
    for (const spec of LLM_PATTERN_SPECS) {
      const m = s.text.match(spec.regex);
      if (m && m.length > 0) {
        localClicheHit += m.length;
        sScore += m.length * Math.min(28, spec.weight * 1.6);
        reasons.push(`AI marker "${spec.phrase}"`);
      }
    }

    // Length & cadence matching
    if (s.wordCount >= 14 && s.wordCount <= 24) {
      sScore += 10;
      if (sentenceCount >= 2) {
        const prevSent = idx > 0 ? sentenceDetails[idx - 1] : undefined;
        const nextSent = idx < sentenceCount - 1 ? sentenceDetails[idx + 1] : undefined;
        const prevDiff = prevSent ? Math.abs(s.wordCount - prevSent.wordCount) : 99;
        const nextDiff = nextSent ? Math.abs(s.wordCount - nextSent.wordCount) : 99;
        if (prevDiff <= 3 || nextDiff <= 3) {
          sScore += 10;
          reasons.push("Uniform neighbor cadence");
        }
      }
    } else if (s.wordCount >= 2 && s.wordCount <= 6) {
      sScore -= 24;
      reasons.push("Punchy human fragment");
    } else if (s.wordCount >= 28) {
      sScore -= 10;
      reasons.push("Complex multi-clause variation");
    }

    // Human local signals
    if (
      /\b(?:don't|won't|can't|isn't|wasn't|didn't|it's|we're|they're|i'm|you're)\b/i.test(s.text)
    ) {
      sScore -= 16;
      reasons.push("Conversational contraction");
    }
    if (/(?:"[^"\n]{4,180}"|“[^”\n]{4,180}”)/.test(s.text)) {
      sScore -= 22;
      reasons.push("Direct quote / attribution");
    }
    if (/[$₹€£]\s?\d|\b\d+(?:\.\d+)?%|\b\d+(?:ms|gb|tb|ghz)\b/i.test(s.text)) {
      sScore -= 12;
      reasons.push("Concrete empirical metric");
    }

    // Blend toward overall cliché pull if document is heavily synthetic, else keep sentence distinctive
    if (localClicheHit === 0 && reasons.length === 0) {
      reasons.push(
        sScore >= 58 ? "Measured predictable phrasing" : "Standard narrative syntax"
      );
    }

    const bounded = Math.round(clamp(sScore, 4, 98));
    const classification: ZeroAiSentenceClassification =
      bounded >= 62 ? "ai" : bounded >= 36 ? "mixed" : "human";

    return {
      id: idx + 1,
      text: s.text,
      start: s.start,
      end: s.end,
      wordCount: s.wordCount,
      aiScore: bounded,
      classification,
      reasons: reasons.slice(0, 3),
    };
  });

  const verdict: ZeroAiVerdict =
    aiProbability >= 60
      ? "Likely AI-Generated"
      : aiProbability >= 25
      ? "Human with AI Editing / Mixed"
      : "Likely Human-Written";

  const confidence: ZeroAiConfidence =
    words.length >= 120 ? "High" : words.length >= 45 ? "Medium" : "Low";

  const summary =
    verdict === "Likely AI-Generated"
      ? `Detected uniform sentence pacing (CV ${burstinessCV.toFixed(2)}) and ${totalClicheHits} LLM structural/transition pattern(s) with limited idiomatic variation.`
      : verdict === "Human with AI Editing / Mixed"
      ? `Blended stylometric profile: mixes natural human markers (${humanMarkerHits}) with pockets of structured phrasing (${totalClicheHits} transition marker(s)).`
      : `High cadence burstiness (CV ${burstinessCV.toFixed(2)}), rich lexical diversity (MATTR ${(mattr * 100).toFixed(0)}%), and strong authentic human writing cues.`;

  return {
    aiProbability,
    humanProbability,
    verdict,
    confidence,
    summary,
    metrics: {
      wordCount: words.length,
      characterCount: normalizedText.length,
      sentenceCount,
      avgSentenceLength: round1(avgLen),
      burstinessStdDev: round1(stdDev),
      burstinessCV: round1(burstinessCV * 100) / 100,
      lexicalDiversityMattr: round1(mattr * 100),
      wordEntropy: entropy,
      bigramRepetitionRate: round1(bigramRepetitionRate * 100),
      hapaxRatio: round1(hapaxRatio * 100),
      aiPhraseHits: totalClicheHits,
      humanMarkerHits,
      readingTimeSeconds: Math.max(1, Math.round((words.length / 225) * 60)),
    },
    signalsBreakdown: [
      {
        id: "cadence",
        label: "Cadence Uniformity",
        score: Math.round(cadenceUniformityScore),
        description:
          "Measures sentence-length variance (burstiness) and adjacent pacing symmetry.",
        polarity: "ai",
      },
      {
        id: "lexical",
        label: "Lexical Predictability",
        score: Math.round(lexicalPredictabilityScore),
        description:
          "Evaluates Moving-Average Type-Token Ratio, word Shannon entropy, and repeated bigrams.",
        polarity: "ai",
      },
      {
        id: "cliches",
        label: "AI Fingerprint Markers",
        score: Math.round(clicheDensityScore),
        description:
          "Scans for formulaic LLM transitions, symmetric clauses, and rhetorical boilerplate.",
        polarity: "ai",
      },
      {
        id: "human",
        label: "Human Authenticity Signals",
        score: Math.round(humanAuthenticityScore),
        description:
          "Detects contractions, attributed quotes, empirical metrics, asides, and dynamic pacing.",
        polarity: "human",
      },
    ],
    flaggedPatterns,
    sentences,
    analyzedAt: new Date().toISOString(),
    engineVersion: "ZeroAI-Stylometry-v1.0",
  };
}
