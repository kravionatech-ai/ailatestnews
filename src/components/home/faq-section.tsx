"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSectionProps {
  items?: FaqItem[];
  title?: string;
  subtitle?: string;
}

const defaultFaqs: FaqItem[] = [
  {
    question: "What is AI Latest News and what does it cover?",
    answer:
      "AI Latest News is an independent technology publication focusing on artificial intelligence, frontier foundation models, sovereign compute policies, and developer tooling with a specialized India lens. We cover model launches, GPU subsidies, local LLM deployment, and Indic language NLP for engineers and technology leaders.",
  },
  {
    question: "How do you evaluate and benchmark AI models for India?",
    answer:
      "We benchmark models across four core criteria: Indic language comprehension (Hindi, Tamil, Telugu, Bengali), inference latency on Indian cloud datacenters, tokenization efficiency (tokens per Indic word), and rupee pricing feasibility for domestic startups and developers.",
  },
  {
    question: "Are open-weight models like DeepSeek-R1 and Sarvam-1 completely free to use?",
    answer:
      "Yes. Open-weight models like DeepSeek-R1 and Sarvam-1 can be downloaded freely from Hugging Face and self-hosted locally on your own hardware or Indian cloud instances without paying recurring per-token SaaS subscriptions.",
  },
  {
    question: "How can Indian startups access subsidized GPUs under the IndiaAI Mission?",
    answer:
      "The ₹10,372 crore IndiaAI Mission provides compute vouchers and subsidies for Indian AI startups, researchers, and academic institutions. Eligible teams can apply via the official IndiaAI portal to access subsidized clusters hosted at partner datacenters including CtrlS, Yotta, and Tata Communications.",
  },
  {
    question: "What is the difference between ChatGPT, Claude, and Gemini for Indian developers?",
    answer:
      "Claude 3.5 Sonnet excels at multi-file code refactoring and technical reasoning; Google Gemini 1.5 Pro offers massive 2M token context and native Hindi/Indic corpus grounding; ChatGPT (GPT-4o) provides strong general versatility, voice mode, and multimodal web tools.",
  },
];

export function FaqSection({
  items,
  title = "Everything You Need to Know",
  subtitle = "Common questions about AI Latest News, Indic models, and sovereign compute in India",
}: FaqSectionProps = {}) {
  const faqs = items && items.length > 0 ? items : defaultFaqs;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <section className="py-10 sm:py-14" aria-label="Frequently Asked Questions">
      {/* FAQPage JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl">
        <div className="mb-8 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-slate-900" />
            <span>Knowledge Desk // Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {subtitle}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-2xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-slate-900" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
