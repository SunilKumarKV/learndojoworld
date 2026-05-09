import { useEffect, useState } from 'react';

function SessionRecoveryBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const draft = localStorage.getItem('ldw:lesson-notes');
    setShow(Boolean(draft));
  }, []);

  if (!show) return null;

  return (
    <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-center text-sm font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
      Session recovered: your latest notes/progress are saved locally.
      <button type="button" onClick={() => setShow(false)} className="ml-3 underline">Dismiss</button>
    </div>
  );
}

export default SessionRecoveryBanner;
