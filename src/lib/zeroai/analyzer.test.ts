import { describe, it, expect } from "vitest";
import { analyzeTextZeroAi } from "./analyzer";

const TYPICAL_AI_ESSAY = `
In today's digital age, artificial intelligence is poised to reshape the rapidly evolving landscape of enterprise software.
Moreover, organizations across the globe are navigating the complexities of integrating automated workflows into legacy systems.
It is worth noting that large language models serve as a testament to modern engineering achievements, fostering innovation at unprecedented scale.
Furthermore, these multifaceted tools unlock the full potential of data pipelines while not only accelerating deployment cycles but also enhancing operational efficiency.
Consequently, seamless integration highlights the importance of robust governance frameworks across departments.
Additionally, industry analysts emphasize the pivotal role of cloud infrastructure in sustaining transformative impact for stakeholders.
In conclusion, harnessing the power of generative automation underscores the need for strategic adaptation, as only time will tell how deeply these systems reshape everyday productivity.
`.trim();

const HUMAN_EDITORIAL_TEXT = `
We tracked the inference bills. They spiked overnight.
When Bengaluru startup VoltStack migrated 40% of its customer triage workload from proprietary endpoints to quantized open-weights on an 8-GPU node, latency dropped from 410ms to 88ms—and monthly spend plunged from $14,200 to $3,150.
"Nobody believed the caching layer would hold up during Monday traffic," founder Priya Nair told us over coffee in Indiranagar (she'd bet her ops lead dinner on a full rollback before noon).
Wait: isn't raw benchmark throughput misleading? Usually, yes. Dr. R. Krishnan's team at IIT Madras published v2.4 of their Indic telemetry suite last week, and the error bars tell a messier story than the launch deck suggested!
Don't mistake cheap tokens for solved reliability. Real production outages still start with boring schema mismatches, silent timeouts, and stale retry queues.
`.trim();

const MIXED_DRAFT = `
Open-source robotics labs shipped three compact actuator controllers this quarter, slashing prototype costs to $480 per arm.
"Our mechanical tolerances stayed within 0.2mm," said lead engineer Arjun Rao after running 12 hours of stress tests.
Furthermore, it is worth noting that modular firmware architectures serve as a catalyst for rapid hardware iteration in academic laboratories.
We still need better thermal throttling before factory floors adopt these rigs at scale.
`.trim();

describe("ZeroAI Clean-Room Stylometric Analyzer", () => {
  it("handles empty or whitespace-only text cleanly without NaN", () => {
    const empty = analyzeTextZeroAi("   \n\t  ");
    expect(empty.aiProbability).toBe(0);
    expect(empty.humanProbability).toBe(100);
    expect(empty.confidence).toBe("Low");
    expect(empty.metrics.wordCount).toBe(0);
    expect(empty.sentences).toEqual([]);
  });

  it("scores cliché-heavy uniform LLM prose substantially higher AI probability than varied human journalism", () => {
    const aiRes = analyzeTextZeroAi(TYPICAL_AI_ESSAY);
    const humanRes = analyzeTextZeroAi(HUMAN_EDITORIAL_TEXT);

    expect(aiRes.aiProbability).toBeGreaterThanOrEqual(65);
    expect(aiRes.verdict).toBe("Likely AI-Generated");
    expect(aiRes.flaggedPatterns.length).toBeGreaterThanOrEqual(5);

    expect(humanRes.aiProbability).toBeLessThanOrEqual(30);
    expect(humanRes.humanProbability).toBeGreaterThanOrEqual(70);
    expect(humanRes.verdict).toBe("Likely Human-Written");
    expect(humanRes.metrics.humanMarkerHits).toBeGreaterThanOrEqual(4);
  });

  it("classifies blended human-and-AI text in a middle range or above clean human writing", () => {
    const humanRes = analyzeTextZeroAi(HUMAN_EDITORIAL_TEXT);
    const mixedRes = analyzeTextZeroAi(MIXED_DRAFT);

    expect(mixedRes.aiProbability).toBeGreaterThan(humanRes.aiProbability);
    expect(mixedRes.flaggedPatterns.some((p) => p.phrase === "furthermore")).toBe(true);
  });

  it("avoids false sentence splits inside abbreviations, decimals, and versions", () => {
    const sample =
      "Dr. Meera visited the U.S. lab to benchmark v2.4 at $12.50 per million tokens. Latency stayed below 95ms!";
    const res = analyzeTextZeroAi(sample);
    expect(res.sentences.length).toBe(2);
    expect(res.sentences[0]?.text).toContain("Dr. Meera");
    expect(res.sentences[0]?.text).toContain("U.S.");
    expect(res.sentences[0]?.text).toContain("v2.4");
    expect(res.sentences[1]?.text).toContain("95ms!");
  });

  it("keeps all probabilities and breakdown scores strictly bounded between 0 and 100", () => {
    const samples = ["Short line.", TYPICAL_AI_ESSAY, HUMAN_EDITORIAL_TEXT, MIXED_DRAFT];
    for (const s of samples) {
      const r = analyzeTextZeroAi(s);
      expect(r.aiProbability).toBeGreaterThanOrEqual(0);
      expect(r.aiProbability).toBeLessThanOrEqual(100);
      expect(r.humanProbability).toBeGreaterThanOrEqual(0);
      expect(r.humanProbability).toBeLessThanOrEqual(100);
      expect(Math.abs(r.aiProbability + r.humanProbability - 100)).toBeLessThanOrEqual(0.2);

      for (const sig of r.signalsBreakdown) {
        expect(sig.score).toBeGreaterThanOrEqual(0);
        expect(sig.score).toBeLessThanOrEqual(100);
      }
      for (const sent of r.sentences) {
        expect(sent.aiScore).toBeGreaterThanOrEqual(0);
        expect(sent.aiScore).toBeLessThanOrEqual(100);
        expect(["human", "mixed", "ai"]).toContain(sent.classification);
      }
    }
  });
});
