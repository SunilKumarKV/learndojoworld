import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminReviewLayout from '../components/adminReview/AdminReviewLayout';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import { COURSE_STATUS } from '../constants/courseStatus';
import { useAuth } from '../features/auth/AuthContext';
import { fetchReviewQueue } from '../features/adminReview/adminReviewApi';

const STATUS_OPTIONS = [
  COURSE_STATUS.SUBMITTED,
  COURSE_STATUS.APPROVED,
  COURSE_STATUS.REJECTED,
  COURSE_STATUS.PUBLISHED,
  COURSE_STATUS.FLAGGED,
];

function formatContentType(contentType) {
  return contentType === 'COURSE' ? 'Course' : 'Topic page';
}

function AdminReviewQueue() {
  const { tokens } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(COURSE_STATUS.SUBMITTED);
  const [contentType, setContentType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadQueue() {
      setIsLoading(true);
      try {
        const data = await fetchReviewQueue(tokens.accessToken, {
          status,
          contentType: contentType || undefined,
        });
        if (isMounted) {
          setItems(data.items);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'Unable to load review queue'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadQueue();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken, status, contentType]);

  return (
    <AdminReviewLayout title="Review queue">
      <section className="mb-5 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Status
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option
                    .toLowerCase()
                    .split('_')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Content type
            <select
              value={contentType}
              onChange={(event) => setContentType(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">All content</option>
              <option value="course">Courses</option>
              <option value="topic">Topic pages</option>
            </select>
          </label>
        </div>
      </section>

      {isLoading ? (
        <p className="text-sm text-slate-600">Loading review queue...</p>
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !items.length ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No content matches this queue.
        </div>
      ) : null}

      {items.length ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <article
              key={`${item.contentType}-${item.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {formatContentType(item.contentType)}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">
                    {item.title}
                  </h2>
                  {item.summary ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                      {item.summary}
                    </p>
                  ) : null}
                  <p className="mt-3 text-sm text-slate-600">
                    Creator: {item.creator?.name || item.creator?.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.contentType === 'COURSE'
                      ? `${item.moduleCount} modules | ${item.lessonCount} lessons | ${item.quizCount} quizzes`
                      : `${item.blockCount} content blocks`}
                  </p>
                </div>
                <Link
                  to={`/admin/review/${item.contentTypeParam}/${item.id}`}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Preview
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </AdminReviewLayout>
  );
}

export default AdminReviewQueue;
