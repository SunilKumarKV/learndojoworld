import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import ProgressBar from '../roadmaps/ProgressBar';
import EmptyState from '../ux/EmptyState';
import Skeleton from '../ux/Skeleton';
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
  [STUDY_PLAN_STATUS.PLANNED]: 'border-slate-200/70 bg-white/60 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
  [STUDY_PLAN_STATUS.IN_PROGRESS]: 'border-sky-200/70 bg-sky-50/80 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200',
  [STUDY_PLAN_STATUS.COMPLETED]:
    'border-emerald-200/70 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200',
  [STUDY_PLAN_STATUS.SKIPPED]: 'border-amber-200/70 bg-amber-50/80 text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
});

function formatMinutes(minutes = 0) {
  if (!minutes) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function formatDate(value) {
  if (!value) return 'No study yet';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(value));
}

function formatDay(value) {
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${value}T00:00:00`));
}

function getErrorMessage(error, fallback) {
  return error?.userMessage || error?.response?.data?.message || fallback;
}

function GlassCard({ children, className = '' }) {
  return (
    <section className={`rounded-[1.75rem] border border-white/60 bg-white/75 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 ${className}`}>
      {children}
    </section>
  );
}

function StatCard({ label, value, helper, accent = 'from-emerald-500 to-teal-500' }) {
  return (
    <GlassCard className="relative overflow-hidden p-5">
      <div className={`absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`} />
      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{helper}</p>
    </GlassCard>
  );
}

function StudyTrackerDashboard() {
  const { tokens, user } = useAuth();
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
        if (isMounted) setError(getErrorMessage(requestError, 'Unable to load learner dashboard'));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (tokens?.accessToken) load();
    return () => { isMounted = false; };
  }, [tokens?.accessToken]);

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

  const weeklyProgress = dashboard?.weeklyProgress || [];
  const maxStudyMinutes = Math.max(1, ...weeklyProgress.map((item) => item.studyMinutes || 0));

  const missionText = useMemo(() => {
    if (dashboard?.continueLearning?.[0]?.nextNode?.title) return dashboard.continueLearning[0].nextNode.title;
    if (dashboard?.today?.plan?.[0]?.title) return dashboard.today.plan[0].title;
    return 'Start your first roadmap mission';
  }, [dashboard]);

  function handleCompletePlan(plan) {
    return runAction(
      `plan-${plan.id}`,
      () => updateStudyPlanStatus(tokens.accessToken, plan.id, STUDY_PLAN_STATUS.COMPLETED),
      'Unable to update study plan'
    );
  }

  function handleStartSession(item) {
    return runAction(
      `start-${item.progressId}`,
      () => startStudySession(tokens.accessToken, {
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
      () => completeStudySession(tokens.accessToken, dashboard.activeSession.id),
      'Unable to complete study session'
    );
  }

  function handleCompleteRevision(item) {
    return runAction(
      `revision-${item.id}`,
      () => updateRevisionItem(tokens.accessToken, item.id, { status: 'COMPLETED', confidence: 80 }),
      'Unable to update revision item'
    );
  }

  return (
    <AppLayout title="Learner dashboard" eyebrow="Production SaaS Home">
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-3">
          <Skeleton className="h-40 rounded-[1.75rem]" />
          <Skeleton className="h-40 rounded-[1.75rem]" />
          <Skeleton className="h-40 rounded-[1.75rem]" />
        </div>
      ) : null}

      {error ? (
        <GlassCard className="mb-5 border-rose-200/70 bg-rose-50/80 p-4 text-sm font-semibold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">
          {error}. Check backend terminal logs for the exact Prisma/API cause.
        </GlassCard>
      ) : null}

      {dashboard ? (
        <div className="space-y-6">
          <GlassCard className="overflow-hidden p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Welcome back</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  {dashboard.profile?.name || user?.name || 'Learner'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                  Current mission: <span className="font-semibold text-slate-950 dark:text-white">{missionText}</span>
                </p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-gradient-to-br from-slate-950 to-slate-800 p-5 text-white shadow-2xl dark:border-white/10">
                <p className="text-sm text-white/70">Level {dashboard.xpLevel?.level || 1}</p>
                <p className="mt-1 text-3xl font-black">{dashboard.xpLevel?.xp || 0} XP</p>
                <div className="mt-4 h-2 rounded-full bg-white/15">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${dashboard.xpLevel?.progressToNextLevel || 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-white/60">{dashboard.xpLevel?.progressToNextLevel || 0}% to next level</p>
              </div>
            </div>
          </GlassCard>

          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Streak" value={`${dashboard.streak.current} days`} helper={`Longest ${dashboard.streak.longest} days`} />
            <StatCard label="Study time" value={formatMinutes(dashboard.studyTime.weekMinutes)} helper={`Today ${formatMinutes(dashboard.studyTime.todayMinutes)} · Total ${formatMinutes(dashboard.studyTime.totalMinutes)}`} accent="from-sky-500 to-indigo-500" />
            <GlassCard className="p-5">
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Active session</p>
              {dashboard.activeSession ? (
                <div className="mt-3">
                  <p className="font-bold text-slate-950 dark:text-white">{dashboard.activeSession.title || 'Study session'}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Started {formatDate(dashboard.activeSession.startedAt)}</p>
                  <button type="button" onClick={handleCompleteSession} disabled={actionId === `session-${dashboard.activeSession.id}`} className="mt-4 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-950">
                    Finish session
                  </button>
                </div>
              ) : <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No session running.</p>}
            </GlassCard>
          </section>

          {!dashboard.hasRealLearningData ? (
            <EmptyState
              icon="🚀"
              title="Your real learning dashboard is ready"
              description="No fake data is displayed. Start a roadmap, create flashcards, or complete a study session and this dashboard will populate from your database."
              actionLabel="Browse roadmaps"
              actionTo="/roadmaps"
            />
          ) : null}

          <section className="grid gap-6 lg:grid-cols-2">
            <GlassCard className="overflow-hidden">
              <div className="border-b border-slate-200/70 p-5 dark:border-white/10">
                <h2 className="text-lg font-black text-slate-950 dark:text-white">Today&apos;s plan</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{formatDate(dashboard.today.date)}</p>
              </div>
              {!dashboard.today.plan.length ? <div className="p-5 text-sm text-slate-600 dark:text-slate-300">No plan items for today.</div> : (
                <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                  {dashboard.today.plan.map((plan) => (
                    <article key={plan.id} className="p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-slate-950 dark:text-white">{plan.title}</h3>
                            <span className={`rounded-full border px-2 py-1 text-xs font-bold ${PLAN_STATUS_STYLES[plan.status]}`}>{STUDY_PLAN_LABELS[plan.status]}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.roadmap?.title || 'Personal study'} · {formatMinutes(plan.estimatedMinutes)}</p>
                        </div>
                        {plan.status !== STUDY_PLAN_STATUS.COMPLETED ? <button type="button" onClick={() => handleCompletePlan(plan)} disabled={actionId === `plan-${plan.id}`} className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">Mark done</button> : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </GlassCard>

            <GlassCard className="overflow-hidden">
              <div className="border-b border-slate-200/70 p-5 dark:border-white/10"><h2 className="text-lg font-black text-slate-950 dark:text-white">Continue learning</h2></div>
              {!dashboard.continueLearning.length ? <div className="p-5 text-sm text-slate-600 dark:text-slate-300">Start a roadmap to see your next lesson here.</div> : (
                <div className="divide-y divide-slate-200/70 dark:divide-white/10">
                  {dashboard.continueLearning.map((item) => (
                    <article key={item.progressId} className="p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{item.roadmap.title}</p>
                          <h3 className="mt-1 font-black text-slate-950 dark:text-white">{item.nextNode.title}</h3>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.completedNodes} of {item.totalNodes} nodes</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/roadmaps/${item.roadmap.id}/nodes/${item.nextNode.id}`} className="rounded-2xl bg-slate-950 px-3 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950">Open</Link>
                          <button type="button" onClick={() => handleStartSession(item)} disabled={Boolean(dashboard.activeSession) || actionId === `start-${item.progressId}`} className="rounded-2xl border border-slate-300/80 px-3 py-2 text-sm font-bold text-slate-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/10">Start timer</button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2"><div className="flex justify-between text-sm text-slate-600 dark:text-slate-300"><span>Progress</span><span>{item.progressPercentage}%</span></div><ProgressBar value={item.progressPercentage} /></div>
                    </article>
                  ))}
                </div>
              )}
            </GlassCard>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <GlassCard className="overflow-hidden"><div className="border-b border-slate-200/70 p-5 dark:border-white/10"><h2 className="text-lg font-black text-slate-950 dark:text-white">Revision due</h2></div>{!dashboard.revisionDue.length ? <div className="p-5 text-sm text-slate-600 dark:text-slate-300">No revision due today.</div> : <div className="divide-y divide-slate-200/70 dark:divide-white/10">{dashboard.revisionDue.map((item) => <article key={item.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-bold text-slate-950 dark:text-white">{item.title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Due {formatDate(item.dueAt)}</p></div><button type="button" onClick={() => handleCompleteRevision(item)} disabled={actionId === `revision-${item.id}`} className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">Reviewed</button></article>)}</div>}</GlassCard>
            <GlassCard className="overflow-hidden"><div className="border-b border-slate-200/70 p-5 dark:border-white/10"><h2 className="text-lg font-black text-slate-950 dark:text-white">Flashcards due</h2></div>{!dashboard.flashcardsDue?.length ? <div className="p-5 text-sm text-slate-600 dark:text-slate-300">No flashcards due today.</div> : <div className="divide-y divide-slate-200/70 dark:divide-white/10">{dashboard.flashcardsDue.map((card) => <article key={card.id} className="p-5"><h3 className="font-bold text-slate-950 dark:text-white">{card.frontText}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Mastery {card.masteryScore}% · Next {formatDate(card.nextReviewAt)}</p><Link to="/flashcards/review" className="mt-3 inline-flex rounded-2xl border border-slate-300/80 bg-white/70 px-3 py-2 text-sm font-bold text-slate-800 transition hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-slate-100">Review</Link></article>)}</div>}</GlassCard>
            <GlassCard className="overflow-hidden"><div className="border-b border-slate-200/70 p-5 dark:border-white/10"><h2 className="text-lg font-black text-slate-950 dark:text-white">Weak topics</h2></div>{!dashboard.weakTopics.length ? <div className="p-5 text-sm text-slate-600 dark:text-slate-300">No weak topics marked.</div> : <div className="divide-y divide-slate-200/70 dark:divide-white/10">{dashboard.weakTopics.map((item) => <article key={item.id} className="p-5"><h3 className="font-bold text-slate-950 dark:text-white">{item.roadmapNode.title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.roadmapNode.roadmap.title}</p><Link to={`/roadmaps/${item.roadmapNode.roadmapId}/nodes/${item.roadmapNode.id}`} className="mt-3 inline-flex rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-800 transition hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">Revise</Link></article>)}</div>}</GlassCard>
          </section>

          <GlassCard className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="text-lg font-black text-slate-950 dark:text-white">Weekly progress</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Last studied {formatDate(dashboard.streak.lastStudiedAt)}</p></div>
              <Link to="/my-progress" className="text-sm font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300">View all progress</Link>
            </div>
            <div className="mt-6 grid h-44 grid-cols-7 items-end gap-3">
              {weeklyProgress.map((item) => {
                const height = Math.max(12, Math.round(((item.studyMinutes || 0) / maxStudyMinutes) * 120));
                return <div key={item.date} className="flex h-full flex-col justify-end gap-2"><div className="flex flex-1 items-end"><div className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-600 to-teal-400" style={{ height: `${height}px` }} title={`${item.studyMinutes} minutes`} /></div><div className="text-center"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">{formatDay(item.date)}</p><p className="text-xs text-slate-500 dark:text-slate-400">{formatMinutes(item.studyMinutes)}</p></div></div>;
              })}
            </div>
          </GlassCard>
        </div>
      ) : null}
    </AppLayout>
  );
}

export default StudyTrackerDashboard;
