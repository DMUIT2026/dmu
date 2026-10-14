// Shown instantly while an admin page loads.
export default function Loading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-64 rounded-xl bg-sand-200/70" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-sand-200/50" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-2xl bg-white" />)}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-14 rounded-2xl bg-white" />)}
      </div>
    </div>
  );
}
