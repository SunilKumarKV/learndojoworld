import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AdminReviewLayout from '../components/adminReview/AdminReviewLayout';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import { useAuth } from '../features/auth/AuthContext';
import {
  fetchCreator,
  fetchCreators,
} from '../features/adminReview/adminReviewApi';

function getTotalStatusCounts(statusCounts) {
  return Object.values(statusCounts || {}).reduce(
    (total, count) => total + count,
    0
  );
}

function AdminCreatorManagement() {
  const { tokens } = useAuth();
  const [searchParams] = useSearchParams();
  const initialCreatorId = searchParams.get('creatorId') || '';
  const [creators, setCreators] = useState([]);
  const [selectedCreatorId, setSelectedCreatorId] = useState(initialCreatorId);
  const [creatorDetails, setCreatorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedCreator = useMemo(
    () => creators.find((creator) => creator.id === selectedCreatorId),
    [creators, selectedCreatorId]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadCreators() {
      try {
        const data = await fetchCreators(tokens.accessToken);
        if (isMounted) {
          setCreators(data.creators);
          setSelectedCreatorId(
            (currentId) => currentId || data.creators[0]?.id || ''
          );
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message || 'Unable to load creators'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCreators();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken]);

  useEffect(() => {
    let isMounted = true;

    async function loadCreatorDetails() {
      if (!selectedCreatorId) {
        setCreatorDetails(null);
        return;
      }

      try {
        const data = await fetchCreator(tokens.accessToken, selectedCreatorId);
        if (isMounted) {
          setCreatorDetails(data.creator);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'Unable to load creator details'
          );
        }
      }
    }

    loadCreatorDetails();

    return () => {
      isMounted = false;
    };
  }, [tokens.accessToken, selectedCreatorId]);

  return (
    <AdminReviewLayout title="Creator management">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading creators...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !creators.length ? (
        <section className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
          No creators found.
        </section>
      ) : null}

      {creators.length ? (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-5">
              <h2 className="text-lg font-semibold text-slate-950">Creators</h2>
            </div>
            <div className="divide-y divide-slate-200">
              {creators.map((creator) => (
                <button
                  key={creator.id}
                  type="button"
                  onClick={() => setSelectedCreatorId(creator.id)}
                  className={`w-full px-5 py-4 text-left transition ${
                    creator.id === selectedCreatorId
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <p className="font-semibold text-slate-950">
                    {creator.name || creator.email}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{creator.email}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {creator.courseCount} courses | {creator.topicCount} topics
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            {selectedCreator || creatorDetails ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-950">
                  {creatorDetails?.name ||
                    selectedCreator?.name ||
                    selectedCreator?.email}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {creatorDetails?.email || selectedCreator?.email}
                </p>

                <dl className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-sm font-medium text-slate-500">
                      Courses
                    </dt>
                    <dd className="mt-1 text-xl font-bold text-slate-950">
                      {creatorDetails?.courseCount ||
                        selectedCreator?.courseCount ||
                        0}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-sm font-medium text-slate-500">
                      Topics
                    </dt>
                    <dd className="mt-1 text-xl font-bold text-slate-950">
                      {creatorDetails?.topicCount ||
                        selectedCreator?.topicCount ||
                        0}
                    </dd>
                  </div>
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-sm font-medium text-slate-500">
                      Content
                    </dt>
                    <dd className="mt-1 text-xl font-bold text-slate-950">
                      {getTotalStatusCounts(
                        creatorDetails?.statusCounts?.courses ||
                          selectedCreator?.statusCounts?.courses
                      ) +
                        getTotalStatusCounts(
                          creatorDetails?.statusCounts?.topics ||
                            selectedCreator?.statusCounts?.topics
                        )}
                    </dd>
                  </div>
                </dl>

                {creatorDetails ? (
                  <div className="mt-6 grid gap-6">
                    <div>
                      <h3 className="font-semibold text-slate-950">Courses</h3>
                      <div className="mt-3 grid gap-3">
                        {creatorDetails.courses.length ? (
                          creatorDetails.courses.map((course) => (
                            <div
                              key={course.id}
                              className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium text-slate-950">
                                  {course.title}
                                </p>
                                <StatusBadge status={course.status} />
                              </div>
                              <Link
                                to={`/admin/review/${course.contentTypeParam}/${course.id}`}
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                              >
                                Preview
                              </Link>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600">
                            No courses yet.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-950">Topics</h3>
                      <div className="mt-3 grid gap-3">
                        {creatorDetails.topics.length ? (
                          creatorDetails.topics.map((topic) => (
                            <div
                              key={topic.id}
                              className="flex flex-col gap-3 rounded-md border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="font-medium text-slate-950">
                                  {topic.title}
                                </p>
                                <StatusBadge status={topic.status} />
                              </div>
                              <Link
                                to={`/admin/review/${topic.contentTypeParam}/${topic.id}`}
                                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                              >
                                Preview
                              </Link>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-slate-600">
                            No topics yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-slate-600">Select a creator.</p>
            )}
          </section>
        </div>
      ) : null}
    </AdminReviewLayout>
  );
}

export default AdminCreatorManagement;
