"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Application Error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-[var(--color-main-background)]">
      <div className="max-w-md text-center rounded-2xl border border-[var(--border)] bg-[var(--color-card-background)] p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-[var(--accent)] mb-5">
          <AlertCircle className="h-7 w-7" />
        </div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent)]">
          500 Server Error
        </p>
        <h1 className="font-editorial mt-2 text-3xl font-bold tracking-tight text-[var(--color-heading)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--color-muted-text)] leading-relaxed">
          An unexpected error occurred during rendering. Our engineering desk has logged the incident.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-5 py-2.5 text-sm font-semibold text-[var(--color-heading)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
