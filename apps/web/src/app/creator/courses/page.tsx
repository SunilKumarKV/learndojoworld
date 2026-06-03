"use client";

import { BookOpen, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorCourses } from "@/features/creator/hooks/use-creator";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";

export default function CreatorCoursesPage() {
  const { data: courses = [], error, isError, isLoading } = useCreatorCourses();

  if (isLoading) return <LoadingState />;
  if (isError) {
    return (
      <ErrorState message={error instanceof Error ? error.message : "Unable to load courses."} />
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Creator courses
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
          Course list foundation
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          This page lists courses owned by your creator account. Builder and publishing workflows
          are intentionally coming later.
        </p>
      </section>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-5 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-4 inline-flex rounded-md bg-primary/10 p-3 text-primary">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-950">No creator courses yet</h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                The course builder is not enabled. When it lands, your drafts and published courses
                will appear here.
              </p>
            </div>
            <Button disabled type="button" variant="secondary">
              <Clock aria-hidden className="h-4 w-4" />
              Course builder coming soon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <Card key={course.id}>
              <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    {course.status}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{course.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {course.moduleCount} modules · {course.enrollmentCount} learners
                  </p>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {course.difficulty}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
