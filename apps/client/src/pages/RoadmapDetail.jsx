import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import ProgressBar from '../components/roadmaps/ProgressBar';
import RoadmapNodeCard from '../components/roadmaps/RoadmapNodeCard';
import { useAuth } from '../features/auth/AuthContext';
import { fetchRoadmap, startRoadmap } from '../features/roadmaps/roadmapApi';

function RoadmapDetail() {
  const { roadmapId } = useParams();
  const { tokens, user } = useAuth();
  const [roadmap, setRoadmap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState('');

  async function loadRoadmap() {
    const data = await fetchRoadmap(tokens.accessToken, roadmapId);
    setRoadmap(data.roadmap);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchRoadmap(tokens.accessToken, roadmapId);
        if (isMounted) {
          setRoadmap(data.roadmap);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load roadmap'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [roadmapId, tokens.accessToken]);

  async function handleStartRoadmap() {
    setIsStarting(true);
    setError('');

    try {
      await startRoadmap(tokens.accessToken, roadmapId);
      await loadRoadmap();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to start roadmap'
      );
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <AppLayout title={roadmap?.title || 'Roadmap detail'}>
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading roadmap...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {roadmap ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
                  {roadmap.totalNodes} nodes
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  {roadmap.title}
                </h2>
                {roadmap.description ? (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                    {roadmap.description}
                  </p>
                ) : null}
              </div>
              {user.role === 'LEARNER' && !roadmap.progress?.startedAt ? (
                <button
                  type="button"
                  onClick={handleStartRoadmap}
                  disabled={isStarting}
                  className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isStarting ? 'Starting...' : 'Start roadmap'}
                </button>
              ) : null}
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">Progress</span>
                <span className="text-slate-600">
                  {roadmap.progress?.progressPercentage || 0}%
                </span>
              </div>
              <ProgressBar value={roadmap.progress?.progressPercentage || 0} />
            </div>
          </section>

          {!roadmap.nodes.length ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
              This roadmap does not have nodes yet.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {roadmap.nodes.map((node) => (
                <RoadmapNodeCard
                  key={node.id}
                  node={node}
                  roadmapId={roadmap.id}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </AppLayout>
  );
}

export default RoadmapDetail;
