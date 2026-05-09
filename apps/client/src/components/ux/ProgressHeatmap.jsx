/* eslint-disable react/prop-types */
const levels = [
  'bg-slate-100 dark:bg-slate-800',
  'bg-emerald-100 dark:bg-emerald-950',
  'bg-emerald-300 dark:bg-emerald-800',
  'bg-emerald-500 dark:bg-emerald-600',
  'bg-emerald-700 dark:bg-emerald-400',
];

function createDemoDays(total = 70) {
  return Array.from({ length: total }, (_, index) => ({
    id: index,
    level: index % 9 === 0 ? 0 : Math.min(4, (index * 7) % 5),
  }));
}

function ProgressHeatmap({ days = createDemoDays() }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-950 dark:text-white">Learning heatmap</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">Your daily learning activity.</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">70 days</span>
      </div>
      <div className="mt-5 grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2" aria-label="Progress heatmap">
        {days.map((day) => (
          <span
            key={day.id}
            title={`Activity level ${day.level}`}
            className={`h-4 w-4 rounded ${levels[day.level] || levels[0]}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Less</span>
        {levels.map((level) => <span key={level} className={`h-3 w-3 rounded ${level}`} />)}
        <span>More</span>
      </div>
    </section>
  );
}

export default ProgressHeatmap;
