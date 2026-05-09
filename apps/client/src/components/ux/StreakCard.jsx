/* eslint-disable react/prop-types */
function StreakCard({ days = 7, label = 'Current streak' }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-5 shadow-sm dark:border-orange-900/60 dark:from-orange-950/30 dark:to-slate-900">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-orange-700 dark:text-orange-200">{label}</p>
        <span className="animate-streak-bounce text-3xl" aria-hidden="true">🔥</span>
      </div>
      <p className="mt-3 text-4xl font-black tracking-tight text-slate-950 dark:text-white">{days}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">days of consistent learning</p>
    </article>
  );
}

export default StreakCard;
