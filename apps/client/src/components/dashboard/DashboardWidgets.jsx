import { Link } from 'react-router-dom';

const goals = [
  { label: 'Read 1 concept', done: true },
  { label: 'Complete 10 quiz questions', done: true },
  { label: 'Revise flashcards', done: false },
];

const courses = [
  { title: 'JavaScript DOM Mastery', level: 'Beginner', progress: 68, to: '/topics' },
  { title: 'React Production Patterns', level: 'Intermediate', progress: 42, to: '/roadmaps' },
  { title: 'Node + Express APIs', level: 'Backend', progress: 25, to: '/roadmaps' },
];

export function DailyLearningGoalWidget() {
  const completed = goals.filter((goal) => goal.done).length;

  return (
    <section className="ldw-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Daily mission</p>
          <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">{completed}/{goals.length} goals complete</h2>
        </div>
        <div className="rounded-2xl bg-emerald-100 px-4 py-3 text-2xl dark:bg-emerald-900/40">🎯</div>
      </div>
      <div className="mt-4 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-2 rounded-full bg-emerald-600 transition-all" style={{ width: `${(completed / goals.length) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-3">
        {goals.map((goal) => (
          <li key={goal.label} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
            <span className={goal.done ? 'text-emerald-600' : 'text-slate-400'}>{goal.done ? '✓' : '○'}</span>
            {goal.label}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RevisionDueCard() {
  return (
    <section className="ldw-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-amber-600 dark:text-amber-300">Revision due</p>
          <h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">18</h2>
        </div>
        <span className="rounded-2xl bg-amber-100 px-4 py-3 text-2xl dark:bg-amber-900/40">🧠</span>
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Flashcards and concepts scheduled for spaced repetition today.</p>
      <Link to="/learn" className="mt-4 inline-flex rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 dark:bg-white dark:text-slate-950">Start revision</Link>
    </section>
  );
}

export function StudyTimeAnalytics() {
  const bars = [35, 50, 42, 65, 78, 45, 90];
  return (
    <section className="ldw-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Study time</p>
          <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">6h 40m this week</h2>
        </div>
        <span className="rounded-xl border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">+12%</span>
      </div>
      <div className="mt-5 flex h-28 items-end gap-2">
        {bars.map((height, index) => (
          <div key={index} className="flex-1 rounded-t-xl bg-emerald-500/80 dark:bg-emerald-400/80" style={{ height: `${height}%` }} title={`Day ${index + 1}`} />
        ))}
      </div>
    </section>
  );
}

export function XpLevelSystem() {
  return (
    <section className="ldw-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-indigo-600 dark:text-indigo-300">XP Level</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">Level 7 · Green Belt</h2>
        </div>
        <span className="text-3xl">🥋</span>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: '72%' }} />
      </div>
      <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">720 / 1000 XP to Level 8</p>
    </section>
  );
}

export function RankLeaderboard() {
  const learners = ['Sunil', 'Asha', 'Rahul'];
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Leaderboard</h2>
      <div className="mt-4 space-y-3">
        {learners.map((name, index) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">#{index + 1} {name}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400">{980 - index * 120} XP</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ContinueLearningSection() {
  return (
    <section className="ldw-card p-5 lg:col-span-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">Continue learning</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Resume from your last saved lesson.</p>
        </div>
        <Link to="/learn" className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Open learning room</Link>
      </div>
      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-sm font-semibold text-slate-950 dark:text-white">React State Management · Lesson 4</p>
        <div className="mt-3 h-2 rounded-full bg-white dark:bg-slate-800">
          <div className="h-2 rounded-full bg-emerald-600" style={{ width: '54%' }} />
        </div>
      </div>
    </section>
  );
}

export function RecommendedCourses() {
  return (
    <section className="ldw-card p-5 lg:col-span-2">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Recommended courses</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {courses.map((course) => (
          <Link key={course.title} to={course.to} className="rounded-2xl border border-slate-100 p-4 transition hover:-translate-y-1 hover:shadow-md dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">{course.level}</p>
            <h3 className="mt-2 font-bold text-slate-950 dark:text-white">{course.title}</h3>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{course.progress}% completed</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function AiStudyAssistantPanel() {
  return (
    <aside className="ldw-card p-5">
      <div className="flex items-center gap-3">
        <span className="rounded-2xl bg-violet-100 px-4 py-3 text-2xl dark:bg-violet-900/40">🤖</span>
        <div>
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">AI Study Assistant</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Demo-safe panel ready for real AI API integration.</p>
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">
        Today, revise closures first, then solve 10 React MCQs. Your weak area is async JavaScript.
      </div>
      <Link to="/learn" className="mt-4 inline-flex rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 dark:border-slate-700 dark:text-slate-100">Open assistant</Link>
    </aside>
  );
}
