/* eslint-disable react/prop-types */
import { useState } from 'react';

function RejectionReasonModal({ title, actionLabel, onCancel, onSubmit }) {
  const [reason, setReason] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(reason);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-xl"
      >
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <label className="mt-5 grid gap-2 text-sm font-semibold text-slate-700">
          Reason
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-32 rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            placeholder="Explain what the creator needs to fix or why this content was flagged."
            required
          />
        </label>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {actionLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

export default RejectionReasonModal;
