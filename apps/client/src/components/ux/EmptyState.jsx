/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';

function EmptyState({ title, description, actionLabel, actionTo, icon = '🌱' }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl dark:bg-emerald-950/50">
        {icon}
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      {actionLabel && actionTo ? (
        <Link
          to={actionTo}
          className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

export default EmptyState;
