import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProgressBar from '../components/roadmaps/ProgressBar';
import { useAuth } from '../features/auth/AuthContext';
import { fetchMyProgress } from '../features/roadmaps/roadmapApi';

function MyLearningProgress() {
  const { tokens } = useAuth();
  const [progressItems, setProgressItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        const data = await fetchMyProgress(tokens.accessToken);
        if (isMounted) {
          setProgressItems(data.progress);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'Unable to load learning progress'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  return (
    <AppLayout title="My learning progress">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading progress...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && !progressItems.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          You have not started any roadmaps yet.
        </div>
      ) : null}

      <div className="space-y-4">
        {progressItems.map((item) => (
          <article
            key={item.progress.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  {item.roadmap.title}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {item.progress.completedNodes} of {item.progress.totalNodes}{' '}
                  nodes completed
                </p>
              </div>
              <Link
                to={`/roadmaps/${item.roadmap.id}`}
                className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue
              </Link>
            </div>
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="text-slate-600">
                  {item.progress.progressPercentage}%
                </span>
              </div>
              <ProgressBar value={item.progress.progressPercentage} />
            </div>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}

export default MyLearningProgress;
