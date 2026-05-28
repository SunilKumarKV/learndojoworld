"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useSession } from "@/hooks/use-session";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { logout } = useAuth();

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
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/95 p-8 shadow-soft-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Learner dashboard
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Welcome back, {user.name ?? user.username}.
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your protected learner page is now active. Stay focused, track progress, and access
              your personalized journey.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => router.push("/")}>
              Home
            </Button>
            <Button onClick={logout}>Logout</Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Account summary</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Your learner profile</h2>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm text-slate-700 sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-slate-900">Name</dt>
                  <dd className="mt-1">{user.name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Username</dt>
                  <dd className="mt-1">{user.username}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Email</dt>
                  <dd className="mt-1">{user.email}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-900">Last access</dt>
                  <dd className="mt-1">
                    {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Session status</p>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">Protected access</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">
                Your dashboard is protected by a secure token-based session. If your session
                expires, the app will attempt to refresh it automatically.
              </p>
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Access scope</p>
                <p className="mt-2">
                  Only authenticated learners can see this page. Unauthorized users are redirected
                  to the login page.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
