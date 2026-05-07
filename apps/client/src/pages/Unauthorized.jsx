import { Link } from 'react-router-dom';

function Unauthorized() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-normal text-emerald-700">
          Access restricted
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-normal text-slate-950">
          You do not have permission to view this page.
        </h1>
        <Link
          to="/"
          className="mx-auto mt-8 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}

export default Unauthorized;
