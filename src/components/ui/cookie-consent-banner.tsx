"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, ShieldCheck, X } from "lucide-react";

export function CookieConsentBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const consent = localStorage.getItem("kraviona-cookie-consent");
      if (!consent) {
        // Small delay to prevent initial render layout jump
        const timer = setTimeout(() => setIsOpen(true), 800);
        return () => clearTimeout(timer);
      }
    } catch {
      // Graceful fallback for privacy mode / restricted storage
    }
  }, []);

  useEffect(() => {
    // Listen for custom event to re-open banner from footer or privacy policy
    const handleReopen = () => setIsOpen(true);
    window.addEventListener("kraviona-open-cookie-preferences", handleReopen);
    return () => {
      window.removeEventListener("kraviona-open-cookie-preferences", handleReopen);
    };
  }, []);

  const saveConsent = (choice: "all" | "essential") => {
    try {
      localStorage.setItem("kraviona-cookie-consent", choice);
      document.cookie = `kraviona_cookie_consent=${choice}; path=/; max-age=31536000; SameSite=Lax; Secure`;

      // Update Google Tag Manager / Analytics consent if present
      if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
        (window as any).gtag("consent", "update", {
          analytics_storage: choice === "all" ? "granted" : "denied",
          ad_storage: choice === "all" ? "granted" : "denied",
          functionality_storage: "granted",
          security_storage: "granted",
        });
      }
    } catch {
      // Ignored
    }
    setIsOpen(false);
  };

  if (!mounted || !isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border,#263B50)] bg-[#101820]/95 backdrop-blur-md p-5 shadow-2xl text-[#E4E2DC]">
        {/* Accent top border highlight */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--accent,#D94F35)] to-amber-500" />

        <div className="flex items-start gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent,#D94F35)]/15 text-[var(--accent,#D94F35)] border border-[var(--accent,#D94F35)]/30">
            <Cookie className="h-5 w-5" />
          </div>

          <div className="flex-1 pr-6">
            <h3 className="font-display text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Privacy &amp; Cookie Preferences</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400 inline" />
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-[#9CA3AF]">
              We use essential cookies for secure authentication and theme preferences, along with privacy-first analytics to understand macro readership trends. No third-party ad profiling.
            </p>
          </div>

          <button
            type="button"
            onClick={() => saveConsent("essential")}
            className="absolute top-4 right-4 p-1 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close and accept essential cookies only"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={() => saveConsent("all")}
            className="w-full sm:w-auto flex-1 px-4 py-2 rounded-xl bg-[var(--accent,#D94F35)] hover:bg-[#E05A42] text-white text-xs font-semibold tracking-wide transition-all shadow-sm active:scale-95 text-center cursor-pointer"
          >
            Accept All
          </button>

          <button
            type="button"
            onClick={() => saveConsent("essential")}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-[#E4E2DC] text-xs font-medium transition-all active:scale-95 text-center cursor-pointer"
          >
            Essential Only
          </button>

          <Link
            href="/privacy#cookies"
            onClick={() => setIsOpen(false)}
            className="text-[11px] text-[#9CA3AF] hover:text-[var(--accent,#D94F35)] underline underline-offset-2 transition-colors sm:ml-1"
          >
            Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
