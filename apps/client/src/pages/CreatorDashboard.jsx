import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CreatorStudioLayout from '../components/creatorStudio/CreatorStudioLayout';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import { useAuth } from '../features/auth/AuthContext';
import { fetchCreatorDashboard } from '../features/creatorStudio/creatorStudioApi';

const statCards = [
  ['courses', 'Courses'],
  ['modules', 'Modules'],
  ['lessons', 'Lessons'],
  ['pendingReview', 'In review'],
  ['published', 'Published'],
];

function CreatorDashboard() {
  const { tokens } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await fetchCreatorDashboard(tokens.accessToken);
        if (isMounted) {
          setDashboard(data);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'Unable to load Creator Studio'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  return (
    <CreatorStudioLayout
      title="Creator dashboard"
      actions={
        <Link
          to="/creator/courses/new"
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Create course
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading Creator Studio...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {dashboard ? (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map(([key, label]) => (
              <div
                key={key}
                className="ldw-glass-card p-5"
              >
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {dashboard.stats[key]}
                </p>
              </div>
            ))}
          </section>

          <section className="ldw-glass-card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Recent course work
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Draft, review, and published content from your studio.
                </p>
              </div>
              <Link
                to="/creator/courses"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all courses
              </Link>
            </div>

            {!dashboard.recentCourses.length ? (
              <div className="p-6 text-sm text-slate-600">
                No courses yet. Start with a course shell, then add modules,
                lessons, notes, and quizzes.
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {dashboard.recentCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-950">
                          {course.title}
                        </h3>
                        <StatusBadge status={course.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {course.moduleCount} modules | {course.lessonCount}{' '}
                        lessons | {course.quizCount} quizzes
                      </p>
                    </div>
                    <Link
                      to={`/creator/courses/${course.id}/builder`}
                      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                    >
                      Open builder
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <section className="ldw-glass-card p-5">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Revenue analytics</h2>
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">No real payment/revenue table is connected yet, so fake revenue is hidden.</p>
            </section>
            <section className="ldw-glass-card p-5">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Course engagement</h2>
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Engagement appears after real learner enrollments, study sessions, and quiz attempts are linked to courses.</p>
            </section>
            <section className="ldw-glass-card p-5 lg:col-span-2">
              <h2 className="text-lg font-black text-slate-950 dark:text-white">Builder tools</h2>
              <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Use the real course builder pages instead of simulated drag/drop data.</p>
              <Link to="/creator/courses" className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950">Open courses</Link>
            </section>
          </section>
        </div>
      ) : null}
    </CreatorStudioLayout>
  );
}

export default CreatorDashboard;
