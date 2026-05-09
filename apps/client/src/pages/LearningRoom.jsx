import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import EmptyState from '../components/ux/EmptyState';
import Skeleton from '../components/ux/Skeleton';
import { useAuth } from '../features/auth/AuthContext';
import { fetchRoadmaps } from '../features/roadmaps/roadmapApi';
import { fetchTopics } from '../features/topics/topicApi';

function LearningRoom() {
  const { tokens } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [focusMode, setFocusMode] = useState(false);
  const [notes, setNotes] = useState(() => localStorage.getItem('ldw:learning-notes') || '');

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [roadmapData, topicData] = await Promise.all([
          fetchRoadmaps(tokens.accessToken),
          fetchTopics(tokens.accessToken, { status: 'PUBLISHED' }),
        ]);
        if (!mounted) return;
        setRoadmaps(roadmapData.roadmaps || roadmapData || []);
        setTopics(topicData.topics || topicData || []);
      } catch (requestError) {
        if (mounted) setError(requestError?.userMessage || 'Unable to load Learning Room');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [tokens.accessToken]);

  useEffect(() => {
    document.documentElement.classList.toggle('ldw-focus-mode', focusMode);
    return () => document.documentElement.classList.remove('ldw-focus-mode');
  }, [focusMode]);

  function saveNotes(value) {
    setNotes(value);
    localStorage.setItem('ldw:learning-notes', value);
  }

  return (
    <AppLayout title="Learning room" eyebrow="Focus workspace">
      <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">Real data workspace</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">Study from your published roadmaps and topics</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No dummy lesson content. This screen uses your backend roadmaps/topics and local autosaved notes.</p>
        </div>
        <button type="button" onClick={() => setFocusMode((value) => !value)} className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950">
          {focusMode ? 'Exit focus mode' : 'Enter focus mode'}
        </button>
      </div>

      {loading ? <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-72 rounded-[2rem]" /><Skeleton className="h-72 rounded-[2rem]" /></div> : null}
      {error ? <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-100">{error}</div> : null}

      {!loading && !roadmaps.length && !topics.length ? (
        <EmptyState icon="📚" title="Learning Room is ready, but no published content exists" description="Publish roadmaps/topics from Creator Studio. After that, this page will show real lessons and continue-learning actions." actionLabel="Open Creator Studio" actionTo="/creator" />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">Roadmap missions</h3>
          <div className="mt-5 grid gap-3">
            {roadmaps.slice(0, 6).map((roadmap) => (
              <article key={roadmap.id} className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h4 className="font-black text-slate-950 dark:text-white">{roadmap.title}</h4>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{roadmap.description || roadmap.summary || 'Production learning roadmap'}</p>
                  </div>
                  <Link to={`/roadmaps/${roadmap.id}`} className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white dark:bg-white dark:text-slate-950">Open</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">Study notes</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Autosaved in this browser for distraction-free practice.</p>
          <textarea value={notes} onChange={(event) => saveNotes(event.target.value)} placeholder="Write your key points, doubts, formulas, or revision reminders..." className="mt-5 min-h-72 w-full rounded-3xl border border-slate-200/80 bg-white/80 p-4 text-sm text-slate-900 shadow-inner outline-none transition focus:border-emerald-400 dark:border-white/10 dark:bg-slate-900/70 dark:text-white" />
        </section>

        <section className="rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55 lg:col-span-2">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">Published topics</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {topics.slice(0, 9).map((topic) => (
              <Link key={topic.id} to={`/topics/${topic.id}`} className="rounded-3xl border border-slate-200/70 bg-white/70 p-4 transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300">Topic</p>
                <h4 className="mt-2 font-black text-slate-950 dark:text-white">{topic.title}</h4>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{topic.summary || 'Open this topic to continue learning.'}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}

export default LearningRoom;
