/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';
import {
  NODE_PROGRESS_LABELS,
  NODE_PROGRESS_STATUS,
} from '../../constants/nodeProgressStatus';

const STATUS_STYLES = Object.freeze({
  [NODE_PROGRESS_STATUS.NOT_STARTED]:
    'border-slate-200 bg-slate-50 text-slate-700',
  [NODE_PROGRESS_STATUS.IN_PROGRESS]: 'border-sky-200 bg-sky-50 text-sky-800',
  [NODE_PROGRESS_STATUS.COMPLETED]:
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  [NODE_PROGRESS_STATUS.NEEDS_REVISION]:
    'border-amber-200 bg-amber-50 text-amber-800',
});

function RoadmapNodeCard({ node, roadmapId }) {
  const status = node.progress?.status || NODE_PROGRESS_STATUS.NOT_STARTED;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-slate-500">
            Node {node.order + 1}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-950">
            {node.title}
          </h3>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[status]
          }`}
        >
          {NODE_PROGRESS_LABELS[status]}
        </span>
      </div>

      {node.summary ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{node.summary}</p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          {node.prerequisites?.length
            ? `${node.prerequisites.length} prerequisite${
                node.prerequisites.length === 1 ? '' : 's'
              }`
            : 'No prerequisites'}
        </p>
        <Link
          to={`/roadmaps/${roadmapId}/nodes/${node.id}`}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Open node
        </Link>
      </div>
    </article>
  );
}

export default RoadmapNodeCard;
