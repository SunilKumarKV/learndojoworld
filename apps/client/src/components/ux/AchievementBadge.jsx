/* eslint-disable react/prop-types */
const variants = {
  bronze: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800',
  silver: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700',
  gold: 'bg-yellow-50 text-yellow-800 ring-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:ring-yellow-800',
  dojo: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:ring-rose-800',
};

function AchievementBadge({ label, icon = '🏅', variant = 'silver' }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ring-1 ${variants[variant]}`}>
      <span aria-hidden="true">{icon}</span>
      {label}
    </span>
  );
}

export default AchievementBadge;
