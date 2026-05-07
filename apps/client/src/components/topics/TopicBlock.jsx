/* eslint-disable react/prop-types */
import { CONTENT_BLOCK_TYPE } from '../../constants/contentBlockTypes';

function TopicBlock({ block }) {
  if (block.type === CONTENT_BLOCK_TYPE.HEADING) {
    return (
      <h3 className="text-xl font-bold tracking-normal text-slate-950">
        {block.content}
      </h3>
    );
  }

  if (block.type === CONTENT_BLOCK_TYPE.CODE) {
    return (
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
        {block.title ? (
          <h4 className="text-sm font-bold uppercase tracking-normal">
            {block.title}
          </h4>
        ) : null}
        <p className="mt-2 whitespace-pre-line text-sm leading-7">
          {block.content}
        </p>
      </aside>
    );
  }

  return (
    <p className="whitespace-pre-line text-base leading-8 text-slate-700">
      {block.content}
    </p>
  );
}

export default TopicBlock;
