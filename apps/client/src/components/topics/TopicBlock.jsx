/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { createFlashcard } from '../../features/flashcards/flashcardsApi';
import { CONTENT_BLOCK_TYPE } from '../../constants/contentBlockTypes';

function TopicBlock({ block, topicId, topicTitle }) {
  const { tokens } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState('');

  async function handleSaveFlashcard() {
    setIsSaving(true);
    setStatus('');

    try {
      await createFlashcard(tokens.accessToken, {
        topicPageId: topicId,
        frontText: block.title
          ? `${block.title} — ${block.content}`
          : block.content,
        backText: `From ${topicTitle}`,
      });
      setStatus('Saved to flashcards');
    } catch (error) {
      setStatus('Unable to save flashcard');
    } finally {
      setIsSaving(false);
    }
  }

  const blockContent = (
    <div className="space-y-3">
      {block.title ? (
        <h4 className="text-sm font-bold uppercase tracking-normal text-slate-900">
          {block.title}
        </h4>
      ) : null}
      {block.type === CONTENT_BLOCK_TYPE.CODE ? (
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
            <span className="text-sm font-semibold text-slate-200">
              {block.title || 'Code'}
            </span>
            {block.language ? (
              <span className="text-xs uppercase tracking-normal text-slate-400">
                {block.language}
              </span>
            ) : null}
          </div>
          <pre className="overflow-x-auto p-4 text-sm leading-6 text-emerald-100">
            <code>{block.content}</code>
          </pre>
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
          {block.content}
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleSaveFlashcard}
          disabled={isSaving}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save as flashcard'}
        </button>
        {status ? (
          <p className="text-sm text-slate-600">{status}</p>
        ) : null}
      </div>
    </div>
  );

  if (block.type === CONTENT_BLOCK_TYPE.HEADING) {
    return (
      <div className="rounded-lg border border-slate-200 p-4">
        <h3 className="text-xl font-bold tracking-normal text-slate-950">
          {block.content}
        </h3>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={handleSaveFlashcard}
            disabled={isSaving}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : 'Save as flashcard'}
          </button>
          {status ? (
            <p className="text-sm text-slate-600">{status}</p>
          ) : null}
        </div>
      </div>
    );
  }

  const styles = {
    [CONTENT_BLOCK_TYPE.EXAMPLE]:
      'border-emerald-200 bg-emerald-50 text-emerald-950',
    [CONTENT_BLOCK_TYPE.REAL_WORLD_EXAMPLE]:
      'border-sky-200 bg-sky-50 text-sky-950',
    [CONTENT_BLOCK_TYPE.COMMON_MISTAKE]:
      'border-red-200 bg-red-50 text-red-950',
    [CONTENT_BLOCK_TYPE.WARNING]: 'border-amber-200 bg-amber-50 text-amber-950',
    [CONTENT_BLOCK_TYPE.TIP]: 'border-teal-200 bg-teal-50 text-teal-950',
    [CONTENT_BLOCK_TYPE.QUIZ_REFERENCE]:
      'border-violet-200 bg-violet-50 text-violet-950',
    [CONTENT_BLOCK_TYPE.VIDEO_REFERENCE]:
      'border-indigo-200 bg-indigo-50 text-indigo-950',
  };

  if (styles[block.type]) {
    return (
      <aside className={`rounded-lg border p-4 ${styles[block.type]}`}>
        {blockContent}
      </aside>
    );
  }

  return <div className="rounded-lg border border-slate-200 p-4">{blockContent}</div>;
}

export default TopicBlock;
