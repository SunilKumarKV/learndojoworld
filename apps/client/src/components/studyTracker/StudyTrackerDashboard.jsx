import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import ProgressBar from '../roadmaps/ProgressBar';
import {
  STUDY_PLAN_LABELS,
  STUDY_PLAN_STATUS,
} from '../../constants/studyTracker';
import { useAuth } from '../../features/auth/AuthContext';
import {
  completeStudySession,
  fetchStudyDashboard,
  startStudySession,
  updateRevisionItem,
  updateStudyPlanStatus,
} from '../../features/studyTracker/studyTrackerApi';

const PLAN_STATUS_STYLES = Object.freeze({
  [STUDY_PLAN_STATUS.PLANNED]: 'border-slate-200 bg-slate-50 text-slate-700',
  [STUDY_PLAN_STATUS.IN_PROGRESS]: 'border-sky-200 bg-sky-50 text-sky-800',
  [STUDY_PLAN_STATUS.COMPLETED]:
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  [STUDY_PLAN_STATUS.SKIPPED]: 'border-amber-200 bg-amber-50 text-amber-800',
});

function formatMinutes(minutes = 0) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatDate(value) {
  if (!value) {
    return 'No study yet';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(`${value}T00:00:00`));
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function StudyTrackerDashboard() {
  const { tokens } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');

  async function loadDashboard() {
    const data = await fetchStudyDashboard(tokens.accessToken);
    setDashboard(data);
  }

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await fetchStudyDashboard(tokens.accessToken);
        if (isMounted) {
          setDashboard(data);
          setError('');
        }
      } catch (requestError) {
        if (isMounted) {
          setError(
            getErrorMessage(requestError, 'Unable to load StudyTracker')
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
  }, [tokens.accessToken]);

  async function runAction(id, action, fallbackMessage) {
    setActionId(id);
    setError('');

    try {
      await action();
      await loadDashboard();
    } catch (requestError) {
      setError(getErrorMessage(requestError, fallbackMessage));
    } finally {
      setActionId('');
    }
  }

  function handleCompletePlan(plan) {
    return runAction(
      `plan-${plan.id}`,
      () =>
        updateStudyPlanStatus(
          tokens.accessToken,
          plan.id,
          STUDY_PLAN_STATUS.COMPLETED
        ),
      'Unable to update study plan'
    );
  }

  function handleStartSession(item) {
    return runAction(
      `start-${item.progressId}`,
      () =>
        startStudySession(tokens.accessToken, {
          title: `Study ${item.nextNode.title}`,
          roadmapId: item.roadmap.id,
          roadmapNodeId: item.nextNode.id,
        }),
      'Unable to start study session'
    );
  }

  function handleCompleteSession() {
    return runAction(
      `session-${dashboard.activeSession.id}`,
      () =>
        completeStudySession(tokens.accessToken, dashboard.activeSession.id),
      'Unable to complete study session'
    );
  }

  function handleCompleteRevision(item) {
    return runAction(
      `revision-${item.id}`,
      () =>
        updateRevisionItem(tokens.accessToken, item.id, {
          status: 'COMPLETED',
          confidence: 80,
        }),
      'Unable to update revision item'
    );
  }

  const weeklyProgress = dashboard?.weeklyProgress || [];
  const maxStudyMinutes = Math.max(
    1,
    ...weeklyProgress.map((item) => item.studyMinutes)
  );

  return (
    <AppLayout title="Learner home">
      {isLoading ? (
        <p className="text-sm text-slate-600">Loading StudyTracker...</p>
      ) : null}

      {error ? (
        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      {dashboard ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Streak</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">
                {dashboard.streak.current} days
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Longest {dashboard.streak.longest} days
              </p>
            </div>
            <div className="rounded-lg border border-sky-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">Study time</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">
                {formatMinutes(dashboard.studyTime.weekMinutes)}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Today {formatMinutes(dashboard.studyTime.todayMinutes)} | Total{' '}
                {formatMinutes(dashboard.studyTime.totalMinutes)}
              </p>
            </div>
            <div className="rounded-lg border border-violet-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-medium text-slate-500">
                Active session
              </p>
              {dashboard.activeSession ? (
                <div className="mt-3">
                  <p className="font-semibold text-slate-950">
                    {dashboard.activeSession.title || 'Study session'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Started {formatDate(dashboard.activeSession.startedAt)}
                  </p>
                  <button
                    type="button"
                    onClick={handleCompleteSession}
                    disabled={
                      actionId === `session-${dashboard.activeSession.id}`
                    }
                    className="mt-4 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Finish session
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-600">
                  No session running.
                </p>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  Today&apos;s plan
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {formatDate(dashboard.today.date)}
                </p>
              </div>

              {!dashboard.today.plan.length ? (
                <div className="p-5 text-sm text-slate-600">
                  No plan items for today.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dashboard.today.plan.map((plan) => (
                    <article key={plan.id} className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-950">
                              {plan.title}
                            </h3>
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                                PLAN_STATUS_STYLES[plan.status]
                              }`}
                            >
                              {STUDY_PLAN_LABELS[plan.status]}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {plan.roadmap?.title || 'Personal study'} |{' '}
                            {formatMinutes(plan.estimatedMinutes)}
                          </p>
                        </div>
                        {plan.status !== STUDY_PLAN_STATUS.COMPLETED ? (
                          <button
                            type="button"
                            onClick={() => handleCompletePlan(plan)}
                            disabled={actionId === `plan-${plan.id}`}
                            className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Mark done
                          </button>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  Continue roadmap
                </h2>
              </div>

              {!dashboard.continueLearning.length ? (
                <div className="p-5 text-sm text-slate-600">
                  Start a roadmap to see your next lesson here.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dashboard.continueLearning.map((item) => (
                    <article key={item.progressId} className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium text-emerald-700">
                            {item.roadmap.title}
                          </p>
                          <h3 className="mt-1 font-semibold text-slate-950">
                            {item.nextNode.title}
                          </h3>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.completedNodes} of {item.totalNodes} nodes
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/roadmaps/${item.roadmap.id}/nodes/${item.nextNode.id}`}
                            className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                          >
                            Open
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleStartSession(item)}
                            disabled={
                              Boolean(dashboard.activeSession) ||
                              actionId === `start-${item.progressId}`
                            }
                            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Start timer
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Progress</span>
                          <span>{item.progressPercentage}%</span>
                        </div>
                        <ProgressBar value={item.progressPercentage} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  Revision due
                </h2>
              </div>

              {!dashboard.revisionDue.length ? (
                <div className="p-5 text-sm text-slate-600">
                  No revision due today.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dashboard.revisionDue.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div>
                        <h3 className="font-semibold text-slate-950">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          Due {formatDate(item.dueAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCompleteRevision(item)}
                        disabled={actionId === `revision-${item.id}`}
                        className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Reviewed
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-200 p-5">
                <h2 className="text-lg font-semibold text-slate-950">
                  Weak topics
                </h2>
              </div>

              {!dashboard.weakTopics.length ? (
                <div className="p-5 text-sm text-slate-600">
                  No weak topics marked.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {dashboard.weakTopics.map((item) => (
                    <article key={item.id} className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-950">
                            {item.roadmapNode.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {item.roadmapNode.roadmap.title}
                          </p>
                        </div>
                        <Link
                          to={`/roadmaps/${item.roadmapNode.roadmapId}/nodes/${item.roadmapNode.id}`}
                          className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-100"
                        >
                          Revise
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Weekly progress
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Last studied {formatDate(dashboard.streak.lastStudiedAt)}
                </p>
              </div>
              <Link
                to="/my-progress"
                className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View all progress
              </Link>
            </div>

            <div className="mt-6 grid h-44 grid-cols-7 items-end gap-3">
              {weeklyProgress.map((item) => {
                const height = Math.max(
                  12,
                  Math.round((item.studyMinutes / maxStudyMinutes) * 120)
                );

                return (
                  <div
                    key={item.date}
                    className="flex h-full flex-col justify-end gap-2"
                  >
                    <div className="flex flex-1 items-end">
                      <div
                        className="w-full rounded-t-md bg-emerald-600"
                        style={{ height: `${height}px` }}
                        title={`${item.studyMinutes} minutes`}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-700">
                        {formatDay(item.date)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatMinutes(item.studyMinutes)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default StudyTrackerDashboard;
