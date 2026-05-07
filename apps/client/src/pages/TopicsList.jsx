import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../features/auth/AuthContext';
import { fetchTopics } from '../features/topics/topicApi';

function TopicsList() {
  const { tokens } = useAuth();
  const [topics, setTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadTopics() {
      try {
        const data = await fetchTopics(tokens.accessToken);
        if (isMounted) {
          setTopics(data.topics);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load topics'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTopics();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  return (
    <AppLayout title="Topics">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading topics...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !error && !topics.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
          No published topics are available yet.
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {topics.map((topic) => (
          <article
            key={topic.id}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-emerald-700">
                  {topic.blockCount} blocks
                </p>
                <h2 className="mt-1 text-xl font-semibold text-slate-950">
                  {topic.title}
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {topic.status}
              </span>
            </div>
            {topic.summary ? (
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {topic.summary}
              </p>
            ) : null}
            {topic.roadmapNode ? (
              <p className="mt-4 text-sm text-slate-500">
                Linked to {topic.roadmapNode.title}
              </p>
            ) : null}
            <Link
              to={`/topics/${topic.id}`}
              className="mt-5 inline-flex rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Read topic
            </Link>
          </article>
        ))}
      </div>
    </AppLayout>
  );
}

export default TopicsList;
