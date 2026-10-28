import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 bg-[var(--background)]">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-light)] text-[var(--accent)] mb-6 shadow-sm">
          <Compass className="h-8 w-8 animate-pulse" />
        </div>
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--accent)]">404 Error</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[var(--foreground)]">
          Page Not Found
        </h1>
        <p className="mt-3 text-base text-[var(--foreground-muted)]">
          The requested article or page doesn’t exist or has been relocated to another URL.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" /> Return to Home
          </Link>
          <Link
            href="/search"
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--background-secondary)]"
          >
            Search Articles
          </Link>
        </div>
      </div>
    </main>
  );
}
