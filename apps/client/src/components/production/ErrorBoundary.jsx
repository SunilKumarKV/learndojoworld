import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('LearnDojoWorld UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
          <section className="max-w-md rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-4xl">🛠️</p>
            <h1 className="mt-4 text-xl font-black text-slate-950 dark:text-white">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Refresh the page. If it continues, check the browser console and API logs.</p>
            <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950">Refresh</button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
