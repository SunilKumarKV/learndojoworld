export function RouteLoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div
        role="status"
        aria-label="Loading session"
        className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"
      />
    </div>
  );
}
