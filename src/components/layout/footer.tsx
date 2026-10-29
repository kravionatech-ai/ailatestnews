import Link from "next/link";
import { Rss } from "lucide-react";
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
    <footer className="border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand info */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="group inline-flex flex-col">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  AI LATEST NEWS
                </span>
                <span className="h-2 w-2 rounded-full bg-rose-600 shrink-0" />
              </div>
              <span className="text-[10px] font-mono font-medium uppercase tracking-widest text-slate-500 -mt-0.5">
                The AI Journal for India
              </span>
            </Link>

            <p className="text-xs leading-relaxed max-w-sm text-slate-600">
              {aboutText || defaultAbout}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://twitter.com/kraviona"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all shadow-2xs"
                aria-label="Twitter"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/kravionatech-ai"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all shadow-2xs"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/company/kraviona"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 transition-all shadow-2xs"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <Link
                href="/feed.xml"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-500 transition-all shadow-2xs"
                aria-label="RSS Feed"
              >
                <Rss className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Dynamic Link Columns */}
          {activeSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-slate-900 mb-3">
                {sec.title}
              </h3>
              <ul className="space-y-2 text-xs">
                {sec.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noreferrer" : undefined}
                      className="text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} {copyrightText || "AI Latest News. All rights reserved."}</p>
          <p className="font-mono text-[11px]">
            Independent AI Journalism · Primary Source Grounded · Published for India
          </p>
        </div>
      </div>
    </footer>
  );
}
