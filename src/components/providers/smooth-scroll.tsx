"use client";

import React from "react";

/**
 * Zero-overhead native scroll provider.
 * Uses native browser compositor smooth scrolling (configured via CSS scroll-behavior: smooth)
 * avoiding main-thread JS animation loops, input lag, and scroll jank.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
