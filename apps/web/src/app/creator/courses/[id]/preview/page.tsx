"use client";

import { ArrowLeft, FileText } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCreatorCourse } from "@/features/creator/hooks/use-creator";
import { ErrorState } from "@/features/dashboard/components/error-state";
import { LoadingState } from "@/features/dashboard/components/loading-state";

export default function CreatorCoursePreviewPage() {
  const params = useParams();
  const courseId = typeof params.id === "string" ? params.id : undefined;
  const { data: course, error, isError, isLoading } = useCreatorCourse(courseId);

  if (isLoading) return <LoadingState />;
  if (isError || !course) {
    return (
      <ErrorState message={error instanceof Error ? error.message : "Unable to load preview."} />
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-soft-xl">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/creator/courses/${course.id}/edit` as Route}>
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Edit course
          </Link>
        </Button>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Course Preview
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          {course.title}
        </h2>
        {course.subtitle ? <p className="mt-3 text-lg text-slate-600">{course.subtitle}</p> : null}
        <p className="mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 text-slate-700">
          {course.description}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="rounded-md bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            {course.status}
          </span>
          <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {course.difficulty}
          </span>
          <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {course.language}
          </span>
        </div>
      </section>

      <section className="space-y-4">
        {course.modules.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <FileText className="h-8 w-8 text-primary" />
              <h3 className="mt-4 text-xl font-semibold text-slate-950">No curriculum yet</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Add modules and lessons in the builder to preview the full learner experience.
              </p>
            </CardContent>
          </Card>
        ) : (
          course.modules.map((module) => (
            <Card key={module.id}>
              <CardHeader>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Module {module.order}
                </p>
                <h3 className="text-xl font-semibold text-slate-950">{module.title}</h3>
              </CardHeader>
              <CardContent className="space-y-4">
                {module.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      {lesson.type}
                    </p>
                    <h4 className="mt-2 text-lg font-semibold text-slate-950">{lesson.title}</h4>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {lesson.content}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
