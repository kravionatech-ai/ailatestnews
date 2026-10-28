export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <div className="h-9 w-9 animate-spin rounded-full border-3 border-[var(--border)] border-t-[var(--accent)]" />
      <span className="text-xs font-medium text-[var(--foreground-muted)] tracking-wide uppercase">
        Loading insights...
      </span>
    </div>
  );
}
