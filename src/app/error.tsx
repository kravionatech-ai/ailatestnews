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
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-[var(--background)]">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--error-light)] text-[var(--error)] mb-6 shadow-sm">
          <AlertCircle className="h-8 w-8" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--error)]">500 Server Error</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
          Something went wrong
        </h1>
        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
          An unexpected error occurred during rendering. If this persists, our engineering team has already logged the incident.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--accent-hover)]"
          >
            <RotateCcw className="h-4 w-4" /> Try Again
          </button>
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--background-secondary)]"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
