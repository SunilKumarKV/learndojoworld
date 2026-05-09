import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import StudyTrackerDashboard from '../components/studyTracker/StudyTrackerDashboard';
import AchievementBadge from '../components/ux/AchievementBadge';
import EmptyState from '../components/ux/EmptyState';
import ProgressHeatmap from '../components/ux/ProgressHeatmap';
import StreakCard from '../components/ux/StreakCard';
import { ROLES } from '../constants/roles';
import { useAuth } from '../features/auth/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  if (user.role === ROLES.LEARNER) {
    return <StudyTrackerDashboard />;
  }

  return (
    <AppLayout title="Dashboard">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="ldw-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Signed in as</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
                {user.name || user.email}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <AchievementBadge label="Verified" icon="✅" variant="silver" />
              <AchievementBadge label={`${user.role} access`} icon="🥋" variant="dojo" />
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="mt-1 text-sm text-slate-950 dark:text-white">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Role</dt>
              <dd className="mt-1 text-sm text-slate-950 dark:text-white">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">Status</dt>
              <dd className="mt-1 text-sm text-slate-950 dark:text-white">Authenticated</dd>
            </div>
          </dl>
        </section>

        <StreakCard days={7} />

        <section className="ldw-card p-6">
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Learning</h2>
          <div className="mt-4 grid gap-3">
            <Link
              to="/roadmaps"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Browse roadmaps
            </Link>
            <Link
              to="/my-progress"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              View my progress
            </Link>
            <Link
              to="/topics"
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Read topic pages
            </Link>
            {user.role === ROLES.ADMIN || user.role === ROLES.CREATOR ? (
              <Link
                to="/creator"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Open Creator Studio
              </Link>
            ) : null}
            {user.role === ROLES.ADMIN ? (
              <Link
                to="/admin/review"
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Review submitted content
              </Link>
            ) : null}
          </div>
        </section>

        <ProgressHeatmap />
      </div>

      <div className="mt-5">
        <EmptyState
          icon="🎯"
          title="No personal mission selected yet"
          description="Create or assign a roadmap mission so learners see a smart empty state instead of a blank page. This keeps the product feeling complete even before data exists."
          actionLabel="Browse roadmaps"
          actionTo="/roadmaps"
        />
      </div>
    </AppLayout>
  );
}

export default Dashboard;
