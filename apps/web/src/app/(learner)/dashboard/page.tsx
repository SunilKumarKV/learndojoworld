"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { EmptyState } from "@/features/dashboard/components/empty-state";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { useDashboard } from "@/features/dashboard/hooks/use-dashboard";
import { useSession } from "@/hooks/use-session";
import { getActivityTimeline, getGamificationSummary, trackEvent } from "@/services/analytics.api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { logout } = useAuth();
  const { data, isLoading: dashboardLoading, isError, error } = useDashboard();
  const [summary, setSummary] = useState<{
    xp: number;
    currentLevel: number;
    nextLevelProgress: number;
    currentStreak: number;
    longestStreak: number;
  } | null>(null);
  const [timeline, setTimeline] = useState<
    Array<{ event: string; xpEarned: number; createdAt: string }>
  >([]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    void trackEvent("dashboard_opened", { path: "/dashboard" });
    void Promise.all([getGamificationSummary(), getActivityTimeline(4)]).then(
      ([summaryResponse, timelineResponse]) => {
        if (summaryResponse.success) setSummary(summaryResponse.data);
        if (timelineResponse.success) setTimeline(timelineResponse.data);
      },
    );
  }, [user]);

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
    aiUsage: {
      messagesToday: 0,
      remainingToday: 20,
      dailyLimit: 20,
      costToday: 0,
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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">XP</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">XP & level</h2>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-slate-950">{summary?.xp ?? 0} XP</p>
              <p className="mt-2 text-sm text-slate-600">Level {summary?.currentLevel ?? 1}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-primary">
                {summary?.nextLevelProgress ?? 0}% to next level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">AI Tutor</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Tutor usage</h2>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-slate-950">
                {dashboard.aiUsage.messagesToday}/{dashboard.aiUsage.dailyLimit}
              </p>
              <p className="mt-2 text-sm text-slate-600">AI chat messages used today</p>
              <p className="mt-3 text-sm text-slate-600">
                Estimated cost: ${dashboard.aiUsage.costToday.toFixed(4)}
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => router.push("/ai")}>
                Open AI Tutor
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Streak</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Learning streak</h2>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold text-slate-950">
                {summary?.currentStreak ?? 0} days
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Longest streak: {summary?.longestStreak ?? 0} days
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
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Revision due</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Spaced repetition</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Open your revision hub to review cards due today and keep your learning loop moving.
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => router.push("/revision")}>
                Open revision
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Quiz performance</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Memory checkpoints</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Start a real quiz, review explanations, and see the weak areas that need another
                pass.
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => router.push("/quizzes")}>
                Browse quizzes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Flashcards due</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Daily recall</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                Review your flashcard deck with FORGOT/HARD/GOOD/EASY scoring to build long-term
                memory.
              </p>
              <Button
                className="mt-4"
                variant="secondary"
                onClick={() => router.push("/flashcards")}
              >
                Review flashcards
              </Button>
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

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Recent activity</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Activity timeline</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {timeline.length > 0 ? (
                timeline.map((item) => (
                  <div
                    key={item.createdAt + item.event}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.event}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.2em] text-primary">
                      +{item.xpEarned} XP
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No recent activity yet"
                  description="Activity will appear here as you learn."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Achievements</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Achievement preview</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                The gamification foundation is now wired to your learner activity, XP, and streak
                signals.
              </p>
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
