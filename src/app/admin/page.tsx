import Link from "next/link";
import {
  FileText,
  Eye,
  MessageSquare,
  TrendingUp,
  Plus,
  ArrowRight,
  Star,
  Search,
  Mail,
  AlertCircle,
  Users,
  FolderTree,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { getAdminDashboardStats } from "@/lib/db/queries/stats";
import { formatDate } from "@/lib/utils";
import { TrafficAnalytics } from "@/components/admin/traffic-analytics";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { metrics, alerts, recentPosts, topPosts, traffic } =
    await getAdminDashboardStats();

  const primaryCards = [
    {
      label: "Articles & Dispatches",
      value: metrics.totalPosts,
      sub: `${metrics.publishedPosts} pub · ${metrics.draftPosts} draft · ${metrics.scheduledPosts} sched · ${metrics.archivedPosts} arch`,
      icon: FileText,
      accentClass: "text-[var(--accent)] bg-[var(--accent)]/10",
      href: "/admin/posts",
    },
    {
      label: "Featured Stories",
      value: metrics.featuredPosts,
      sub: "Pinned lead & editor spotlight dispatches",
      icon: Star,
      accentClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
      href: "/admin/posts?filter=featured",
    },
    {
      label: "SEO Metadata Health",
      value: metrics.missingSeoPosts,
      sub:
        metrics.missingSeoPosts === 0
          ? "100% meta title & description health"
          : "Posts missing title or description",
      icon: Search,
      accentClass:
        metrics.missingSeoPosts === 0
          ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
          : "text-rose-600 dark:text-rose-400 bg-rose-500/10",
      href: "/admin/seo",
    },
    {
      label: "Platform Traffic",
      value: metrics.totalViews.toLocaleString(),
      sub: "Lifetime article reads tracked",
      icon: Eye,
      accentClass: "text-[#263B50] dark:text-sky-400 bg-[#263B50]/10 dark:bg-sky-500/10",
    },
    {
      label: "Inquiries Desk",
      value: metrics.unreadMessages,
      sub: `${metrics.unreadMessages} unread newsroom inquiries`,
      icon: Mail,
      accentClass: "text-[var(--accent)] bg-[var(--accent)]/10",
      href: "/admin/messages",
    },
    {
      label: "Comments & Discussion",
      value: metrics.totalComments,
      sub: `${metrics.pendingComments} pending moderation`,
      icon: MessageSquare,
      accentClass: "text-[#263B50] dark:text-sky-400 bg-[#263B50]/10 dark:bg-sky-500/10",
      href: "/admin/comments",
    },
  ];

  const quickManageLinks = [
    { label: "Articles", href: "/admin/posts", icon: FileText },
    { label: "Featured", href: "/admin/posts?filter=featured", icon: Star },
    { label: "Categories", href: "/admin/taxonomies", icon: FolderTree },
    { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    { label: "Subscribers", href: "/admin/subscribers", icon: Users },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
            Kraviona AI News · Editorial Intelligence CMS
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[var(--color-heading)] mt-1">
            Newsroom Dashboard
          </h1>
          <p className="text-xs text-[var(--color-muted-text)] mt-1">
            Publication overview, traffic analytics, SEO health, and editorial workflows.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Link
            href="/admin/posts?filter=featured"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:border-[var(--accent)] px-3.5 py-2.5 text-xs font-bold text-[var(--color-heading)] transition-all"
          >
            <Star className="h-3.5 w-3.5 text-[var(--accent)]" /> Manage Featured
          </Link>
          <Link
            href="/admin/posts/new"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all"
          >
            <Plus className="h-4 w-4" /> New Article
          </Link>
        </div>
      </div>

      {/* Quick Workflow Access Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {quickManageLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] hover:border-[var(--accent)] px-3.5 py-2.5 text-xs font-bold text-[var(--color-heading)] transition-all group"
            >
              <Icon className="h-3.5 w-3.5 text-[var(--accent)] shrink-0" />
              <span className="truncate group-hover:text-[var(--accent)] transition-colors">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* System Diagnostic Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-xs font-semibold text-[var(--color-heading)]"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 text-[var(--accent)] shrink-0" />
                <span>{alert.message}</span>
              </div>
              {alert.href && (
                <Link
                  href={alert.href}
                  className="px-3 py-1 rounded-lg bg-[var(--color-card-background)] border border-[var(--border)] hover:border-[var(--accent)] text-[11px] font-bold transition-colors shrink-0"
                >
                  Action →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Primary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {primaryCards.map((card, idx) => {
          const Icon = card.icon;
          const Wrapper = card.href ? Link : "div";
          return (
            <Wrapper
              key={idx}
              href={card.href as any}
              className={`rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-5 shadow-xs space-y-3 block transition-all ${
                card.href ? "hover:border-[var(--accent)] hover:shadow-md cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted-text)]">
                  {card.label}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.accentClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="font-display text-3xl font-black text-[var(--color-heading)] tracking-tight">
                  {card.value}
                </p>
                <p className="text-[11px] text-[var(--color-muted-text)] mt-1">
                  {card.sub}
                </p>
              </div>
            </Wrapper>
          );
        })}
      </div>

      {/* Live Analytics Section */}
      <TrafficAnalytics data={traffic} />

      {/* Split Layout: Recent Posts & Most Read Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Publications */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
            <h2 className="font-display text-base font-bold text-[var(--color-heading)]">
              Recent Publications &amp; Drafts
            </h2>
            <Link
              href="/admin/posts"
              className="font-mono text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
            >
              Manage all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="divide-y divide-[var(--border)]">
            {recentPosts.map((post: any) => (
              <div
                key={post._id}
                className="py-3.5 flex items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/posts/${post._id}/edit`}
                      className="text-xs sm:text-sm font-bold text-[var(--color-heading)] hover:text-[var(--accent)] truncate block"
                    >
                      {post.title}
                    </Link>
                    {post.featured && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-[var(--accent)]/10 text-[var(--accent)] shrink-0">
                        <Star className="h-2.5 w-2.5 fill-current" /> Featured
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] font-mono text-[var(--color-muted-text)]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-bold uppercase ${
                        post.status === "published"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                          : post.status === "scheduled"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                          : "bg-[var(--color-secondary-surface)] text-[var(--color-heading)]"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span>·</span>
                    <span>{post.category?.name || "Uncategorized"}</span>
                    <span>·</span>
                    <span>{formatDate(post.updatedAt || post.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right text-xs shrink-0 font-mono">
                  <span className="font-bold text-[var(--color-heading)]">
                    {post.views || 0}
                  </span>
                  <span className="text-[10px] text-[var(--color-muted-text)] block">
                    reads
                  </span>
                </div>
              </div>
            ))}

            {recentPosts.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--color-muted-text)]">
                No articles created yet. Click New Article to begin.
              </div>
            )}
          </div>
        </div>

        {/* Most Read Stories */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--color-card-background)] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 font-display text-base font-bold text-[var(--color-heading)]">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
            <h3>Top Performing Stories</h3>
          </div>

          <div className="space-y-3">
            {topPosts.map((p: any, idx: number) => (
              <Link
                key={p._id}
                href={`/admin/posts/${p._id}/edit`}
                className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-main-background)] hover:border-[var(--accent)] border border-transparent transition-all group"
              >
                <span className="font-editorial text-lg font-black text-[var(--accent)] leading-none">
                  0{idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-[var(--color-heading)] group-hover:text-[var(--accent)] line-clamp-2">
                    {p.title}
                  </p>
                  <span className="text-[10px] font-mono text-[var(--color-muted-text)] mt-1 block">
                    {(p.views || 0).toLocaleString()} total reads
                  </span>
                </div>
              </Link>
            ))}

            {topPosts.length === 0 && (
              <p className="text-xs text-[var(--color-muted-text)] py-4 text-center">
                Analytics populate as readers engage with published articles.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
