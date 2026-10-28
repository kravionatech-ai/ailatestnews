import Link from "next/link";
import { Plus, Bell } from "lucide-react";

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-white px-8 flex items-center justify-between sticky top-0 z-30">
      <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h1>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[var(--accent-hover)] transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Article</span>
        </Link>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)]"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
