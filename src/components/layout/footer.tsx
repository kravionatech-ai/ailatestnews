import Link from "next/link";
import { Rss, Cpu } from "lucide-react";
import { TwitterIcon, GithubIcon, LinkedinIcon } from "@/components/ui/icons";

export interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface FooterProps {
  aboutText?: string;
  copyrightText?: string;
  sections?: FooterSection[];
}

export function Footer({ aboutText, copyrightText, sections }: FooterProps = {}) {
  const defaultAbout =
    "India's authoritative AI publication tracking foundational model releases, LLM benchmarks, Indian AI breakthroughs (Sarvam, Krutrim, BharatGPT), and hands-on tooling comparisons in clear, in-depth English.";

  const defaultSections: FooterSection[] = [
    {
      title: "Categories",
      links: [
        { label: "AI News", href: "/category/ai-news" },
        { label: "Model Launches", href: "/category/model-launches" },
        { label: "AI Tools", href: "/category/ai-tools" },
        { label: "India AI", href: "/category/india-ai" },
        { label: "Guides & Comparisons", href: "/category/guides-and-comparisons" },
        { label: "Enterprise AI", href: "/category/enterprise-ai" },
      ],
    },
    {
      title: "Directories",
      links: [
        { label: "AI Tools Directory", href: "/ai-tools" },
        { label: "Model Launches Timeline", href: "/model-launches" },
        { label: "India AI Hub", href: "/india-ai" },
        { label: "Article Archive", href: "/archive" },
        { label: "Search Portal", href: "/search" },
      ],
    },
    {
      title: "Editorial & Legal",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Editorial Policy", href: "/editorial-policy" },
        { label: "Contact Editorial Desk", href: "/contact" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  const activeSections = sections && sections.length > 0 ? sections : defaultSections;
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--background-secondary)] text-sm text-[var(--foreground-muted)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-lg text-[var(--foreground)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white">
                <Cpu className="h-4 w-4" />
              </div>
              <span>
                AI Latest <span className="text-[var(--accent)]">News</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed max-w-sm text-[var(--foreground-secondary)]">
              {aboutText || defaultAbout}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://twitter.com/ailatestnews_in"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/company/ailatestnews"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <Link
                href="/feed.xml"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-[var(--foreground-muted)] hover:text-amber-600 hover:border-amber-500 transition-all"
                aria-label="RSS Feed"
              >
                <Rss className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Dynamic Link Columns */}
          {activeSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] mb-3">
                {sec.title}
              </h3>
              <ul className="space-y-2 text-xs">
                {sec.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noreferrer" : undefined}
                      className="hover:text-[var(--accent)] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <p>© {new Date().getFullYear()} {copyrightText || "AI Latest News (ainews.kraviona.com). All rights reserved."}</p>
          <p className="text-[var(--foreground-muted)]">
            Covering Artificial Intelligence with speed, rigor &amp; India focus.
          </p>
        </div>
      </div>
    </footer>
  );
}
