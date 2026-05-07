/* eslint-disable react/prop-types */
function ProgressBar({ value }) {
  const normalizedValue = Math.min(Math.max(value || 0, 0), 100);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-emerald-600 transition-all"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
}

export default ProgressBar;
