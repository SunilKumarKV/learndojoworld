/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react';

const cards = [
  { front: 'What is React state?', back: 'Data owned by a component that can change over time and trigger UI updates.' },
  { front: 'What is props?', back: 'Read-only data passed from parent components to child components.' },
  { front: 'What is useEffect?', back: 'A Hook used to synchronize a component with external systems.' },
];

export function InteractiveFlashcards() {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  return (
    <section className="ldw-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Interactive flashcards</h2>
        <span className="text-sm text-slate-500 dark:text-slate-400">{index + 1}/{cards.length}</span>
      </div>
      <button type="button" onClick={() => setFlipped((value) => !value)} className="mt-4 min-h-40 w-full rounded-3xl border border-dashed border-emerald-300 bg-emerald-50 p-6 text-left transition hover:-translate-y-1 dark:border-emerald-800 dark:bg-emerald-950/30">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">{flipped ? 'Answer' : 'Question'}</p>
        <p className="mt-3 text-xl font-bold text-slate-950 dark:text-white">{flipped ? card.back : card.front}</p>
      </button>
      <div className="mt-4 flex gap-3">
        <button type="button" onClick={() => { setIndex((index + 1) % cards.length); setFlipped(false); }} className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Next card</button>
        <button type="button" onClick={() => setFlipped(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">Again</button>
      </div>
    </section>
  );
}

export function SmoothQuizAnimations() {
  const [selected, setSelected] = useState('');
  const options = ['Virtual DOM', 'Database', 'CSS compiler', 'Router only'];
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Smooth quiz animation</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">What makes React efficient for UI updates?</p>
      <div className="mt-4 grid gap-3">
        {options.map((option) => (
          <button key={option} type="button" onClick={() => setSelected(option)} className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition duration-200 hover:-translate-y-0.5 ${selected === option ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100' : 'border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200'}`}>
            {option}
          </button>
        ))}
      </div>
    </section>
  );
}

export function useRealtimeProgressSaving(storageKey, value) {
  const [status, setStatus] = useState('Saved');
  useEffect(() => {
    setStatus('Saving...');
    const timeout = window.setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify(value));
      setStatus('Saved');
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [storageKey, value]);
  return status;
}

export function VideoNotesSplitLayout() {
  const [notes, setNotes] = useState('Key point: React updates UI when state changes.');
  const status = useRealtimeProgressSaving('ldw:lesson-notes', notes);
  return (
    <section className="ldw-card p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Video + notes split layout</h2>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">{status}</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="flex aspect-video items-center justify-center rounded-3xl bg-slate-950 text-white">▶ Lesson video placeholder</div>
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="min-h-56 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
      </div>
    </section>
  );
}

export function FocusModePanel() {
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('ldw-focus-mode', focus);
    return () => document.documentElement.classList.remove('ldw-focus-mode');
  }, [focus]);
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Focus mode</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Hides noisy UI and makes the learning area distraction-free.</p>
      <button type="button" onClick={() => setFocus((value) => !value)} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">{focus ? 'Exit focus mode' : 'Enter focus mode'}</button>
    </section>
  );
}

export function AiGeneratedSummary() {
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">AI summary</h2>
      <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-900 dark:text-slate-200">React components should be small, reusable, and state should stay as close as possible to where it is needed.</p>
    </section>
  );
}

export function AiGeneratedQuiz() {
  const questions = useMemo(() => ['What is state?', 'When should you use props?', 'Why use keys in lists?'], []);
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">AI quiz generator</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700 dark:text-slate-200">
        {questions.map((question) => <li key={question}>{question}</li>)}
      </ol>
    </section>
  );
}

export function VoiceExplanationSupport() {
  const [speaking, setSpeaking] = useState(false);
  const text = 'React state stores changing component data and re-renders the UI when updated.';
  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };
  return (
    <section className="ldw-card p-5">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Voice explanation</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Browser-based voice support. No backend needed.</p>
      <button type="button" onClick={speak} className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">{speaking ? 'Speaking...' : 'Play explanation'}</button>
    </section>
  );
}

export function AnimatedConceptBlocks() {
  return (
    <section className="ldw-card p-5 lg:col-span-2">
      <h2 className="text-lg font-bold text-slate-950 dark:text-white">Animated concept blocks</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {['Learn', 'Practice', 'Revise'].map((label, index) => (
          <div key={label} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900" style={{ transitionDelay: `${index * 80}ms` }}>
            <p className="text-2xl">{index === 0 ? '📘' : index === 1 ? '🧪' : '🔁'}</p>
            <h3 className="mt-3 font-bold text-slate-950 dark:text-white">{label}</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Micro-interactions make the learning flow feel alive.</p>
          </div>
        ))}
      </div>
    </section>
  );
}
