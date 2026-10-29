import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex" aria-busy="true" aria-label="Loading admin dashboard">
      {/* ── Admin Sidebar Skeleton (Desktop) ── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white p-5 space-y-6 shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg bg-indigo-100" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-100">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-3.5 w-32" />
            </div>
          ))}
        </div>
      </aside>

      {/* ── Admin Main Content Skeleton ── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </header>

        {/* Dashboard Body */}
        <main className="p-6 md:p-8 space-y-8 flex-1">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-3.5 w-64" />
            </div>
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>

          {/* 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-7 rounded-lg" />
                </div>
                <Skeleton className="h-7 w-28" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>

          {/* Analytics Chart Placeholder */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-8 w-44 rounded-lg" />
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>

          {/* Recent Posts Table Placeholder */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Skeleton className="h-10 w-14 rounded shrink-0" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full shrink-0" />
                  <Skeleton className="h-4 w-20 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
