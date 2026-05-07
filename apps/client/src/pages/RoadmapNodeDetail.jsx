import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import {
  NODE_PROGRESS_LABELS,
  NODE_PROGRESS_STATUS,
} from '../constants/nodeProgressStatus';
import { useAuth } from '../features/auth/AuthContext';
import {
  fetchRoadmapNode,
  updateNodeProgress,
} from '../features/roadmaps/roadmapApi';
import { fetchTopics } from '../features/topics/topicApi';

function RoadmapNodeDetail() {
  const { nodeId, roadmapId } = useParams();
  const { tokens, user } = useAuth();
  const [node, setNode] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');

  async function loadNode() {
    const data = await fetchRoadmapNode(tokens.accessToken, roadmapId, nodeId);
    setNode(data.node);
    setRoadmap(data.roadmap);
    const topicData = await fetchTopics(tokens.accessToken, {
      roadmapNodeId: nodeId,
    });
    setTopics(topicData.topics);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const [data, topicData] = await Promise.all([
          fetchRoadmapNode(tokens.accessToken, roadmapId, nodeId),
          fetchTopics(tokens.accessToken, { roadmapNodeId: nodeId }),
        ]);
        if (isMounted) {
          setNode(data.node);
          setRoadmap(data.roadmap);
          setTopics(topicData.topics);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'Unable to load roadmap node'
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
  }, [nodeId, roadmapId, tokens.accessToken]);

  async function handleProgressUpdate(status) {
    setIsUpdating(true);
    setError('');

    try {
      await updateNodeProgress(tokens.accessToken, roadmapId, nodeId, status);
      await loadNode();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to update progress'
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <AppLayout title={node?.title || 'Roadmap node'}>
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading roadmap node...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {node ? (
        <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <Link
            to={`/roadmaps/${roadmapId}`}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Back to {roadmap?.title || 'roadmap'}
          </Link>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-slate-500">
                Node {node.order + 1}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {node.title}
              </h2>
              <p className="mt-3 text-sm font-medium text-slate-600">
                Status: {NODE_PROGRESS_LABELS[node.progress.status]}
              </p>
            </div>
            {user.role === 'LEARNER' ? (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleProgressUpdate(NODE_PROGRESS_STATUS.IN_PROGRESS)
                  }
                  disabled={isUpdating}
                  className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  In progress
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleProgressUpdate(NODE_PROGRESS_STATUS.COMPLETED)
                  }
                  disabled={isUpdating}
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleProgressUpdate(NODE_PROGRESS_STATUS.NEEDS_REVISION)
                  }
                  disabled={isUpdating}
                  className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Needs revision
                </button>
              </div>
            ) : null}
          </div>

          {node.summary ? (
            <p className="mt-6 text-sm leading-6 text-slate-600">
              {node.summary}
            </p>
          ) : null}

          <div className="prose prose-slate mt-6 max-w-none whitespace-pre-line text-sm leading-7 text-slate-700">
            {node.content || 'Content will be added for this node soon.'}
          </div>

          <section className="mt-8 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-500">
              Prerequisites
            </h3>
            {node.prerequisites.length ? (
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {node.prerequisites.map((prerequisite) => (
                  <li key={prerequisite.id}>{prerequisite.title}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No prerequisites for this node.
              </p>
            )}
          </section>

          <section className="mt-8 border-t border-slate-200 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-normal text-slate-500">
              Topic pages
            </h3>
            {topics.length ? (
              <div className="mt-3 grid gap-3">
                {topics.map((topic) => (
                  <Link
                    key={topic.id}
                    to={`/topics/${topic.id}`}
                    className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    {topic.title}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">
                No approved topic pages are linked to this node yet.
              </p>
            )}
          </section>
        </article>
      ) : null}
    </AppLayout>
  );
}

export default RoadmapNodeDetail;
