"use client";

import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCourseDetail } from "@/features/courses/hooks/use-course-detail";
import { useEnrollCourse } from "@/features/learning/hooks/use-my-learning";
import { getEnrollmentStatus } from "@/services/enrollment.api";
import { useQuery } from "@tanstack/react-query";

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const { data: course, isLoading, isError, error } = useCourseDetail(slug);
  const { mutate: enroll, isPending } = useEnrollCourse();

  const { data: enrollmentStatus } = useQuery({
    enabled: Boolean(course?.id),
    queryFn: async () => {
      const response = await getEnrollmentStatus(course!.id);
      if (!response.success)
        throw new Error(response.message || "Unable to load enrollment state.");
      return response.data;
    },
    queryKey: ["enrollment-status", course?.id],
  });

  if (isLoading)
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-slate-700">Loading course details…</main>
    );
  if (isError)
    return (
      <main className="min-h-screen bg-slate-50 p-10 text-red-700">
        {error instanceof Error ? error.message : "Course could not be loaded."}
      </main>
    );
  if (!course) return null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-8">
          <Card className="overflow-hidden border-none shadow-soft-xl">
            <CardHeader className="bg-gradient-to-r from-primary/8 to-slate-100 p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                Course detail
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950 sm:text-4xl">
                {course.title}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{course.subtitle ?? course.description}</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">{course.difficulty}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">{course.language}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  {course.category?.name ?? "General"}
                </span>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-700">{course.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Curriculum</h2>
            </CardHeader>
            <CardContent className="space-y-6">
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold text-slate-950">{module.title}</h3>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Module {module.order}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-3">
                    {module.lessons.map((lesson) => (
                      <li
                        key={lesson.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{lesson.title}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                              {lesson.type}
                            </p>
                          </div>
                          {lesson.isPreview ? (
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-700">
                              Preview
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Start learning</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Free courses enroll immediately in this foundation release.
              </p>
              <Button
                className="w-full"
                disabled={isPending || enrollmentStatus?.enrolled}
                onClick={() => enroll(course.id)}
              >
                {enrollmentStatus?.enrolled
                  ? "Already enrolled"
                  : course.isFree
                    ? "Enroll for free"
                    : "Enroll"}
              </Button>
              <p className="text-xs text-slate-500">
                Status: {enrollmentStatus?.enrolled ? "You are enrolled" : "Not enrolled yet"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-slate-950">Course snapshot</h2>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <p>Difficulty: {course.difficulty}</p>
              <p>Language: {course.language}</p>
              <p>Price: {course.isFree ? "Free" : `${course.price} ${course.currency}`}</p>
              <p>
                Preview lessons:{" "}
                {
                  course.modules
                    .flatMap((module) => module.lessons)
                    .filter((lesson) => lesson.isPreview).length
                }
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
