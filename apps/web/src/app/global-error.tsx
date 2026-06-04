"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error);
    }
  }, [error]);

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <section className="max-w-lg rounded-lg border border-slate-200 bg-white p-8 text-center shadow-soft-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              LearnDojoWorld
            </p>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950">Something went wrong.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              We could not render this page. The issue has been captured if monitoring is
              configured.
            </p>
            {error.digest ? (
              <p className="mt-4 text-xs text-slate-500">Reference: {error.digest}</p>
            ) : null}
            <div className="mt-6 flex justify-center">
              <Button onClick={() => reset()} type="button">
                Try again
              </Button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
