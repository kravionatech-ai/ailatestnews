import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { ArticleAuthor } from "../types";
import { cn } from "@/lib/utils";

interface AuthorCardProps {
  author?: ArticleAuthor | null;
  variant?: "default" | "magazine" | "minimal" | "technical";
  className?: string;
}

export function AuthorNewsroomCard({
  author,
  variant = "default",
  className = "",
}: AuthorCardProps) {
  if (!author) return null;

  const authorName = author.name || "Kraviona AI News Editorial Staff";
  const authorRole = author.role || "Technology Journalist & Systems Researcher";
  const authorBio =
    author.bio ||
    "Technical editor and systems researcher covering foundation models, GPU compute economics, and sovereign AI initiatives.";

  if (variant === "minimal") {
    return (
      <div className={cn("flex items-center gap-4 py-6 border-t border-[var(--color-border)]", className)}>
        {author.image ? (
          <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0 border border-[var(--color-border)]">
            <Image src={author.image} alt={authorName} fill sizes="48px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-dark)] text-white font-bold text-sm shrink-0">
            {authorName.charAt(0)}
          </div>
        )}
        <div className="text-xs">
          <p className="font-bold text-[var(--color-heading)]">{authorName}</p>
          <p className="text-[var(--color-muted-text)]">{authorRole}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-secondary-surface)] p-6 flex flex-col sm:flex-row gap-5 items-start shadow-2xs",
        className
      )}
    >
      {author.image ? (
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-[var(--color-border)] shrink-0">
          <Image src={author.image} alt={authorName} fill sizes="64px" className="object-cover" />
        </div>
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-dark)] font-mono font-bold text-white text-xl shrink-0">
          {authorName.charAt(0)}
        </div>
      )}

      <div className="space-y-2 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[var(--color-heading)]">
              About {authorName}
            </h3>
            <span className="font-mono text-[10px] uppercase text-[var(--color-muted-text)]">
              {authorRole}
            </span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--color-primary-accent)] bg-[var(--color-primary-accent)]/10 border border-[var(--color-primary-accent)]/20 px-2 py-0.5 rounded">
            <ShieldCheck className="h-3 w-3 text-[var(--color-primary-accent)]" />
            Verified Byline
          </span>
        </div>

        <p className="text-xs text-[var(--color-body-text)] leading-relaxed">
          {authorBio}
        </p>

        {author.slug && (
          <Link
            href={`/author/${author.slug}`}
            className="inline-flex items-center gap-1 font-mono text-xs font-bold uppercase text-[var(--color-heading)] hover:text-[var(--color-primary-accent)] transition-colors pt-1"
          >
            View all dispatches by {authorName} <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

export { AuthorNewsroomCard as AuthorCard };
export default AuthorNewsroomCard;
