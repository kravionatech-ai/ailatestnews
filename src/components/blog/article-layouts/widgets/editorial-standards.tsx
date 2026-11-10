import Link from "next/link";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export function EditorialStandardsBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-card-background)] p-5 shadow-2xs",
        className
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-heading)] mb-2 pb-2 border-b border-[var(--color-border)]">
        <BookOpen className="h-3.5 w-3.5 text-[var(--color-primary-accent)]" />
        <span>Editorial Standards</span>
      </div>
      <p className="text-xs text-[var(--color-body-text)] leading-relaxed">
        Kraviona AI News enforces strict technical verification protocols. We never accept sponsored benchmark modifications, undisclosed commercial partnerships, or unverified claims.
      </p>
      <Link
        href="/editorial-policy"
        className="mt-3 inline-block font-mono text-[11px] font-bold uppercase text-[var(--color-heading)] hover:text-[var(--color-primary-accent)] underline transition-colors"
      >
        Read Editorial Policy →
      </Link>
    </div>
  );
}

export default EditorialStandardsBox;
