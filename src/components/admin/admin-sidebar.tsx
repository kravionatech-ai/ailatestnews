"use client";

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
  Cpu,
  Search,
  Layers,
  ArrowRightLeft,
  FileCode,
  Mail,
  UserCheck,
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const groups = [
    {
      title: "Overview",
      links: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
    },
    {
      title: "Content & Publishing",
      links: [
        { label: "Articles & Posts", href: "/admin/posts", icon: FileText },
        { label: "Taxonomies", href: "/admin/taxonomies", icon: FolderTree },
        { label: "Authors & Team", href: "/admin/authors", icon: UserCheck },
        { label: "Pages Hub", href: "/admin/pages", icon: Layers },
        { label: "Media Library", href: "/admin/media", icon: ImageIcon },
      ],
    },
    {
      title: "SEO Engine & Tools",
      links: [
        { label: "Bulk SEO Editor", href: "/admin/seo", icon: Search },
        { label: "Redirects & 404s", href: "/admin/seo/redirects", icon: ArrowRightLeft },
      ],
    },
    {
      title: "Audience & Community",
      links: [
        { label: "Comments", href: "/admin/comments", icon: MessageSquare },
        { label: "Inquiries Desk", href: "/admin/messages", icon: Mail },
        { label: "Subscribers", href: "/admin/subscribers", icon: Users },
      ],
    },
    {
      title: "System & Governance",
      links: [{ label: "Global Settings", href: "/admin/settings", icon: Settings }],
    },
  ];

  return (
    <aside className="w-64 border-r border-[var(--border)] bg-white flex flex-col justify-between h-screen sticky top-0 overflow-y-auto">
      <div>
        {/* Brand Header */}
        <div className="p-5 border-b border-[var(--border)]">
          <Link href="/admin" className="flex items-center gap-2.5 font-bold text-base text-[var(--foreground)] group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 text-white shadow-xs">
              <Cpu className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight text-sm font-extrabold">
                AI Latest <span className="text-[var(--accent)]">News</span>
              </span>
              <span className="text-[9px] uppercase tracking-wider font-semibold text-[var(--foreground-muted)]">
                Admin CMS
              </span>
            </div>
          </Link>
        </div>

        {/* Grouped Navigation */}
        <nav className="p-4 space-y-5">
          {groups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <h4 className="px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                {group.title}
              </h4>
              {group.links.map((link) => {
                const Icon = link.icon;
                const isActive =
                  pathname === link.href ||
                  (link.href !== "/admin" && Boolean(pathname?.startsWith(link.href)));

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-bold shadow-3xs"
                        : "text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer / User actions */}
      <div className="p-4 border-t border-[var(--border)] space-y-1.5 bg-slate-50/50">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-[var(--foreground-muted)] hover:bg-white hover:text-[var(--foreground)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="h-3.5 w-3.5" /> View Live Site
          </span>
          <span className="text-[9px] font-mono text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
            Live
          </span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
