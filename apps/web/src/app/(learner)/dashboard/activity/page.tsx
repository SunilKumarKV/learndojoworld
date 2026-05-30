"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";
import { getActivityTimeline, getGamificationSummary } from "@/services/analytics.api";

export default function ActivityPage() {
  const { user } = useSession();
  const [timeline, setTimeline] = useState<
    Array<{ event: string; xpEarned: number; createdAt: string }>
  >([]);
  const [summary, setSummary] = useState<{
    currentLevel: number;
    currentStreak: number;
    longestStreak: number;
    nextLevelProgress: number;
    xp: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;
    void Promise.all([getActivityTimeline(12), getGamificationSummary()]).then(
      ([timelineResponse, summaryResponse]) => {
        if (timelineResponse.success) setTimeline(timelineResponse.data);
        if (summaryResponse.success) setSummary(summaryResponse.data);
      },
    );
  }, [user]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Startup analytics</p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Learning activity timeline
            </h1>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">XP: {summary?.xp ?? 0}</div>
            <div className="rounded-2xl bg-slate-50 p-4">Level: {summary?.currentLevel ?? 1}</div>
            <div className="rounded-2xl bg-slate-50 p-4">
              Streak: {summary?.currentStreak ?? 0} days
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-slate-950">Recent activity</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.map((item) => (
              <div
                key={item.createdAt + item.event}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
              >
                <p className="text-sm font-semibold text-slate-900">{item.event}</p>
                <p className="text-xs text-slate-500">
                  {new Date(item.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-slate-600">XP earned: {item.xpEarned}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
