/* eslint-disable react/prop-types */
import { Link } from 'react-router-dom';

function AuthLayout({ children, footer, title }) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm lg:grid-cols-[0.95fr_1.05fr]">
          <section className="hidden bg-slate-900 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <Link to="/" className="text-xl font-bold tracking-normal">
              LearnDojoWorld
            </Link>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
                LearnDojo
              </p>
              <h1 className="mt-4 text-4xl font-bold leading-tight tracking-normal">
                LearnDojoWorld
              </h1>
            </div>
            <p className="text-sm text-slate-400">ADMIN | CREATOR | LEARNER</p>
          </section>

          <section className="px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto max-w-md">
              <Link
                to="/"
                className="text-xl font-bold text-slate-950 lg:hidden"
              >
                LearnDojoWorld
              </Link>
              <h2 className="mt-8 text-2xl font-bold tracking-normal text-slate-950 lg:mt-0">
                {title}
              </h2>
              {children}
              {footer ? (
                <div className="mt-6 text-sm text-slate-600">{footer}</div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default AuthLayout;
