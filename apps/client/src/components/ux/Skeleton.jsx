/* eslint-disable react/prop-types */
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800 ${className}`} aria-hidden="true" />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-4 h-8 w-48" />
      <Skeleton className="mt-5 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-2/3" />
    </div>
  );
}

export default Skeleton;
