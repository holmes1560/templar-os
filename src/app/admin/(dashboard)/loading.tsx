export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-6 w-48 rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)]" />
        <div className="h-4 w-96 max-w-full rounded-[var(--os-r-chip)] bg-[var(--os-surface-1)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="h-28 rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4" />
        <div className="h-28 rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4" />
        <div className="h-28 rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-4" />
      </div>

      <div className="rounded-[var(--os-r-panel)] border border-[var(--os-line)] bg-[var(--os-surface-1)] p-6 space-y-4">
        <div className="h-5 w-32 rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)]" />
        <div className="h-10 w-full rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)]/60" />
        <div className="h-10 w-full rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)]/60" />
        <div className="h-24 w-full rounded-[var(--os-r-chip)] bg-[var(--os-surface-2)]/60" />
      </div>
    </div>
  );
}
