"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";
import { getAdminPendingCourses, type AdminPendingCourse } from "@/services/admin.api";

export default function AdminCoursesPage() {
  const { data, error, isError, isLoading } = useQuery<AdminPendingCourse[]>({
    queryKey: ["adminPendingCourses"],
    queryFn: getAdminPendingCourses,
  });

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError || !data) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : "Unable to load pending courses."}
      />
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft-xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Pending review
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Courses waiting for moderation
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review creator-submitted courses and choose whether to approve or reject each item.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin">Back to dashboard</Link>
          </Button>
        </div>
      </section>

      {data.length === 0 ? (
        <Card>
          <CardContent className="text-slate-700">
            <p className="text-lg font-semibold text-slate-950">No pending courses</p>
            <p className="mt-2 text-sm leading-6">
              There are currently no creator courses awaiting review.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {data.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {course.category?.name ?? "No category"}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">{course.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Submitted by{" "}
                    {course.creator?.name ?? course.creator?.username ?? "Unknown creator"}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <p className="text-sm text-slate-500">
                    Updated {new Date(course.updatedAt).toLocaleDateString()}
                  </p>
                  <Button asChild size="sm">
                    <Link href={`/admin/courses/${course.id}`}>Review course</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
