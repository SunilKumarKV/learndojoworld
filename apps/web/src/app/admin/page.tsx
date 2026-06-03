"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { getAdminDashboard, type AdminDashboardData } from "@/services/admin.api";

export default function AdminPage() {
  const { data, error, isError, isLoading } = useQuery<AdminDashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: getAdminDashboard,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load admin dashboard."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Admin dashboard
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Moderation overview
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review pending creator courses, approve or reject content, and keep creator workflow
              intact.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/courses">Review pending courses</Link>
          </Button>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Pending courses</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{data.pendingCourses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Published courses</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{data.publishedCourses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Rejected courses</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{data.rejectedCourses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Total users</p>
            <p className="mt-4 text-4xl font-semibold text-slate-950">{data.totalUsers}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
