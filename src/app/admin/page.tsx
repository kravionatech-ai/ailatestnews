import Link from "next/link";
import {
  FileText,
  Eye,
  MessageSquare,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Star,
  Search,
  Mail,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getAdminDashboardStats } from "@/lib/db/queries/stats";
import { formatDate } from "@/lib/utils";
import { TrafficAnalytics } from "@/components/admin/traffic-analytics";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { metrics, alerts, recentPosts, topPosts, traffic } = await getAdminDashboardStats();

  const primaryCards = [
    {
      label: "Articles & Dispatches",
      value: metrics.totalPosts,
      sub: `${metrics.publishedPosts} pub • ${metrics.draftPosts} draft • ${metrics.scheduledPosts} sched • ${metrics.archivedPosts} arch`,
      icon: FileText,
      color: "text-indigo-600 bg-indigo-50",
      href: "/admin/posts",
    },
    {
      label: "Featured Homepage",
      value: metrics.featuredPosts,
      sub: "Pinned top editorial dispatches",
      icon: Star,
      color: "text-amber-600 bg-amber-50",
      href: "/admin/posts",
    },
    {
      label: "Missing SEO Metadata",
      value: metrics.missingSeoPosts,
      sub: metrics.missingSeoPosts === 0 ? "100% full meta health" : "Requires title or description",
      icon: Search,
      color:
        metrics.missingSeoPosts === 0
          ? "text-emerald-600 bg-emerald-50"
          : "text-rose-600 bg-rose-50",
      href: "/admin/seo",
    },
    {
      label: "Platform Traffic",
      value: metrics.totalViews,
      sub: "Lifetime article page views",
      icon: Eye,
      color: "text-sky-600 bg-sky-50",
    },
    {
      label: "Inquiries Desk",
      value: metrics.unreadMessages,
      sub: `${metrics.unreadMessages} unread tip-offs & messages`,
      icon: Mail,
      color:
        metrics.unreadMessages === 0
          ? "text-slate-600 bg-slate-50"
          : "text-amber-600 bg-amber-50",
      href: "/admin/messages",
    },
    {
      label: "Community & Comments",
      value: metrics.totalComments,
      sub: `${metrics.pendingComments} pending moderation`,
      icon: MessageSquare,
      color: "text-purple-600 bg-purple-50",
      href: "/admin/comments",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)]">
            Editorial Overview
          </h1>
          <p className="text-xs text-[var(--foreground-muted)] mt-1">
            System health, active readers, and publication telemetry.
          </p>
        </div>

        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> Draft New Article
        </Link>
      </div>

      {/* System Diagnostic Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert: any, idx: number) => (
            <div
              key={idx}
              className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border text-xs font-semibold ${
                alert.type === "urgent"
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : alert.type === "warning"
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-blue-50 text-blue-800 border-blue-200"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{alert.message}</span>
              </div>
              {alert.href && (
                <Link
                  href={alert.href}
                  className="px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white text-[11px] font-bold shadow-3xs transition-colors shrink-0"
                >
                  Action →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metric Cards Grid (6 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {primaryCards.map((card, idx) => {
          const Icon = card.icon;
          const Wrapper = card.href ? Link : "div";
          return (
            <Wrapper
              key={idx}
              href={card.href as any}
              className={`rounded-2xl border border-[var(--border)] bg-white p-5 shadow-2xs space-y-3 block transition-all ${
                card.href ? "hover:border-[var(--accent)] hover:shadow-xs cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground-muted)]">
                  {card.label}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-3xl font-black text-[var(--foreground)] tracking-tight">
                  {card.value}
                </p>
                <p className="text-[11px] text-[var(--foreground-muted)] mt-1">
                  {card.sub}
                </p>
              </div>
            </Wrapper>
          );
        })}
      </div>

      <TrafficAnalytics data={traffic} />

      {/* Split layout: Recent Activity & Top Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Posts Table */}
        <div className="lg:col-span-2 rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--foreground)]">
              Recent Publications &amp; Edits
            </h2>
            <Link
              href="/admin/posts"
              className="text-xs font-semibold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
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
                      className="text-xs font-bold text-[var(--foreground)] hover:text-[var(--accent)] truncate block"
                    >
                      {post.title}
                    </Link>
                    {post.featured && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 shrink-0">
                        <Star className="h-2.5 w-2.5 fill-amber-500" /> Featured
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--foreground-muted)]">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full font-semibold ${
                        post.status === "published"
                          ? "bg-green-50 text-green-700"
                          : post.status === "scheduled"
                          ? "bg-amber-50 text-amber-700"
                          : post.status === "archived"
                          ? "bg-slate-200 text-slate-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {post.status}
                    </span>
                    <span>•</span>
                    <span>{post.category?.name || "Uncategorized"}</span>
                    <span>•</span>
                    <span>{formatDate(post.updatedAt || post.createdAt)}</span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-semibold text-[var(--foreground)]">
                    {post.views || 0}
                  </span>
                  <span className="text-[10px] text-[var(--foreground-muted)] block">
                    views
                  </span>
                </div>
              </div>
            ))}

            {recentPosts.length === 0 && (
              <div className="py-8 text-center text-xs text-[var(--foreground-muted)]">
                No articles created yet. Click Draft New Article to begin.
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Articles */}
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[var(--foreground)]">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
            <h3>Most Read Content</h3>
          </div>

          <div className="space-y-3">
            {topPosts.map((p: any, idx: number) => (
              <div
                key={p._id}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--background-secondary)]"
              >
                <span className="text-xs font-black text-slate-400">
                  #{idx + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-[var(--foreground)] truncate">
                    {p.title}
                  </p>
                  <span className="text-[10px] text-[var(--foreground-muted)] mt-0.5 block">
                    {p.views || 0} total reads
                  </span>
                </div>
              </div>
            ))}

            {topPosts.length === 0 && (
              <p className="text-xs text-[var(--foreground-muted)] py-4 text-center">
                Telemetry will populate once articles receive traffic.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
