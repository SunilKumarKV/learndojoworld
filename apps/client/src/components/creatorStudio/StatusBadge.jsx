/* eslint-disable react/prop-types */
import { COURSE_STATUS } from '../../constants/courseStatus';

const STATUS_STYLES = {
  [COURSE_STATUS.DRAFT]: 'border-slate-200 bg-slate-50 text-slate-700',
  [COURSE_STATUS.SUBMITTED]: 'border-amber-200 bg-amber-50 text-amber-800',
  [COURSE_STATUS.APPROVED]: 'border-sky-200 bg-sky-50 text-sky-800',
  [COURSE_STATUS.PUBLISHED]:
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  [COURSE_STATUS.REJECTED]: 'border-red-200 bg-red-50 text-red-800',
  [COURSE_STATUS.FLAGGED]: 'border-violet-200 bg-violet-50 text-violet-800',
};

function formatStatus(status) {
  return status
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] || STATUS_STYLES[COURSE_STATUS.DRAFT]
      }`}
    >
      {formatStatus(status || COURSE_STATUS.DRAFT)}
    </span>
  );
}

export default StatusBadge;
