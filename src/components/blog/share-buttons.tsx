"use client";

import { useState } from "react";
import { Link as LinkIcon, Check, Share2 } from "lucide-react";
import { TwitterIcon, LinkedinIcon } from "@/components/ui/icons";

export function ShareButtons({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const postUrl = `${siteUrl}/blog/${slug}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    title
  )}&url=${encodeURIComponent(postUrl)}`;

  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    postUrl
  )}`;

  return (
    <div className="flex items-center gap-2">
      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)] mr-2">
        <Share2 className="h-3.5 w-3.5" /> Share
      </span>

      <a
        href={tweetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-sky-500 hover:border-sky-400 transition-all shadow-sm"
        aria-label="Share on X"
      >
        <TwitterIcon className="h-4 w-4" />
      </a>

      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
        aria-label="Share on LinkedIn"
      >
        <LinkedinIcon className="h-4 w-4" />
      </a>

      <button
        onClick={copyToClipboard}
        className="flex h-8 items-center gap-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-white text-xs font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:border-[var(--accent)] transition-all shadow-sm"
        aria-label="Copy article link"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-600" />
            <span className="text-green-600">Copied!</span>
          </>
        ) : (
          <>
            <LinkIcon className="h-3.5 w-3.5" />
            <span>Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
