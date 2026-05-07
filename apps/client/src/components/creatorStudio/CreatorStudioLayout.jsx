/* eslint-disable react/prop-types */
import { NavLink } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';

const STUDIO_TABS = [
  ['Creator dashboard', '/creator'],
  ['My courses', '/creator/courses'],
  ['Course builder', '/creator/courses/new'],
  ['Topic block editor', '/creator/topics/new'],
  ['Submit for review', '/creator/submit-review'],
];

function CreatorStudioLayout({ title, children, actions }) {
  return (
    <AppLayout eyebrow="LearnDojoWorld Creator Studio" title={title}>
      <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <nav className="flex flex-wrap gap-2 text-sm font-semibold">
          {STUDIO_TABS.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/creator'}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 transition ${
                  isActive
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </AppLayout>
  );
}

export default CreatorStudioLayout;
