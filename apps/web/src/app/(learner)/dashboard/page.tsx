"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSession } from "@/hooks/use-session";
import { getStoredOnboardingProfile } from "@/services/onboarding.api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { logout } = useAuth();
  const onboardingProfile = getStoredOnboardingProfile();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || (!user && typeof window !== "undefined")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-soft-xl">
          <p className="text-base font-medium text-slate-700">Loading your learner dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-soft-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Learner dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {user.name ?? user.username}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Your learner dashboard shell is now onboarding-aware, with your goals, focus areas,
              and daily rhythm surfaced from your profile.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push("/onboarding")}>
              Edit onboarding
            </Button>
            <Button onClick={logout}>Logout</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Today</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Welcome card</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Your path is aligned to{" "}
                {onboardingProfile?.goals?.join(", ") ?? "your selected goals"} and{" "}
                {onboardingProfile?.topics?.join(", ") ?? "your topics"}.
              </p>
              <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Current plan</p>
                <p className="mt-2">
                  Level: {onboardingProfile?.level ?? "BEGINNER"} · Daily goal:{" "}
                  {onboardingProfile?.dailyGoalMin ?? 30} min
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Daily goal</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Daily learning time</h2>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-slate-950">
                {onboardingProfile?.dailyGoalMin ?? 30} min
              </p>
              <p className="mt-2 text-sm text-slate-600">
                A practical daily target for your learner routine.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Selected topics</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Focus areas</h2>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {(onboardingProfile?.topics ?? ["JavaScript", "React"]).map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-primary/8 px-3 py-1 text-sm text-primary"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Continue learning</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Next up</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Learning paths, modules, and progress tracking will arrive in the next iteration of
                the learner workspace.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI mentor</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Coming soon</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Personalized mentor guidance is planned for a future release and is intentionally
                not implemented here.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revision due</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Coming soon</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                A revision and spaced repetition system will appear once the learner operations
                layer is live.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
