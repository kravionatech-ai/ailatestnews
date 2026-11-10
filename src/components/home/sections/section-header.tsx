import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SectionDeskHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

export function SectionDeskHeader({
  kicker,
  title,
  subtitle,
  icon: Icon,
  actionLabel,
  actionHref,
  className,
}: SectionDeskHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4 pb-4 border-b border-[var(--color-heading,#0F172A)]",
        className
      )}
    >
      <div>
        {kicker && (
          <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text,#64748B)] mb-1.5">
            {Icon && <Icon className="h-3.5 w-3.5 text-[var(--color-primary-accent,#10B981)] shrink-0" />}
            <span>{kicker}</span>
          </div>
        )}
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--color-heading,#0F172A)]">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-[var(--color-muted-text,#64748B)] mt-1 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-heading,#0F172A)] hover:text-[var(--color-primary-accent,#10B981)] transition-colors self-start sm:self-end shrink-0"
        >
          <span>{actionLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}
