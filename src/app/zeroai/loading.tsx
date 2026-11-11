import { Skeleton } from "@/components/ui/skeleton";

export default function ZeroAiLoading() {
  return (
    <div
      className="min-h-screen bg-[var(--color-main-background)]"
      aria-busy="true"
      aria-label="Loading ZeroAI detector"
    >
      <div className="mx-auto max-w-[var(--max-content-width,1320px)] px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="space-y-3 max-w-3xl border-b border-[var(--border)] pb-6">
          <Skeleton className="h-4 w-56 rounded" />
          <Skeleton className="h-10 sm:h-12 w-full max-w-xl rounded" />
          <Skeleton className="h-4 w-full max-w-2xl rounded" />
        </div>

        <Skeleton className="h-12 w-full rounded-xl" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-7 h-[460px] rounded-2xl" />
          <Skeleton className="lg:col-span-5 h-[460px] rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
