"use client";

import Link from "next/link";
import {
  BrainCircuit,
  Cpu,
  Bot,
  Network,
  BookOpen,
  Wrench,
  Rocket,
  ShieldAlert,
  Server,
  Zap,
  ArrowUpRight,
  Compass,
} from "lucide-react";
import { EXPLORE_CATEGORIES_LIST } from "@/lib/categories/topics";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BrainCircuit,
  Cpu,
  Bot,
  Network,
  BookOpen,
  Wrench,
  Rocket,
  ShieldAlert,
  Server,
  Zap,
};

export function ExploreCategoriesSection() {
  return (
    <section
      aria-label="Explore Categories"
      className="border-b border-[var(--border)] bg-[var(--color-main-background)] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--accent)] mb-1.5">
              <Compass className="h-3.5 w-3.5" />
              <span>Intelligence Desks</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading)]">
              Explore Categories
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-[var(--color-muted-text)] max-w-md">
            Structured beat reporting spanning foundational models, applied systems research, cybersecurity, startups, and compute infrastructure.
          </p>
        </div>

        {/* 10-Category Responsive Editorial Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {EXPLORE_CATEGORIES_LIST.map((cat) => {
            const Icon = ICON_MAP[cat.iconName] || Cpu;
            return (
              <Link
                key={cat.slug}
                href={cat.href}
                className="group flex flex-col justify-between rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-4 sm:p-5 hover:border-[var(--accent)] hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-secondary-surface)] text-[var(--color-heading)] group-hover:bg-[var(--accent)] group-hover:text-white transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[var(--color-muted-text)] group-hover:text-[var(--accent)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>

                  <h3 className="font-display text-sm font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                    {cat.name}
                  </h3>
                  <p className="mt-1.5 text-xs text-[var(--color-muted-text)] leading-relaxed line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[var(--border)]/70 flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted-text)] group-hover:text-[var(--accent)] transition-colors">
                  <span>View Desk</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
