/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import { ROLES } from '../../constants/roles';
import { useAuth } from '../../features/auth/AuthContext';
import {
  acceptDoubtAnswer,
  createDoubt,
  createDoubtReply,
  fetchDoubts,
  markOfficialAnswer,
  reportDoubt,
  reportDoubtReply,
  upvoteDoubt,
  upvoteDoubtReply,
} from '../../features/doubts/doubtApi';
import AskDoubtModal from './AskDoubtModal';

function getDisplayName(user) {
  return user?.name || user?.email || 'LearnDojo user';
}

function formatTimestamp(seconds) {
  if (seconds === null || seconds === undefined) {
    return null;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || error?.message || fallback;
}

function Badge({ children, tone = 'slate' }) {
  const styles = {
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    sky: 'border-sky-200 bg-sky-50 text-sky-800',
    slate: 'border-slate-200 bg-slate-50 text-slate-700',
  };

  return (
    <span
      className={`rounded-full border px-2 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function DoubtSection({ topic }) {
  const { tokens, user } = useAuth();
  const [doubts, setDoubts] = useState([]);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  async function loadDoubts() {
    const data = await fetchDoubts(tokens.accessToken, {
      topicPageId: topic.id,
      roadmapNodeId: topic.roadmapNode?.id,
    });
    setDoubts(data.doubts);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchDoubts(tokens.accessToken, {
          topicPageId: topic.id,
          roadmapNodeId: topic.roadmapNode?.id,
        });
        if (isMounted) {
          setDoubts(data.doubts);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError, 'Unable to load doubts'));
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
  }, [tokens.accessToken, topic.id, topic.roadmapNode?.id]);

  async function runAction(id, action, fallbackMessage) {
    setActionId(id);
    setError('');

    try {
      await action();
      await loadDoubts();
    } catch (requestError) {
      setError(getErrorMessage(requestError, fallbackMessage));
    } finally {
      setActionId('');
    }
  }

  async function handleAskDoubt(payload) {
    await createDoubt(tokens.accessToken, payload);
    await loadDoubts();
  }

  function handleReplySubmit(event, doubt) {
    event.preventDefault();
    const content = replyDrafts[doubt.id]?.trim();

    if (!content) {
      return;
    }

    runAction(
      `reply-${doubt.id}`,
      async () => {
        await createDoubtReply(tokens.accessToken, doubt.id, { content });
        setReplyDrafts((current) => ({ ...current, [doubt.id]: '' }));
      },
      'Unable to post reply'
    );
  }

  function handleReportDoubt(doubt) {
    runAction(
      `report-doubt-${doubt.id}`,
      () =>
        reportDoubt(
          tokens.accessToken,
          doubt.id,
          'Reported from the topic doubt section'
        ),
      'Unable to report doubt'
    );
  }

  function handleReportReply(doubt, reply) {
    runAction(
      `report-reply-${reply.id}`,
      () =>
        reportDoubtReply(
          tokens.accessToken,
          doubt.id,
          reply.id,
          'Reported from the topic doubt section'
        ),
      'Unable to report reply'
    );
  }

  const canMarkOfficial =
    user.role === ROLES.ADMIN || user.role === ROLES.CREATOR;

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <AskDoubtModal
        isOpen={isAskOpen}
        onClose={() => setIsAskOpen(false)}
        onSubmit={handleAskDoubt}
        topic={topic}
      />

      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
            Doubt clearing
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-950">
            Topic discussion
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setIsAskOpen(true)}
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Ask doubt
        </button>
      </div>

      {isLoading ? (
        <div className="p-5 text-sm text-slate-600">Loading doubts...</div>
      ) : null}

      {error ? (
        <div className="m-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {!isLoading && !doubts.length ? (
        <div className="p-5 text-sm text-slate-600">
          No doubts yet. Start the first discussion for this topic.
        </div>
      ) : null}

      {doubts.length ? (
        <div className="divide-y divide-slate-200">
          {doubts.map((doubt) => {
            const timestamp = formatTimestamp(doubt.videoTimestampSeconds);
            const canAccept =
              user.role === ROLES.ADMIN || doubt.author?.id === user.id;

            return (
              <article key={doubt.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-slate-950">
                        {doubt.title}
                      </h3>
                      {doubt.status === 'RESOLVED' ? (
                        <Badge tone="emerald">Resolved</Badge>
                      ) : null}
                      {timestamp ? <Badge tone="sky">{timestamp}</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {doubt.content}
                    </p>
                    <p className="mt-3 text-xs text-slate-500">
                      Asked by {getDisplayName(doubt.author)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        runAction(
                          `upvote-doubt-${doubt.id}`,
                          () => upvoteDoubt(tokens.accessToken, doubt.id),
                          'Unable to update vote'
                        )
                      }
                      disabled={actionId === `upvote-doubt-${doubt.id}`}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                        doubt.hasUpvoted
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-slate-300 text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {doubt.upvoteCount} upvotes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReportDoubt(doubt)}
                      disabled={actionId === `report-doubt-${doubt.id}`}
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Report
                    </button>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {doubt.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-md border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-950">
                              {getDisplayName(reply.author)}
                            </p>
                            {reply.isOfficial ? (
                              <Badge tone="sky">Official answer</Badge>
                            ) : null}
                            {reply.isAccepted ? (
                              <Badge tone="emerald">Accepted answer</Badge>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {reply.content}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              runAction(
                                `upvote-reply-${reply.id}`,
                                () =>
                                  upvoteDoubtReply(
                                    tokens.accessToken,
                                    doubt.id,
                                    reply.id
                                  ),
                                'Unable to update reply vote'
                              )
                            }
                            disabled={actionId === `upvote-reply-${reply.id}`}
                            className={`rounded-md border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              reply.hasUpvoted
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            {reply.upvoteCount} upvotes
                          </button>
                          {canMarkOfficial && !reply.isOfficial ? (
                            <button
                              type="button"
                              onClick={() =>
                                runAction(
                                  `official-${reply.id}`,
                                  () =>
                                    markOfficialAnswer(
                                      tokens.accessToken,
                                      doubt.id,
                                      reply.id
                                    ),
                                  'Unable to mark official answer'
                                )
                              }
                              className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
                            >
                              Official
                            </button>
                          ) : null}
                          {canAccept && !reply.isAccepted ? (
                            <button
                              type="button"
                              onClick={() =>
                                runAction(
                                  `accept-${reply.id}`,
                                  () =>
                                    acceptDoubtAnswer(
                                      tokens.accessToken,
                                      doubt.id,
                                      reply.id
                                    ),
                                  'Unable to accept answer'
                                )
                              }
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100"
                            >
                              Accept
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => handleReportReply(doubt, reply)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 transition hover:bg-slate-100"
                          >
                            Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form
                  onSubmit={(event) => handleReplySubmit(event, doubt)}
                  className="mt-4 flex flex-col gap-3 sm:flex-row"
                >
                  <input
                    type="text"
                    value={replyDrafts[doubt.id] || ''}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [doubt.id]: event.target.value,
                      }))
                    }
                    className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Reply to this doubt"
                  />
                  <button
                    type="submit"
                    disabled={actionId === `reply-${doubt.id}`}
                    className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Reply
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export default DoubtSection;
