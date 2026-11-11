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
    "Kraviona AI News is an independent digital publication covering frontier artificial intelligence, foundation models, research breakthroughs, AI tools, startups, cybersecurity, and global compute infrastructure.";

  const defaultSections: FooterSection[] = [
    {
      title: "Categories",
      links: [
        { label: "AI News", href: "/category/ai-news" },
        { label: "AI Models", href: "/category/model-launches" },
        { label: "AI Research", href: "/category/ai-research" },
        { label: "AI Tools", href: "/category/ai-tools" },
        { label: "Startups & Funding", href: "/category/startups-and-funding" },
        { label: "Cybersecurity", href: "/category/cybersecurity" },
        { label: "Technology", href: "/category/technology" },
      ],
    },
    {
      title: "Intelligence Desks",
      links: [
        { label: "Artificial Intelligence", href: "/category/artificial-intelligence" },
        { label: "AI Agents", href: "/category/ai-agents" },
        { label: "Machine Learning", href: "/category/machine-learning" },
        { label: "Cloud & Computing", href: "/category/cloud-and-computing" },
        { label: "ZeroAI Detector", href: "/zeroai" },
        { label: "Article Archive", href: "/archive" },
        { label: "HTML Sitemap", href: "/sitemap" },
        { label: "Search Portal", href: "/search" },
      ],
    },
    {
      title: "About & Legal",
      links: [
        { label: "About Kraviona", href: "/about" },
        { label: "Editorial Standards", href: "/editorial-policy" },
        { label: "Contact", href: "/contact" },
        { label: "Newsletter", href: "/newsletter" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  const activeSections = sections && sections.length > 0 ? sections : defaultSections;

  return (
    <footer className="border-t border-[#263B50]/60 bg-[#101820] text-[#E4E2DC]">
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-5">
            <Link href="/" className="group inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D94F35] text-white font-display font-black text-lg tracking-tighter">
                K<span className="text-[#101820]">.</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl font-black tracking-tight text-white group-hover:text-[#E05A42] transition-colors">
                  KRAVIONA <span className="text-[#D94F35]">AI NEWS</span>
                </span>
                <span className="text-[10px] font-mono font-medium uppercase tracking-[0.16em] text-[#8B949E]">
                  AI, Technology, Research &amp; Innovation Intelligence
                </span>
              </div>
            </Link>

            <p className="text-xs leading-relaxed max-w-sm text-[#9CA3AF]">
              {aboutText || defaultAbout}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2.5 pt-1">
              <a
                href="https://twitter.com/kraviona"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#182430] text-[#E4E2DC] hover:border-[#D94F35] hover:bg-[#D94F35] hover:text-white transition-all"
                aria-label="Twitter / X"
              >
                <TwitterIcon className="h-4 w-4" />
              </a>
              <a
                href="https://github.com/kravionatech-ai"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#182430] text-[#E4E2DC] hover:border-[#D94F35] hover:bg-[#D94F35] hover:text-white transition-all"
                aria-label="GitHub"
              >
                <GithubIcon className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com/company/kraviona"
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#182430] text-[#E4E2DC] hover:border-[#D94F35] hover:bg-[#D94F35] hover:text-white transition-all"
                aria-label="LinkedIn"
              >
                <LinkedinIcon className="h-4 w-4" />
              </a>
              <Link
                href="/feed.xml"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-[#182430] text-[#E4E2DC] hover:border-[#D94F35] hover:bg-[#D94F35] hover:text-white transition-all"
                aria-label="RSS Feed"
              >
                <Rss className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Link Columns */}
          {activeSections.map((sec, sIdx) => (
            <div key={sIdx}>
              <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white mb-4 pb-2 border-b border-white/10">
                {sec.title}
              </h3>
              <ul className="space-y-2.5 text-xs">
                {sec.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link
                      href={link.href}
                      target={link.isExternal ? "_blank" : undefined}
                      rel={link.isExternal ? "noreferrer" : undefined}
                      className="text-[#9CA3AF] hover:text-[#E05A42] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Colophon */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs gap-4 text-[#8B949E]">
          <p>
            © <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
            {copyrightText || "Kraviona AI News (ainews.kraviona.com). All rights reserved."}
          </p>
          <p className="font-mono text-[11px] text-[#8B949E]">
            AI, Technology, Research &amp; Innovation Intelligence · Verified Sources
          </p>
        </div>
      </div>
    </footer>
  );
}
