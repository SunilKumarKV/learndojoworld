import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DoubtSection from '../components/doubts/DoubtSection';
import AppLayout from '../components/layout/AppLayout';
import TopicRenderer from '../components/topics/TopicRenderer';
import { useAuth } from '../features/auth/AuthContext';
import { fetchTopic } from '../features/topics/topicApi';

function TopicDetail() {
  const { topicId } = useParams();
  const { tokens } = useAuth();
  const [topic, setTopic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadTopic() {
      try {
        const data = await fetchTopic(tokens.accessToken, topicId);
        if (isMounted) {
          setTopic(data.topic);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load topic'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadTopic();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken, topicId]);

  return (
    <AppLayout title={topic?.title || 'Topic'}>
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading topic...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {topic ? (
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
              W3Schools-style lesson
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal text-slate-950">
              {topic.title}
            </h2>
            {topic.summary ? (
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {topic.summary}
              </p>
            ) : null}
            {topic.roadmapNode ? (
              <Link
                to={`/roadmaps/${topic.roadmapNode.roadmapId}/nodes/${topic.roadmapNode.id}`}
                className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Open linked roadmap node
              </Link>
            ) : null}
          </section>

          <TopicRenderer topic={topic} />

          <DoubtSection topic={topic} />
        </div>
      ) : null}
    </AppLayout>
  );
}

export default TopicDetail;
