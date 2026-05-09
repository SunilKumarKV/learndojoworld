/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react';

export function StudioOverviewMetrics() {
  const metrics = [
    ['Revenue', '₹18,400', '+9.2%'],
    ['Live students', '1,284', '+126'],
    ['Completion', '64%', '+4%'],
    ['Watch time', '342h', '+18h'],
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map(([label, value, change]) => (
        <div key={label} className="ldw-card p-5">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{value}</p>
          <p className="mt-2 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{change}</p>
        </div>
      ))}
    </section>
  );
}

export function RevenueAnalytics() {
  const bars = [30, 45, 38, 60, 72, 58, 86];
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Revenue analytics</h2>
      <div className="mt-5 flex h-40 items-end gap-2">
        {bars.map((height, index) => <div key={index} className="flex-1 rounded-t-xl bg-emerald-500" style={{ height: `${height}%` }} />)}
      </div>
    </section>
  );
}

export function CourseEngagementCharts() {
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Course engagement</h2>
      {['React Basics', 'Node APIs', 'JavaScript DOM'].map((course, index) => (
        <div key={course} className="mt-4">
          <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-300"><span>{course}</span><span>{82 - index * 14}%</span></div>
          <div className="mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-2 rounded-full bg-indigo-600" style={{ width: `${82 - index * 14}%` }} /></div>
        </div>
      ))}
    </section>
  );
}

export function DragDropLessonBuilder() {
  const [items, setItems] = useState(['Intro video', 'Concept notes', 'Practice quiz', 'Flashcards']);
  const [dragIndex, setDragIndex] = useState(null);
  const move = (targetIndex) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...items];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, removed);
    setItems(next);
    setDragIndex(null);
  };
  return (
    <section className="ldw-card p-5 lg:col-span-2">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Drag-and-drop lesson builder</h2>
      <div className="mt-4 grid gap-3">
        {items.map((item, index) => (
          <div key={item} draggable onDragStart={() => setDragIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => move(index)} className="cursor-grab rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            ⋮⋮ {item}
          </div>
        ))}
      </div>
    </section>
  );
}

export function DraftPublishSystem() {
  const [status, setStatus] = useState('DRAFT');
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Draft / publish system</h2>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Current status: <strong>{status}</strong></p>
      <div className="mt-4 flex gap-2">
        {['DRAFT', 'IN_REVIEW', 'PUBLISHED'].map((nextStatus) => <button key={nextStatus} type="button" onClick={() => setStatus(nextStatus)} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200">{nextStatus}</button>)}
      </div>
    </section>
  );
}

export function ThumbnailUploadPreview() {
  const [preview, setPreview] = useState('');
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Thumbnail preview</h2>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {preview ? <img src={preview} alt="Course thumbnail preview" className="max-h-44 rounded-2xl object-cover" /> : 'Upload thumbnail'}
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) setPreview(URL.createObjectURL(file));
        }} />
      </label>
    </section>
  );
}

export function ReviewModerationQueue() {
  const rows = useMemo(() => ['React Hooks quiz', 'Node API lesson', 'DOM roadmap'], []);
  return (
    <section className="ldw-card p-5 lg:col-span-2">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Review moderation queue</h2>
      <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((row) => <div key={row} className="flex items-center justify-between py-3"><span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{row}</span><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">Pending</span></div>)}
      </div>
    </section>
  );
}
