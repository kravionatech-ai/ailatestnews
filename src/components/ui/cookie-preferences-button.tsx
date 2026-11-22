"use client";

import React from "react";
import { Cookie, Settings2 } from "lucide-react";

export function CookiePreferencesButton() {
  const handleOpenPreferences = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("kraviona-open-cookie-preferences"));
    }
  };

  return (
    <button
      type="button"
      onClick={handleOpenPreferences}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border,#263B50)] bg-[var(--color-secondary-surface,#182430)] hover:border-[var(--accent,#D94F35)] hover:bg-[var(--accent,#D94F35)]/10 text-[var(--color-heading,#ffffff)] text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm active:scale-95"
    >
      <Cookie className="h-4 w-4 text-[var(--accent,#D94F35)]" />
      <span>Customize Cookie Preferences</span>
      <Settings2 className="h-3.5 w-3.5 opacity-60 ml-0.5" />
    </button>
  );
}
