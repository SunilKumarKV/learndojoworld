import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({
  title,
  description,
  ctaLabel,
  ctaHref,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:grid lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-12">
        <section className="rounded-[2rem] border border-slate-200 bg-white/90 p-10 shadow-soft-xl backdrop-blur-xl sm:p-12">
          <div className="max-w-xl space-y-6">
            <div className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              Learner experience, secure access
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                {title}
              </h1>
              <p className="text-base leading-7 text-slate-600">{description}</p>
            </div>
            <div className="grid gap-4 text-sm text-slate-600">
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Secure learner workspace</p>
                <p className="mt-2">
                  Fast onboarding to your dashboard with protected session handling and token
                  refresh support.
                </p>
              </div>
              <div className="rounded-3xl bg-slate-50 p-5">
                <p className="font-semibold text-slate-900">Responsive SaaS-first interface</p>
                <p className="mt-2">
                  Designed for both mobile and desktop learners with modern form validation and
                  state feedback.
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="secondary" size="sm">
                <a href={ctaHref}>{ctaLabel}</a>
              </Button>
              <a
                href="/"
                className="rounded-full border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Back to home
              </a>
            </div>
          </div>
        </section>

        <div className={cn("rounded-[2rem] border bg-white/95 p-8 shadow-soft-xl sm:p-10")}>
          {children}
        </div>
      </div>
      {footer ? (
        <div className="mx-auto mt-8 max-w-6xl text-center text-sm text-slate-500">{footer}</div>
      ) : null}
    </div>
  );
}
