import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import AdminReviewLayout from '../components/adminReview/AdminReviewLayout';
import ContentStatusTimeline from '../components/adminReview/ContentStatusTimeline';
import RejectionReasonModal from '../components/adminReview/RejectionReasonModal';
import StatusBadge from '../components/creatorStudio/StatusBadge';
import TopicBlock from '../components/topics/TopicBlock';
import { useAuth } from '../features/auth/AuthContext';
import {
  approveContent,
  fetchReviewContent,
  flagContent,
  publishContent,
  rejectContent,
} from '../features/adminReview/adminReviewApi';

function AdminContentPreview() {
  const { contentType, contentId } = useParams();
  const { tokens } = useAuth();
  const [item, setItem] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [modalAction, setModalAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchReviewContent(
          tokens.accessToken,
          contentType,
          contentId
        );
        if (isMounted) {
          setItem(data.item);
          setTimeline(data.timeline);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            requestError?.response?.data?.message ||
              'Unable to load content preview'
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
  }, [tokens.accessToken, contentType, contentId]);

  async function runAction(action, successMessage) {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const data = await action();
      setItem(data.item);
      setTimeline(data.timeline);
      setSuccess(successMessage);
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message || 'Unable to update content'
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReasonSubmit(reason) {
    const action = modalAction;
    setModalAction(null);

    if (action === 'reject') {
      await runAction(
        () => rejectContent(tokens.accessToken, contentType, contentId, reason),
        'Content rejected.'
      );
    }

    if (action === 'flag') {
      await runAction(
        () => flagContent(tokens.accessToken, contentType, contentId, reason),
        'Content flagged.'
      );
    }
  }

  return (
    <AdminReviewLayout
      title={item?.title || 'Content preview'}
      actions={
        <Link
          to="/admin/review"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
        >
          Back to queue
        </Link>
      }
    >
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading content preview...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      ) : null}

      {item ? (
        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                      {item.contentType === 'COURSE' ? 'Course' : 'Topic page'}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h2 className="mt-3 text-2xl font-bold text-slate-950">
                    {item.title}
                  </h2>
                  {item.summary || item.description ? (
                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      {item.summary || item.description}
                    </p>
                  ) : null}
                  <p className="mt-4 text-sm text-slate-600">
                    Creator: {item.creator?.name || item.creator?.email}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      runAction(
                        () =>
                          approveContent(
                            tokens.accessToken,
                            contentType,
                            contentId
                          ),
                        'Content approved.'
                      )
                    }
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() =>
                      runAction(
                        () =>
                          publishContent(
                            tokens.accessToken,
                            contentType,
                            contentId
                          ),
                        'Content published.'
                      )
                    }
                    className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Publish
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setModalAction('reject')}
                    className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setModalAction('flag')}
                    className="rounded-md border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    Flag
                  </button>
                </div>
              </div>
              {item.reviewNotes ? (
                <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  {item.reviewNotes}
                </div>
              ) : null}
            </section>

            {item.contentType === 'COURSE' ? (
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Course preview
                </h2>
                <div className="mt-5 space-y-4">
                  {item.modules.map((courseModule) => (
                    <div
                      key={courseModule.id}
                      className="rounded-lg border border-slate-200 p-4"
                    >
                      <h3 className="font-semibold text-slate-950">
                        {courseModule.title}
                      </h3>
                      {courseModule.summary ? (
                        <p className="mt-1 text-sm text-slate-600">
                          {courseModule.summary}
                        </p>
                      ) : null}
                      <div className="mt-4 space-y-3">
                        {courseModule.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="rounded-md bg-slate-50 p-4"
                          >
                            <p className="font-medium text-slate-950">
                              {lesson.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {lesson.videoUrl ? 'Video added' : 'No video'} |{' '}
                              {lesson.notes.length} note blocks |{' '}
                              {lesson.quiz ? 'Quiz added' : 'No quiz'}
                            </p>
                            {lesson.notes.length ? (
                              <div className="mt-4 space-y-3">
                                {lesson.notes.map((block) => (
                                  <TopicBlock key={block.id} block={block} />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-950">
                  Topic preview
                </h2>
                <div className="mt-5 space-y-4">
                  {item.blocks.map((block) => (
                    <TopicBlock key={block.id} block={block} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Creator details
              </h2>
              <dl className="mt-4 grid gap-3 text-sm">
                <div>
                  <dt className="font-medium text-slate-500">Name</dt>
                  <dd className="mt-1 text-slate-950">
                    {item.creator?.name || 'No name'}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-500">Email</dt>
                  <dd className="mt-1 text-slate-950">{item.creator?.email}</dd>
                </div>
              </dl>
              {item.creator?.id ? (
                <Link
                  to={`/admin/creators?creatorId=${item.creator.id}`}
                  className="mt-5 inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  View creator
                </Link>
              ) : null}
            </section>
            <ContentStatusTimeline timeline={timeline} />
          </aside>
        </div>
      ) : null}

      {modalAction ? (
        <RejectionReasonModal
          title={modalAction === 'reject' ? 'Reject content' : 'Flag content'}
          actionLabel={modalAction === 'reject' ? 'Reject' : 'Flag'}
          onCancel={() => setModalAction(null)}
          onSubmit={handleReasonSubmit}
        />
      ) : null}
    </AdminReviewLayout>
  );
}

export default AdminContentPreview;
