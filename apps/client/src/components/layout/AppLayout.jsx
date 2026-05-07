/* eslint-disable react/prop-types */
import { Link, NavLink } from 'react-router-dom';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../features/auth/AuthContext';

function AppLayout({ children, eyebrow = 'LearnDojoWorld', title }) {
  const { logout, user } = useAuth();

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Link
                to="/"
                className="text-sm font-semibold uppercase tracking-normal text-emerald-700"
              >
                {eyebrow}
              </Link>
              <h1 className="text-2xl font-bold tracking-normal text-slate-950">
                {title}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-600 sm:block">
                {user?.name || user?.email}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-medium">
            {[
              ['/', 'Dashboard'],
              ['/roadmaps', 'Roadmaps'],
              ['/topics', 'Topics'],
              ...(user?.role === ROLES.ADMIN || user?.role === ROLES.CREATOR
                ? [['/creator', 'Creator Studio']]
                : []),
              ...(user?.role === ROLES.ADMIN
                ? [['/admin/review', 'Admin Review']]
                : []),
              ['/my-progress', 'My progress'],
            ].map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 transition ${
                    isActive
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </section>
    </main>
  );
}

export default AppLayout;
