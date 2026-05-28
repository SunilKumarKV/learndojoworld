"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { useSession } from "@/hooks/use-session";
import { getStoredOnboardingProfile } from "@/services/onboarding.api";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
      return;
    }

    if (!isLoading && user && getStoredOnboardingProfile()) {
      router.replace("/dashboard");
    }
  }, [isLoading, router, user]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-10 shadow-soft-xl">
          <p className="text-base font-medium text-slate-700">Preparing your onboarding session…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <section className="rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-soft-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
            Startup-grade onboarding
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Create your learner path
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            The onboarding flow is the first step toward a personalized learning dashboard for your
            startup-grade learner experience.
          </p>
        </section>

        <OnboardingFlow />
      </div>
    </main>
  );
}
