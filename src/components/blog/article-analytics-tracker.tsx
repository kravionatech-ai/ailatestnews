"use client";

import { useEffect, useRef } from "react";

interface ArticleAnalyticsTrackerProps {
  postId: string;
  slug: string;
}

export function ArticleAnalyticsTracker({ postId, slug }: ArticleAnalyticsTrackerProps) {
  const hasTrackedView = useRef(false);
  const trackedDepths = useRef<{
    quarter: boolean;
    half: boolean;
    threeQuarter: boolean;
    full: boolean;
  }>({
    quarter: false,
    half: false,
    threeQuarter: false,
    full: false,
  });

  // 1. Record Page View on Client Load (Bypasses Static Page Caching)
  useEffect(() => {
    if (hasTrackedView.current) return;
    hasTrackedView.current = true;

    const payload = JSON.stringify({
      type: "view",
      postId,
      slug,
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });

    try {
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/track", blob);
      } else {
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      // Graceful failover
    }
  }, [postId, slug]);

  // 2. Track Reading Depth Milestones as Reader Scrolls
  useEffect(() => {
    const sendDepth = (depth: "quarter" | "half" | "threeQuarter" | "full") => {
      if (trackedDepths.current[depth]) return;
      trackedDepths.current[depth] = true;

      const payload = JSON.stringify({
        type: "reading-depth",
        postId,
        slug,
        depth,
      });

      try {
        if (typeof navigator !== "undefined" && navigator.sendBeacon) {
          const blob = new Blob([payload], { type: "application/json" });
          navigator.sendBeacon("/api/analytics/track", blob);
        } else {
          fetch("/api/analytics/track", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {
        // Safe fallback
      }
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const article = document.querySelector("article");
          if (!article) {
            ticking = false;
            return;
          }

          const rect = article.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          const articleHeight = rect.height;

          // How much of the article has scrolled past viewport top
          const scrolledPast = Math.max(0, -rect.top + windowHeight * 0.5);
          const ratio = Math.min(1, Math.max(0, scrolledPast / articleHeight));

          if (ratio >= 0.25) sendDepth("quarter");
          if (ratio >= 0.5) sendDepth("half");
          if (ratio >= 0.75) sendDepth("threeQuarter");
          if (ratio >= 0.95) sendDepth("full");

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [postId, slug]);

  return null;
}
