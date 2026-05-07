import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { ROLES } from '../constants/roles';
import { useAuth } from '../features/auth/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <AppLayout title="Dashboard">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Signed in as</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            {user.name || user.email}
          </h2>
          <dl className="mt-6 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="mt-1 text-sm text-slate-950">{user.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Role</dt>
              <dd className="mt-1 text-sm text-slate-950">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Status</dt>
              <dd className="mt-1 text-sm text-slate-950">Authenticated</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Learning</h2>
          <div className="mt-4 grid gap-3">
            <Link
              to="/roadmaps"
              className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Browse roadmaps
            </Link>
            <Link
              to="/my-progress"
              className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              View my progress
            </Link>
            <Link
              to="/topics"
              className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Read topic pages
            </Link>
            {user.role === ROLES.ADMIN || user.role === ROLES.CREATOR ? (
              <Link
                to="/creator"
                className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Open Creator Studio
              </Link>
            ) : null}
            {user.role === ROLES.ADMIN ? (
              <Link
                to="/admin/review"
                className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Review submitted content
              </Link>
            ) : null}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default Dashboard;
