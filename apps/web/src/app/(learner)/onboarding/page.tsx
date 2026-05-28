"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { useOnboardingStatus } from "@/features/onboarding/hooks/use-onboarding-status";
import { useSession } from "@/hooks/use-session";

export default function OnboardingPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <OnboardingPageContent />
    </Suspense>
  );
}

function LoadingState() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-center rounded-[2rem] border border-slate-200 bg-white p-10 shadow-soft-xl">
        <p className="text-base font-medium text-slate-700">Preparing your onboarding session…</p>
      </div>
    </main>
  );
}

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditing = searchParams.get("edit") === "1";
  const { user, isLoading: sessionLoading, isError: sessionError } = useSession();
  const {
    data: onboardingStatus,
    isLoading: onboardingLoading,
    isError: onboardingError,
  } = useOnboardingStatus(Boolean(user), user?.id);
  const initialProfile = onboardingStatus ? { ...onboardingStatus } : undefined;

  useEffect(() => {
    if (!sessionLoading && !user) {
      router.replace("/login");
      return;
    }

    if (!sessionLoading && user && onboardingStatus?.completed && !isEditing) {
      router.replace("/dashboard");
    }
  }, [isEditing, onboardingStatus, router, sessionLoading, user]);

  if (sessionLoading || onboardingLoading) {
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

  if (sessionError || onboardingError) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center rounded-[2rem] border border-red-200 bg-red-50 p-10 text-center shadow-soft-xl">
          <p className="text-base font-medium text-red-700">
            We could not load your onboarding status right now.
          </p>
        </div>
      </main>
    );
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

        <OnboardingFlow initialProfile={initialProfile} />
      </div>
    </main>
  );
}
