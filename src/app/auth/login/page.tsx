"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, AlertCircle, ArrowLeft } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error || "Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-main-background)] px-4 py-12">
      <div className="w-full max-w-md bg-[var(--color-card-background)] rounded-2xl border border-[var(--border)] border-t-4 border-t-[var(--accent)] p-8 shadow-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] hover:text-[var(--accent)] mb-6 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Kraviona
          </Link>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#101820] text-[#F5F4EF] font-editorial font-black text-2xl shadow-xs mb-3">
            K
          </div>
          <h1 className="font-editorial text-2xl font-bold text-[var(--color-heading)]">
            Newsroom Sign In
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1">
            Sign in to access your Kraviona AI News dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-3 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@kraviona.com"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-3.5 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none transition-all focus:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-text)] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--color-main-background)] px-3.5 py-2.5 text-sm text-[var(--color-heading)] placeholder:text-[var(--color-muted-text)] outline-none transition-all focus:border-[var(--accent)]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[var(--accent-hover)] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="h-4 w-4" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[var(--border)] text-center text-xs text-[var(--color-muted-text)]">
          Don&apos;t have an account?{" "}
          <Link href="/auth/register" className="font-semibold text-[var(--accent)] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-main-background)]" />}>
      <LoginForm />
    </Suspense>
  );
}
