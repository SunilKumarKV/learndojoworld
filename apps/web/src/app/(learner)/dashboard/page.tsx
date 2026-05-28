"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { useSession } from "@/hooks/use-session";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { logout } = useAuth();
  const { data, isLoading: dashboardLoading, isError, error } = useDashboard();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  if (isLoading || dashboardLoading || (!user && typeof window !== "undefined")) {
    return <LoadingState />;
  }

  if (!user) {
    return null;
  }

  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "We could not load your dashboard."}
      />
    );
  }

  const dashboard = data ?? {
    continueLearning: null,
    profile: {
      dailyGoalMin: 30,
      fullName: user.name ?? user.username ?? "Learner",
      goals: [],
      learningStyle: [],
      skillLevel: "BEGINNER",
      topics: [],
    },
    recommendations: [],
    roadmap: [],
    stats: {
      completedLessons: 0,
      currentStreak: 0,
      dailyGoalMin: 30,
      enrolledCourses: 0,
      todayLearningMin: 0,
      xp: 0,
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-soft-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Learner dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {dashboard.profile.fullName || user.name || user.username}.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Your learner dashboard now uses real learner profile and progress data from the
              backend foundation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push("/onboarding?edit=1")}>
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
                {dashboard.profile.goals.join(", ") || "your selected goals"} and{" "}
                {dashboard.profile.topics.join(", ") || "your topics"}.
              </p>
              <div className="mt-5 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Current plan</p>
                <p className="mt-2">
                  Level: {dashboard.profile.skillLevel || "BEGINNER"} · Daily goal:{" "}
                  {dashboard.profile.dailyGoalMin} min
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
                {dashboard.profile.dailyGoalMin} min
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
                {(dashboard.profile.topics.length > 0
                  ? dashboard.profile.topics
                  : ["No topics selected yet"]
                ).map((topic) => (
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
              {dashboard.continueLearning ? (
                <>
                  <p className="text-sm font-semibold text-slate-900">
                    {dashboard.continueLearning.courseTitle}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {dashboard.continueLearning.lessonTitle}
                  </p>
                  <p className="mt-3 text-sm text-primary">
                    {dashboard.continueLearning.progressPercent}% complete
                  </p>
                </>
              ) : (
                <EmptyState
                  title="No active lesson yet"
                  description="Your continue-learning card will appear here when course progress is added."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">XP & streak</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Progress foundation</h2>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-slate-950">{dashboard.stats.xp} XP</p>
              <p className="mt-2 text-sm text-slate-600">
                Current streak: {dashboard.stats.currentStreak} day(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Roadmap</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">
                Personalized learning path
              </h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.roadmap.length > 0 ? (
                dashboard.roadmap.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary">
                      {item.status}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No roadmap items yet"
                  description="Your roadmap will be generated from your onboarding topics and goals."
                />
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Recommended next actions
              </p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">What to do next</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboard.recommendations.map((item) => (
                <div
                  key={`${item.title}-${item.type}`}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary">
                    {item.type}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
