import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-[var(--color-main-background)]">
      <div className="max-w-md text-center rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-secondary-surface)] text-[var(--accent)] mb-5">
          <Compass className="h-7 w-7 animate-pulse" />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          404 Not Found
        </p>
        <h1 className="font-editorial mt-2 text-4xl font-bold tracking-tight text-[var(--color-heading)]">
          Dispatch Not Found
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted-text)] leading-relaxed">
          The requested article or archive page doesn&apos;t exist or has moved within Kraviona AI News.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)]"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Home
          </Link>
          <Link
            href="/search"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-5 py-2.5 text-sm font-semibold text-[var(--color-heading)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Search Dispatches
          </Link>
        </div>
      </div>
    </main>
  );
}
