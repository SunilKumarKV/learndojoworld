/* eslint-disable react/prop-types */
import { useState } from 'react';

function AskDoubtModal({ isOpen, onClose, onSubmit, topic }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoTimestampSeconds, setVideoTimestampSeconds] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        title,
        content,
        topicPageId: topic.id,
        roadmapNodeId: topic.roadmapNode?.id,
        videoTimestampSeconds: videoTimestampSeconds
          ? Number(videoTimestampSeconds)
          : undefined,
      });
      setTitle('');
      setContent('');
      setVideoTimestampSeconds('');
      onClose();
    } catch (requestError) {
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          'Unable to ask doubt'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-950">Ask a doubt</h2>
          <p className="mt-1 text-sm text-slate-600">{topic.title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Doubt title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="What part is confusing?"
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Details
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Describe what you tried and where you got stuck."
              required
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Video timestamp seconds
            <input
              type="number"
              min="0"
              value={videoTimestampSeconds}
              onChange={(event) => setVideoTimestampSeconds(event.target.value)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-normal text-slate-950 shadow-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              placeholder="Optional"
            />
          </label>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSubmitting ? 'Posting...' : 'Post doubt'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default AskDoubtModal;
