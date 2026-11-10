"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  Image as ImageIcon,
  MessageSquare,
  Users,
  Settings,
  ExternalLink,
  LogOut,
  Search,
  Globe,
  Layers,
  ArrowRightLeft,
  Mail,
  UserCheck,
  Star,
  Sun,
  Moon,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";

const SIDEBAR_GROUPS = [
  {
    title: "Overview",
    links: [{ label: "Dashboard & Analytics", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Editorial & Publishing",
    links: [
      { label: "Articles & Posts", href: "/admin/posts", icon: FileText },
      { label: "Featured Stories", href: "/admin/posts?filter=featured", icon: Star },
      { label: "Categories & Tags", href: "/admin/taxonomies", icon: FolderTree },
      { label: "Authors & Team", href: "/admin/authors", icon: UserCheck },
      { label: "Pages Hub", href: "/admin/pages", icon: Layers },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    title: "SEO & Growth",
    links: [
      { label: "SEO Control Center", href: "/admin/seo", icon: Globe },
      { label: "Bulk Meta Editor", href: "/admin/seo?tab=bulk", icon: Search },
      { label: "Redirects & 404s", href: "/admin/seo/redirects", icon: ArrowRightLeft },
    ],
  },
  {
    title: "Audience & Newsletter",
    links: [
      { label: "Newsletter Subscribers", href: "/admin/subscribers", icon: Users },
      { label: "Comments", href: "/admin/comments", icon: MessageSquare },
      { label: "Inquiries Desk", href: "/admin/messages", icon: Mail },
    ],
  },
  {
    title: "System & Governance",
    links: [{ label: "Site Settings", href: "/admin/settings", icon: Settings }],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const renderSidebarContent = (onNavigate?: () => void) => (
    <div className="flex flex-col justify-between h-full">
      <div>
        {/* Kraviona Editorial Brand Header */}
        <div className="p-5 border-b border-white/10">
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D94F35] text-white font-display font-black text-base tracking-tighter shadow-xs">
              K<span className="text-[#101820]">.</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display leading-tight text-sm font-black tracking-tight text-white">
                KRAVIONA <span className="text-[#E05A42]">CMS</span>
              </span>
              <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-[#8B949E]">
                Editorial Command
              </span>
            </div>
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav className="p-3.5 space-y-5" aria-label="Admin navigation">
          {SIDEBAR_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h4 className="px-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B949E]">
                {group.title}
              </h4>
              {group.links.map((link) => {
                const Icon = link.icon;
                const cleanHref = link.href.split("?")[0] ?? link.href;
                const isActive =
                  link.href.includes("?")
                    ? false
                    : pathname === cleanHref ||
                      (cleanHref !== "/admin" && Boolean(pathname?.startsWith(cleanHref)));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#D94F35] text-white font-bold shadow-xs"
                        : "text-[#D0D7DE]/85 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer Utility Actions */}
      <div className="p-3.5 border-t border-white/10 space-y-1.5 bg-[#0A0E14]/50">
        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#D0D7DE] hover:bg-white/8 hover:text-white transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2">
            {mounted && theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-[#E05A42]" />
            )}
            <span>{mounted && theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
          </span>
          <span className="font-mono text-[10px] uppercase text-[#8B949E]">
            {mounted ? theme : "light"}
          </span>
        </button>

        {/* Live Publication Link */}
        <Link
          href="/"
          target="_blank"
          onClick={onNavigate}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-semibold text-[#D0D7DE] hover:bg-white/8 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" /> View Live Site
          </span>
          <span className="text-[9px] font-mono text-emerald-400 font-bold bg-emerald-500/15 px-1.5 py-0.5 rounded">
            Live
          </span>
        </Link>

        {/* Sign Out */}
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile / Tablet Admin Top Bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-[#101820] px-4 py-3 text-white">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#D94F35] text-white font-display font-black text-sm">
            K.
          </div>
          <span className="font-display text-sm font-black tracking-tight">
            KRAVIONA <span className="text-[#E05A42]">CMS</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white cursor-pointer"
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white cursor-pointer"
            aria-label="Toggle admin menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] bg-[#101820] text-white h-full overflow-y-auto shadow-2xl">
            {renderSidebarContent(() => setMobileOpen(false))}
          </aside>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-white/10 bg-[#101820] text-white flex-col justify-between h-screen sticky top-0 overflow-y-auto">
        {renderSidebarContent()}
      </aside>
    </>
  );
}
