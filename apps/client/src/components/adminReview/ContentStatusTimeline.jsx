/* eslint-disable react/prop-types */
import StatusBadge from '../creatorStudio/StatusBadge';

function formatDate(value) {
  if (!value) {
    return 'Pending';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ContentStatusTimeline({ timeline = [] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Content status timeline
      </h2>
      <div className="mt-5 space-y-4">
        {timeline.map((event) => (
          <div key={event.id} className="flex gap-3">
            <div className="mt-1 h-3 w-3 flex-none rounded-full bg-emerald-600" />
            <div className="min-w-0 flex-1 rounded-md border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={event.toStatus} />
                {event.fromStatus ? (
                  <span className="text-xs font-medium text-slate-500">
                    from {event.fromStatus}
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {formatDate(event.createdAt)}
              </p>
              {event.actor ? (
                <p className="mt-1 text-sm text-slate-600">
                  By {event.actor.name || event.actor.email}
                </p>
              ) : null}
              {event.reason ? (
                <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {event.reason}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ContentStatusTimeline;
