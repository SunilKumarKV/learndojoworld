import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProgressBar from '../components/roadmaps/ProgressBar';
import { useAuth } from '../features/auth/AuthContext';
import { fetchRoadmaps } from '../features/roadmaps/roadmapApi';

function RoadmapsList() {
  const { tokens } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRoadmaps() {
      try {
        const data = await fetchRoadmaps(tokens.accessToken);
        if (isMounted) {
          setRoadmaps(data.roadmaps);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load roadmaps'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRoadmaps();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  return (
    <AppLayout title="Roadmaps">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading roadmaps...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && !roadmaps.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No roadmaps are available yet.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {roadmaps.map((roadmap) => (
          <article
            key={roadmap.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                  {roadmap.totalNodes} nodes
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {roadmap.title}
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {roadmap.status}
              </span>
            </div>
            {roadmap.description ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {roadmap.description}
              </p>
            ) : null}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="text-slate-600">
                  {roadmap.progressPercentage}%
                </span>
              </div>
              <ProgressBar value={roadmap.progressPercentage} />
            </div>
            <Link
              to={`/roadmaps/${roadmap.id}`}
              className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              View roadmap
            </Link>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}

export default RoadmapsList;
