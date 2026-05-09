/* eslint-disable react/prop-types */
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../features/auth/AuthContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import ExperienceModeSwitch from '../ux/ExperienceModeSwitch';
import ThemeToggle from '../ux/ThemeToggle';
import SessionRecoveryBanner from '../production/SessionRecoveryBanner';

function AppLayout({ children, eyebrow = 'LearnDojoWorld', title }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [pendingPrefix, setPendingPrefix] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => localStorage.getItem('ldw:sidebar') !== 'collapsed');

  const navItems = [
    ['/', 'Dashboard', '🏠'],
    ['/learn', 'Learning Room', '📘'],
    ['/roadmaps', 'Roadmaps', '🧭'],
    ['/topics', 'Topics', '📚'],
    ...(user?.role === ROLES.ADMIN || user?.role === ROLES.CREATOR ? [['/creator', 'Creator Studio', '🎬']] : []),
    ...(user?.role === ROLES.ADMIN ? [['/admin/review', 'Admin Review', '🛡️']] : []),
    ['/my-progress', 'My progress', '📈'],
  ];

  const shortcuts = useMemo(
    () => [
      { keys: 't', handler: () => document.querySelector('[aria-label="Toggle dark and light theme"]')?.click() },
      { keys: 'g', handler: () => setPendingPrefix('g') },
      { keys: 'd', handler: () => { if (pendingPrefix === 'g') { navigate('/'); setPendingPrefix(null); } } },
      { keys: 'r', handler: () => { if (pendingPrefix === 'g') { navigate('/roadmaps'); setPendingPrefix(null); } } },
      { keys: 'p', handler: () => { if (pendingPrefix === 'g') { navigate('/my-progress'); setPendingPrefix(null); } } },
      { keys: 'l', handler: () => { if (pendingPrefix === 'g') { navigate('/learn'); setPendingPrefix(null); } } },
    ],
    [navigate, pendingPrefix]
  );

  useKeyboardShortcuts(shortcuts);

  const toggleSidebar = () => {
    setSidebarOpen((current) => {
      const next = !current;
      localStorage.setItem('ldw:sidebar', next ? 'expanded' : 'collapsed');
      return next;
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-950">
      <SessionRecoveryBanner />
      <aside className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white/95 backdrop-blur transition-all duration-300 dark:border-slate-800 dark:bg-slate-950/95 lg:block ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex h-full flex-col p-4">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3 font-black text-slate-950 dark:text-white">
              <span className="rounded-2xl bg-emerald-600 px-3 py-2 text-white">🥋</span>
              {sidebarOpen ? <span>LearnDojo</span> : null}
            </Link>
            <button type="button" onClick={toggleSidebar} className="rounded-xl border border-slate-200 px-2 py-1 text-sm dark:border-slate-700" aria-label="Toggle sidebar">{sidebarOpen ? '‹' : '›'}</button>
          </div>
          <nav className="mt-8 grid gap-2 text-sm font-semibold">
            {navItems.map(([to, label, icon]) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `flex items-center gap-3 rounded-2xl px-3 py-3 transition ${isActive ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`} title={label}>
                <span>{icon}</span>
                {sidebarOpen ? <span>{label}</span> : null}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {sidebarOpen ? 'Shortcut: G then L opens Learning Room' : '⌨️'}
          </div>
        </div>
      </aside>

      <section className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'}`}>
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur transition-colors dark:border-slate-800 dark:bg-slate-950/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <Link to="/" className="text-sm font-semibold uppercase tracking-normal text-emerald-700 dark:text-emerald-300">{eyebrow}</Link>
              <h1 className="text-2xl font-bold tracking-normal text-slate-950 dark:text-white">{title}</h1>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              <ExperienceModeSwitch />
              <ThemeToggle />
              <span className="hidden text-sm text-slate-600 dark:text-slate-300 sm:block">{user?.name || user?.email}</span>
              <button type="button" onClick={logout} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">Logout</button>
            </div>
          </div>
        </header>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {pendingPrefix ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Shortcut mode: press D Dashboard, L Learning Room, R Roadmaps, P Progress.</div> : null}
          {children}
        </section>
      </section>
    </main>
  );
}

export default AppLayout;
